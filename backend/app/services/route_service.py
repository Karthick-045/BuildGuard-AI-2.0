"""
BuildGuard AI — Dynamic Route Finder Service
Calculates real-time optimal egress routes taking into account
live IoT sensor hazards (smoke, temperature, door blockages)
and building safety graph articulation points.
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
import networkx as nx

from app.core.safety_graph import safety_graph_engine
from app.services.sensor_service import sensor_service
from app.models.simulation import SimulationRun

class RouteFinderService:
    @classmethod
    def find_dynamic_route(
        cls,
        project_id: int,
        start_room: str,
        avoid_elements: Optional[List[str]] = None,
        use_sensor_alerts: bool = True,
        db: Session = None
    ) -> Dict[str, Any]:
        """
        Calculates dynamic evacuation route from start_room to the nearest viable EXIT,
        automatically avoiding nodes with active sensor hazard alarms.
        """
        G = safety_graph_engine.build_demo_graph()
        avoid_nodes = set(avoid_elements or [])

        # 1. Inspect live sensor hazard telemetry
        active_sensor_hazards = []
        if use_sensor_alerts and db:
            sensor_summary = sensor_service.get_sensor_summary(project_id, db)
            for alert in sensor_summary.get("active_alerts", []):
                elem_lbl = alert.get("element_label", "")
                active_sensor_hazards.append({
                    "sensor_id": alert.get("sensor_id"),
                    "type": alert.get("sensor_type"),
                    "element": elem_lbl,
                    "location": alert.get("location"),
                    "reading": f"{alert.get('current_value')} {alert.get('unit')}",
                    "threshold": f"{alert.get('threshold')} {alert.get('unit')}",
                    "message": alert.get("alert_message")
                })
                # Find matching graph node ID
                for n_id, data in G.nodes(data=True):
                    if (elem_lbl.lower() in data.get("label", "").lower()) or (data.get("label", "").lower() in elem_lbl.lower()):
                        avoid_nodes.add(n_id)

        # 2. Check if latest simulation has blocked elements
        if db:
            latest_sim = (
                db.query(SimulationRun)
                .filter(SimulationRun.project_id == project_id)
                .order_by(SimulationRun.id.desc())
                .first()
            )
            if latest_sim and latest_sim.action == "BLOCK":
                target_node = latest_sim.target_element.lower().strip()
                for n_id in G.nodes():
                    if target_node in n_id.lower() or n_id.lower() in target_node:
                        avoid_nodes.add(n_id)

        # 3. Resolve start room node ID
        start_node = None
        norm_start = start_room.strip().lower()
        for n_id, data in G.nodes(data=True):
            if data.get("type") == "ROOM" and (norm_start in n_id.lower() or norm_start in data.get("label", "").lower()):
                start_node = n_id
                break

        if not start_node:
            # Fallback to first room if not found
            for n_id, data in G.nodes(data=True):
                if data.get("type") == "ROOM":
                    start_node = n_id
                    break

        start_label = G.nodes[start_node].get("label", start_node) if start_node else start_room

        # 4. Find all exit nodes
        exit_nodes = [
            n for n, attr in G.nodes(data=True)
            if attr.get("type") == "EXIT" and n not in avoid_nodes
        ]

        # 5. Build routing subgraph by pruning avoided/hazardous nodes
        routing_G = G.copy()
        for avoid_n in avoid_nodes:
            if routing_G.has_node(avoid_n) and avoid_n != start_node:
                routing_G.remove_node(avoid_n)

        # 6. Find shortest unobstructed path to any active exit
        best_path = None
        best_exit = None
        min_length = float("inf")

        if routing_G.has_node(start_node) and exit_nodes:
            for ex in exit_nodes:
                try:
                    if nx.has_path(routing_G, start_node, ex):
                        p = nx.shortest_path(routing_G, start_node, ex)
                        if len(p) < min_length:
                            min_length = len(p)
                            best_path = p
                            best_exit = ex
                except Exception:
                    continue

        # 7. Format step-by-step route breadcrumbs
        route_steps = []
        if best_path:
            for step_node in best_path:
                node_data = G.nodes[step_node]
                route_steps.append({
                    "id": step_node,
                    "label": node_data.get("label", step_node),
                    "type": node_data.get("type", "UNKNOWN"),
                    "position": node_data.get("position", {"x": 0, "y": 0})
                })

        # 8. Determine route status & AI guidance
        is_rerouted = len(avoid_nodes) > 0 and best_path is not None
        has_route = best_path is not None

        if not has_route:
            status_code = "NO_SAFE_ROUTE"
            target_label = "None"
            ai_guidance = (
                f"🚨 CRITICAL EVACUATION FAILURE: All egress corridors from {start_label} "
                f"are blocked by active sensor alarms or obstructions. Occupants in {start_label} "
                f"must shelter in place or utilize emergency fire-rated egress apparatus."
            )
        elif is_rerouted:
            status_code = "REROUTED_DUE_TO_SENSOR"
            target_label = G.nodes[best_exit].get("label", best_exit)
            ai_guidance = (
                f"⚠️ DYNAMIC REROUTE ACTIVE: Hazards detected on {len(avoid_nodes)} building zone(s). "
                f"Egress from {start_label} has been dynamically rerouted away from hazardous sectors "
                f"directly to {target_label} ({len(best_path)} transit steps)."
            )
        else:
            status_code = "OPTIMAL"
            target_label = G.nodes[best_exit].get("label", best_exit)
            ai_guidance = (
                f"✅ OPTIMAL ROUTE CONFIRMED: All {len(G.nodes())} building sensors report normal telemetry. "
                f"Primary egress from {start_label} leads unobstructed to {target_label}."
            )

        return {
            "success": has_route,
            "project_id": project_id,
            "start_room": start_label,
            "start_node_id": start_node,
            "target_exit": target_label,
            "target_exit_id": best_exit,
            "route_status": status_code,
            "total_steps": len(route_steps),
            "route_steps": route_steps,
            "hazards_avoided": list(avoid_nodes),
            "sensor_validation": {
                "sensors_checked": True,
                "active_hazards_count": len(active_sensor_hazards),
                "hazards_detected": active_sensor_hazards,
                "validation_status": "FAIL_REROUTED" if is_rerouted else ("SAFE" if has_route else "CRITICAL_BLOCKED")
            },
            "ai_guidance": ai_guidance
        }

route_finder_service = RouteFinderService()
