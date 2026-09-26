from sqlalchemy.orm import Session
import networkx as nx
from typing import Optional, List
from app.models.graph import GraphNode, GraphEdge
from app.models.building_element import BuildingElement
from app.models.simulation import SimulationRun
from app.core.safety_graph import safety_graph_engine
from app.services.sensor_service import sensor_service
from app.schemas.graph import SafetyGraphResponse, GraphNodeSchema, GraphEdgeSchema, ConnectivityStatus

class GraphService:
    @staticmethod
    def sync_project_graph(project_id: int, db: Session):
        """
        Populates graph_nodes and graph_edges in database for this project.
        """
        # If project already has custom graph nodes (e.g. from voice synthesis), preserve them
        existing_nodes = db.query(GraphNode).filter(GraphNode.project_id == project_id).all()
        if existing_nodes and len(existing_nodes) > 0:
            return

        # Clear existing graph data for project
        db.query(GraphEdge).filter(GraphEdge.project_id == project_id).delete()
        db.query(GraphNode).filter(GraphNode.project_id == project_id).delete()

        G = safety_graph_engine.build_demo_graph()

        for node_id, data in G.nodes(data=True):
            node_row = GraphNode(
                project_id=project_id,
                node_key=node_id,
                node_type=data.get("type", "UNKNOWN"),
                label=data.get("label", node_id)
            )
            db.add(node_row)

        for u, v, data in G.edges(data=True):
            edge_row = GraphEdge(
                project_id=project_id,
                source_node=u,
                target_node=v,
                relationship=data.get("relationship", "CONNECTS_TO")
            )
            db.add(edge_row)

        db.commit()

    @staticmethod
    def get_project_graph(project_id: int, db: Session) -> SafetyGraphResponse:
        """
        Retrieves graph representation for project, with dynamic articulation points,
        active simulation overlay, and live IoT sensor hazards recalculation.
        """
        # 0. Load custom nodes and edges from database if they exist
        db_nodes = db.query(GraphNode).filter(GraphNode.project_id == project_id).all()
        db_edges = db.query(GraphEdge).filter(GraphEdge.project_id == project_id).all()
        db_elements = {
            e.label: e for e in db.query(BuildingElement).filter(BuildingElement.project_id == project_id).all()
        }

        if db_nodes and len(db_nodes) > 0 and db_edges and len(db_edges) > 0:
            G = nx.Graph()
            room_idx = 0
            door_idx = 0
            corr_idx = 0
            stair_idx = 0
            exit_idx = 0
            ramp_idx = 0
            other_idx = 0

            for idx, n in enumerate(db_nodes):
                elem = db_elements.get(n.label) or db_elements.get(n.node_key)
                ntype = (n.node_type or "ROOM").upper()

                if elem and elem.x and elem.y and (elem.x != 100 or elem.y != 100):
                    pos = {"x": elem.x, "y": elem.y}
                else:
                    if ntype == "ROOM":
                        col = room_idx % 2
                        row = room_idx // 2
                        pos = {"x": 100 if col == 0 else 240, "y": 100 + row * 130}
                        room_idx += 1
                    elif ntype == "DOOR":
                        col = door_idx % 2
                        row = door_idx // 2
                        pos = {"x": 360 if col == 0 else 460, "y": 100 + row * 110}
                        door_idx += 1
                    elif ntype == "CORRIDOR":
                        pos = {"x": 580, "y": 130 + corr_idx * 140}
                        corr_idx += 1
                    elif ntype in ["STAIR", "RAMP"]:
                        pos = {"x": 720, "y": 160 + (stair_idx + ramp_idx) * 130}
                        if ntype == "STAIR":
                            stair_idx += 1
                        else:
                            ramp_idx += 1
                    elif ntype == "EXIT":
                        pos = {"x": 880, "y": 180 + exit_idx * 160}
                        exit_idx += 1
                    else:
                        pos = {"x": 400 + (other_idx % 3) * 150, "y": 450 + (other_idx // 3) * 100}
                        other_idx += 1

                G.add_node(
                    n.node_key,
                    id=n.node_key,
                    type=ntype,
                    label=n.label or n.node_key,
                    position=pos,
                    is_blocked=False,
                    is_affected=False,
                    is_bottleneck=False
                )

            for e in db_edges:
                G.add_edge(e.source_node, e.target_node, relationship=e.relationship or "CONNECTS_TO")
        else:
            # Fallback to demo graph
            G = safety_graph_engine.build_demo_graph()

        # 1. Check if there is an active simulation run for this project
        latest_sim = (
            db.query(SimulationRun)
            .filter(SimulationRun.project_id == project_id)
            .order_by(SimulationRun.id.desc())
            .first()
        )

        blocked_target = None
        affected_rooms = []
        if latest_sim and latest_sim.action == "BLOCK":
            blocked_target = latest_sim.target_element
            if latest_sim.affected_rooms:
                affected_rooms = latest_sim.affected_rooms

        # 2. Check active sensor hazards from IoT building sensors
        hazard_nodes = {}
        sensor_summary = sensor_service.get_sensor_summary(project_id, db)
        for alert in sensor_summary.get("active_alerts", []):
            elem_lbl = alert.get("element_label", "")
            s_id = alert.get("sensor_id", "")
            loc = alert.get("location", "")
            norm_lbl = elem_lbl.strip().lower()
            norm_key = norm_lbl.replace(" ", "_")
            matched_node = None
            
            for n_id, data in G.nodes(data=True):
                node_lbl = data.get("label", "").lower()
                n_key = n_id.lower()
                # 1. Exact match on label or key
                if norm_lbl == node_lbl or norm_key == n_key:
                    matched_node = n_id
                    break
                # 2. Substring match on label
                if norm_lbl and len(norm_lbl) > 2 and (norm_lbl in node_lbl or node_lbl in norm_lbl):
                    matched_node = n_id
                    break
                # 3. Sensor ID or location mentions node key or label
                if n_key in s_id.lower() or (n_key and n_key in loc.lower()):
                    matched_node = n_id
                    break
                if node_lbl and len(node_lbl) > 2 and (node_lbl in loc.lower() or node_lbl in s_id.lower()):
                    matched_node = n_id
                    break
            
            if not matched_node:
                # Fallback to the first corridor or room in graph so building alerts are never lost
                for n_id, data in G.nodes(data=True):
                    if data.get("type") in ["CORRIDOR", "ROOM"]:
                        matched_node = n_id
                        break
            
            if matched_node:
                hazard_nodes[matched_node] = alert

        # 3. Aggregate all blocked/hazardous nodes
        all_blocked = set()
        if blocked_target:
            all_blocked.add(blocked_target)
        for h_node, alert in hazard_nodes.items():
            if alert.get("status") in ["CRITICAL_ALERT", "WARNING", "CRITICAL"]:
                all_blocked.add(h_node)

        # 4. Baseline and dynamic articulation points
        art_points = safety_graph_engine.get_articulation_points(G)

        # 5. Check dynamic connectivity with sensor hazards isolated
        connectivity_list, disconnected_rooms, lost_conn = safety_graph_engine.check_connectivity(
            G=G, blocked_nodes=list(all_blocked) if all_blocked else None
        )

        # 6. Determine dynamic safety state
        if lost_conn or len(disconnected_rooms) > 0:
            dynamic_safety_state = "BLOCKED"
        elif len(hazard_nodes) > 0 or len(sensor_summary.get("active_alerts", [])) > 0:
            dynamic_safety_state = "HAZARD"
        elif blocked_target:
            dynamic_safety_state = "WARNING"
        else:
            dynamic_safety_state = "SAFE"

        # 7. Collect edges on active safe egress paths
        safe_path_edges = set()
        for c in connectivity_list:
            p = c.get("path", [])
            for i in range(len(p) - 1):
                safe_path_edges.add((p[i], p[i+1]))
                safe_path_edges.add((p[i+1], p[i]))

        # 8. Build nodes schema with live sensor hazard badges
        nodes_schema = []
        for node_id, data in G.nodes(data=True):
            h_info = hazard_nodes.get(node_id)
            is_blocked = (node_id in all_blocked)
            is_affected = (
                data.get("label") in affected_rooms or
                node_id in affected_rooms or
                data.get("label") in disconnected_rooms
            )
            is_ap = node_id in art_points

            nodes_schema.append(GraphNodeSchema(
                id=node_id,
                type=data.get("type", "UNKNOWN"),
                label=data.get("label", node_id),
                is_blocked=is_blocked,
                is_affected=is_affected,
                is_bottleneck=is_ap,
                is_hazard=h_info is not None,
                hazard_type=h_info.get("sensor_type") if h_info else None,
                sensor_reading=f"{h_info.get('current_value')} {h_info.get('unit')}" if h_info else None,
                sensor_id=h_info.get("sensor_id") if h_info else None,
                hazard_message=h_info.get("alert_message") if h_info else None,
                position=data.get("position", {"x": 100, "y": 100})
            ))

        # 9. Build edges schema
        edges_schema = []
        for u, v, data in G.edges(data=True):
            edge_affected = (u in all_blocked or v in all_blocked)
            is_egress = (u, v) in safe_path_edges and not edge_affected
            edges_schema.append(GraphEdgeSchema(
                source=u,
                target=v,
                relationship=data.get("relationship", "CONNECTS_TO"),
                animated=is_egress,
                is_affected=edge_affected,
                is_egress=is_egress
            ))

        connectivity_schema = [
            ConnectivityStatus(
                room=c["room"],
                connected_to_exit=c["connected_to_exit"],
                nearest_exit=c.get("nearest_exit"),
                path=c.get("path", [])
            )
            for c in connectivity_list
        ]

        return SafetyGraphResponse(
            nodes=nodes_schema,
            edges=edges_schema,
            connectivity=connectivity_schema,
            articulation_points=art_points,
            all_rooms_safe=not lost_conn and len(disconnected_rooms) == 0,
            dynamic_safety_state=dynamic_safety_state,
            active_hazard_count=max(len(hazard_nodes), len(sensor_summary.get("active_alerts", []))),
            isolated_rooms=disconnected_rooms
        )

graph_service = GraphService()
