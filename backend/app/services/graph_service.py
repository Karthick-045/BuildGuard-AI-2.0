from sqlalchemy.orm import Session
import networkx as nx
from typing import Optional, List
from app.models.graph import GraphNode, GraphEdge
from app.models.simulation import SimulationRun
from app.core.safety_graph import safety_graph_engine
from app.schemas.graph import SafetyGraphResponse, GraphNodeSchema, GraphEdgeSchema, ConnectivityStatus

class GraphService:
    @staticmethod
    def sync_project_graph(project_id: int, db: Session):
        """
        Populates graph_nodes and graph_edges in MySQL for this project.
        """
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
        Retrieves graph representation for project, with dynamic articulation points
        and active simulation overlay (if blocked nodes exist).
        """
        # Ensure graph exists in memory
        G = safety_graph_engine.build_demo_graph()

        # Check if there is an active simulation run for this project
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

        # Articulation points on the baseline graph
        art_points = safety_graph_engine.get_articulation_points(G)

        # Check current connectivity
        connectivity_list, disconnected_rooms, lost_conn = safety_graph_engine.check_connectivity(
            G=G, blocked_nodes=[blocked_target] if blocked_target else None
        )

        nodes_schema = []
        for node_id, data in G.nodes(data=True):
            is_blocked = (node_id == blocked_target or data.get("label", "").lower() == str(blocked_target).lower())
            is_affected = data.get("label") in affected_rooms or node_id in affected_rooms
            is_ap = node_id in art_points

            nodes_schema.append(GraphNodeSchema(
                id=node_id,
                type=data.get("type", "UNKNOWN"),
                label=data.get("label", node_id),
                is_blocked=is_blocked,
                is_affected=is_affected,
                is_bottleneck=is_ap,
                position=data.get("position", {"x": 100, "y": 100})
            ))

        edges_schema = []
        for u, v, data in G.edges(data=True):
            # If either end is blocked, mark edge
            edge_affected = (u == blocked_target or v == blocked_target)
            edges_schema.append(GraphEdgeSchema(
                source=u,
                target=v,
                relationship=data.get("relationship", "CONNECTS_TO"),
                animated=not edge_affected,
                is_affected=edge_affected
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
            all_rooms_safe=not lost_conn
        )

graph_service = GraphService()
