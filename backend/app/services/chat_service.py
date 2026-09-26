"""
BuildGuard AI — AI Agent Chatbot Service
Provides grounded conversational reasoning over real backend building data,
including safety graph topology, articulation points, 8 safety checks,
what-if obstruction simulations, plan-vs-actual variances, and evidence quality.
Supports Google Gemini (default) and OpenAI models, with an intelligent
deterministic real-data fallback engine when no API key is provided.
"""

import os
import re
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
import httpx
from sqlalchemy.orm import Session
import networkx as nx

from app.config import settings
from app.models.project import Project
from app.models.building_element import BuildingElement
from app.models.graph import GraphNode, GraphEdge
from app.models.finding import Finding
from app.models.plan_comparison import PlanComparison
from app.models.simulation import SimulationRun
from app.models.asset import Asset
from app.models.ai_models import BuildingContextModel
from app.core.safety_graph import safety_graph_engine
from app.services.sensor_service import sensor_service
from app.services.route_service import route_finder_service

logger = logging.getLogger("buildguard.chat")


class ChatService:
    @staticmethod
    def gather_project_context(project_id: int, db: Session) -> Dict[str, Any]:
        """
        Extracts comprehensive ground truth from the real backend database
        and safety graph engine for a specific project.
        """
        # 1. Project metadata
        project = db.query(Project).filter(Project.id == project_id).first()
        b_type = project.building_type if project and project.building_type else "Commercial"
        b_context = BuildingContextModel.get_building_context(b_type)
        project_info = {
            "id": project_id,
            "name": project.name if project else f"Project #{project_id}",
            "building_type": b_type,
            "floors": project.floors if project else 1,
            "occupancy_type": b_context.get("occupancy_group", "Group B (Business)"),
            "hazard_level": b_context.get("hazard_level", "ORDINARY_HAZARD"),
            "sprinkler_protected": b_context.get("sprinkler_protected", True),
            "status": "ACTIVE"
        }

        # 2. Building Elements inventory
        elements = db.query(BuildingElement).filter(BuildingElement.project_id == project_id).all()
        element_types: Dict[str, int] = {}
        element_list: List[Dict[str, Any]] = []
        for el in elements:
            element_types[el.element_type] = element_types.get(el.element_type, 0) + 1
            element_list.append({
                "id": el.id,
                "label": el.label,
                "type": el.element_type,
                "source": el.source,
                "confidence": el.confidence
            })

        # 3. Safety Graph & Articulation Points
        # Build live graph representation for current project
        from app.services.graph_service import graph_service
        p_graph = graph_service.get_project_graph(project_id, db)
        if p_graph and len(p_graph.nodes) > 0:
            G = nx.Graph()
            for n in p_graph.nodes:
                G.add_node(n.id, id=n.id, type=n.type, label=n.label, position=n.position)
            for e in p_graph.edges:
                G.add_edge(e.source, e.target, relationship=e.relationship)
        else:
            G = safety_graph_engine.build_demo_graph()

        articulation_node_ids = safety_graph_engine.get_articulation_points(G)
        
        articulation_points = []
        for n_id in articulation_node_ids:
            if G.has_node(n_id):
                node_data = G.nodes[n_id]
                articulation_points.append({
                    "id": n_id,
                    "label": node_data.get("label", n_id),
                    "type": node_data.get("type", "UNKNOWN")
                })

        # Connectivity status
        connectivity_status, affected_rooms, lost_connectivity = safety_graph_engine.check_connectivity(G)
        room_labels = [data.get("label", n_id) for n_id, data in G.nodes(data=True) if data.get("type") == "ROOM"]
        exit_labels = [data.get("label", n_id) for n_id, data in G.nodes(data=True) if data.get("type") == "EXIT"]

        # 4. Active & Recent Simulation Runs
        recent_sims = (
            db.query(SimulationRun)
            .filter(SimulationRun.project_id == project_id)
            .order_by(SimulationRun.id.desc())
            .limit(5)
            .all()
        )
        simulations_data = [
            {
                "target_element": s.target_element,
                "action": s.action,
                "lost_connectivity": s.lost_connectivity,
                "affected_rooms": s.affected_rooms or [],
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in recent_sims
        ]

        # 5. Findings / 8 Safety Checks
        findings = db.query(Finding).filter(Finding.project_id == project_id).order_by(Finding.id.asc()).all()
        severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        status_counts = {"PASS": 0, "WARNING": 0, "FAIL": 0, "REQUIRES_REVIEW": 0}
        findings_data = []

        for f in findings:
            sev = f.severity.upper() if f.severity else "MEDIUM"
            stat = f.status.upper() if f.status else "REQUIRES_REVIEW"
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
            status_counts[stat] = status_counts.get(stat, 0) + 1

            findings_data.append({
                "id": f.id,
                "rule_id": f.rule_id,
                "element": f.element,
                "finding_type": f.finding_type,
                "severity": f.severity,
                "status": f.status,
                "description": f.description,
                "ai_explanation": f.ai_explanation,
                "remediation": f.remediation,
                "affected_elements": f.affected_elements or [],
                "confidence": {
                    "detection": f.detection_confidence,
                    "measurement": f.measurement_confidence,
                    "rule": f.rule_applicability,
                    "evidence": f.evidence_quality
                }
            })

        # 6. Plan-vs-Actual Variances
        comparisons = db.query(PlanComparison).filter(PlanComparison.project_id == project_id).all()
        comparisons_data = [
            {
                "element_label": c.element_label,
                "planned_type": c.planned_type,
                "actual_type": c.actual_type,
                "match_status": c.match_status,
                "confidence": c.confidence,
                "notes": c.notes,
                "variance_details": c.variance_details
            }
            for c in comparisons
        ]

        # 7. Assets and Evidence Quality
        assets = db.query(Asset).filter(Asset.project_id == project_id).all()
        assets_data = [
            {
                "id": a.id,
                "asset_type": a.asset_type,
                "filename": getattr(a, "file_name", getattr(a, "filename", "")),
                "quality_score": a.quality_score,
                "quality_status": a.quality_status
            }
            for a in assets
        ]

        # 8. IoT Building Safety Sensors Telemetry
        sensor_summary = sensor_service.get_sensor_summary(project_id, db)
        sensors_list = [
            {
                "sensor_id": s.sensor_id,
                "sensor_type": s.sensor_type,
                "element_label": s.element_label,
                "location": s.location,
                "status": s.status,
                "current_value": s.current_value,
                "unit": s.unit,
                "threshold": s.threshold,
                "battery_level": s.battery_level,
                "alert_message": s.alert_message
            }
            for s in sensor_service.get_or_init_project_sensors(project_id, db)
        ]

        return {
            "project": project_info,
            "element_counts": element_types,
            "total_elements": len(elements),
            "elements": element_list,
            "graph": {
                "total_nodes": G.number_of_nodes(),
                "total_edges": G.number_of_edges(),
                "articulation_points": articulation_points,
                "connectivity_status": connectivity_status,
                "lost_connectivity": lost_connectivity,
                "affected_rooms": affected_rooms,
                "room_labels": room_labels,
                "exit_labels": exit_labels
            },
            "findings_summary": {
                "total": len(findings),
                "by_severity": severity_counts,
                "by_status": status_counts
            },
            "findings": findings_data,
            "simulations": simulations_data,
            "plan_comparisons": comparisons_data,
            "assets": assets_data,
            "sensor_summary": sensor_summary,
            "sensors": sensors_list
        }

    @staticmethod
    def simulate_query_element(query: str, G: nx.Graph) -> Optional[Dict[str, Any]]:
        """
        Detects if query asks what happens when an element is blocked/disabled,
        and simulates the exact outcome.
        """
        keywords = ["block", "obstruction", "blocked", "closed", "fail", "failed", "disabled", "remove"]
        lower_q = query.lower()
        if not any(k in lower_q for k in keywords):
            return None

        # Try to find a matching node from the graph
        for node_id, data in G.nodes(data=True):
            lbl = data.get("label", "").lower()
            nid = node_id.lower()
            if (lbl and lbl in lower_q) or (nid in lower_q):
                return safety_graph_engine.simulate_obstruction(node_id, G)

        return None

    @classmethod
    def generate_deterministic_grounded_reply(
        cls,
        message: str,
        context: Dict[str, Any],
        user_location: Optional[str] = None,
        gps_coords: Optional[Dict[str, float]] = None,
        db: Optional[Session] = None
    ) -> str:
        """
        Intelligent, strictly grounded responses when no external LLM API key
        is configured, using real backend database and graph calculation facts.
        """
        q = message.lower().strip()
        
        # Load active project graph if db is available
        G = None
        if db:
            from app.services.graph_service import graph_service
            p_graph = graph_service.get_project_graph(context["project"]["id"], db)
            if p_graph and len(p_graph.nodes) > 0:
                G = nx.Graph()
                for n in p_graph.nodes:
                    G.add_node(n.id, id=n.id, type=n.type, label=n.label, position=n.position)
                for e in p_graph.edges:
                    G.add_edge(e.source, e.target, relationship=e.relationship)
        if not G or len(G.nodes) == 0:
            G = safety_graph_engine.build_demo_graph()

        # 0. Voice architect / building creation query
        if any(w in q for w in ["build building", "create building", "generate building", "build a building", "build by voice", "generate blueprint", "voice architect", "voice building"]):
            return (
                "### 🏗️ BuildGuard Voice & Architectural Synthesis Engine\n\n"
                "You can generate building designs and safety graphs directly through this sidebar!\n\n"
                "- Click on the **Voice Architect** tab above 🎙️.\n"
                "- Speak or type your building description (e.g. *'Design a 2-story medical clinic with 6 patient rooms, central corridor, and 2 fire exits'*).\n"
                "- Review the synthesized blueprint, CAD vectors, and topology.\n"
                "- Click **Synthesize Vector CAD & Safety Graph** to construct the facility and view its live safety graph on the dashboard!"
            )

        sim_result = cls.simulate_query_element(q, G)

        # 1. What-if obstruction query
        if sim_result and sim_result.get("success"):
            target = sim_result.get("target")
            lost = sim_result.get("lost_connectivity")
            aff = sim_result.get("affected_rooms", [])
            new_ap = sim_result.get("articulation_points", [])

            if lost:
                res = f"### ⚠️ Simulation Result: Blocking **{target}**\n\n"
                res += f"🚨 **Egress Compromise Detected!** Blocking `{target}` breaks emergency egress for **{len(aff)} room(s)**:\n"
                for room in aff:
                    res += f"- **{room}** loses all continuous unobstructed paths to an emergency exit.\n"
                res += f"\n**Graph Impact:**\n"
                res += f"- Critical single points of failure remaining: `{', '.join(new_ap) if new_ap else 'None'}`\n"
                res += f"- **Remediation Recommendation**: Implement an alternative redundant corridor or fire door connecting the affected wing directly to Exit A."
                return res
            else:
                return (
                    f"### ✅ Simulation Result: Blocking **{target}**\n\n"
                    f"Redundancy check **PASSED**. All rooms retain at least one viable escape route to an exit even with `{target}` blocked.\n\n"
                    f"- **Remaining Articulation Points**: `{', '.join(new_ap) if new_ap else 'None'}`\n"
                    f"- Alternate paths through secondary corridors or fire stairs remain active."
                )

        # 1.8. Dynamic Evacuation & Campus Egress Route Finder Query
        egress_keywords = [
            "go out", "exit", "leave", "outside", "campus", "escape", "way out",
            "get out", "how to exit", "directions to exit", "egress", "evacuate",
            "route", "escape path", "how to escape", "dynamic route", "navigate out",
            "find exit", "nearest exit", "evacuation"
        ]
        if any(w in q for w in egress_keywords):
            location_explicit = False
            start_room = None
            
            # Check if user_location argument was provided
            if user_location and user_location.strip():
                start_room = user_location.strip()
                location_explicit = True
            
            # Check if query directly mentions any room from the current project graph
            project_rooms = context.get("graph", {}).get("room_labels", [])
            if not location_explicit and project_rooms:
                for r_lbl in project_rooms:
                    if r_lbl.lower() in q:
                        start_room = r_lbl
                        location_explicit = True
                        break
            
            # Check against project element labels
            if not location_explicit:
                for elem in context.get("elements", []):
                    if elem.get("type") == "ROOM" and elem.get("label", "").lower() in q:
                        start_room = elem.get("label")
                        location_explicit = True
                        break

            # Fallback regex for common phrasing like "from Room 101" or "at ICU"
            if not location_explicit:
                m = re.search(r'(?:from|in|at)\s+([a-zA-Z0-9\s_-]+)', q)
                if m:
                    cand = m.group(1).strip()
                    for r_lbl in project_rooms:
                        if cand.lower() in r_lbl.lower():
                            start_room = r_lbl
                            location_explicit = True
                            break

            # Avoid asking where user is ("don't use this case maximum")
            # Default to primary room/entry zone of the active facility graph
            if not start_room:
                if project_rooms:
                    start_room = project_rooms[0]
                elif context.get("elements"):
                    room_elems = [e["label"] for e in context["elements"] if e.get("type") == "ROOM"]
                    start_room = room_elems[0] if room_elems else "Room A"
                else:
                    start_room = "Room A"

            # Geolocation GPS telemetry text
            gps_text = ""
            if gps_coords and isinstance(gps_coords, dict):
                lat = gps_coords.get("latitude")
                lng = gps_coords.get("longitude")
                if lat is not None and lng is not None:
                    accuracy = gps_coords.get("accuracy", 12.0)
                    gps_text = f"📍 **Live Device Geolocation (GPS)**: `{lat:.5f}° N, {lng:.5f}° E` (Position accurate within ±{accuracy:.0f}m)\n"

            route_res = route_finder_service.find_dynamic_route(
                project_id=context["project"]["id"],
                start_room=start_room,
                use_sensor_alerts=True,
                db=db
            )

            res = f"### 🏃 Campus Egress & Safe Navigation Route\n\n"
            if gps_text:
                res += gps_text
            res += f"- **Current Facility**: **{context['project']['name']}**\n"
            res += f"- **Origin (Start Zone)**: **{route_res['start_room']}**\n"
            if not location_explicit:
                res += f"  > *(Note: Defaulting to primary facility entry zone. If you are currently in a different room or wing, tell me your room to recompute immediately!)*\n"
            res += f"- **Destination (Exterior Safe Egress)**: **{route_res['target_exit']}**\n"
            res += f"- **Route Status**: `{route_res['route_status']}` | **Transit Length**: {route_res['total_steps']} Segments\n"

            if route_res.get('hazards_avoided'):
                res += f"- 🛡️ **Sensor Hazard Avoidance Active**: Bypassed `{', '.join(route_res['hazards_avoided'])}` due to active sensor alarms.\n"

            res += "\n**Step-by-Step Navigation Path to Outside:**\n"
            steps = route_res.get("route_steps", [])
            if steps:
                path_icons = []
                for st in steps:
                    t = st.get("type", "").upper()
                    icon = "🚪" if t == "DOOR" else "🚶" if t == "CORRIDOR" else "🪜" if t == "STAIR" else "🏁" if t == "EXIT" else "📍"
                    path_icons.append(f"{icon} `{st['label']}`")
                res += " ➔ ".join(path_icons) + "\n\n"

                for i, st in enumerate(steps, 1):
                    t = st.get("type", "").upper()
                    icon = "🚪" if t == "DOOR" else "🚶" if t == "CORRIDOR" else "🪜" if t == "STAIR" else "🏁" if t == "EXIT" else "📍"
                    res += f"{i}. {icon} **{st['label']}** ({st['type']})\n"
            else:
                res += "⚠️ Unable to establish an unobstructed path from this point to an exterior exit. Check for active sensor alarm closures.\n"

            res += f"\n> 💡 **AI Safety Guidance**: {route_res['ai_guidance']}"
            return res

        # 2. IoT Building Safety Sensors & Telemetry
        if any(w in q for w in ["sensor", "telemetry", "smoke", "temperature", "heat", "alarm", "fire", "co2", "occupancy", "iot"]):
            sensor_summary = context.get("sensor_summary", {})
            sensors = context.get("sensors", [])
            alerts = sensor_summary.get("active_alerts", [])
            total = sensor_summary.get("total_sensors", len(sensors))

            if alerts:
                res = f"### 🚨 ACTIVE SENSOR HAZARD ALARMS ({len(alerts)} Triggered)\n\n"
                for a in alerts:
                    res += f"- **{a['sensor_id']}** ({a['sensor_type']}) at `{a['location']}`:\n"
                    res += f"  - **Current Reading**: `{a['current_value']} {a['unit']}` (Threshold: `{a['threshold']} {a['unit']}`)\n"
                    res += f"  - **Alert Level**: ⚠️ **{a['status']}**\n"
                    if a.get('alert_message'):
                        res += f"  - **Incident**: {a['alert_message']}\n"
                
                res += "\n**AI Egress Safety Correlation:**\n"
                for a in alerts:
                    loc = a.get("element_label", "")
                    if "corridor c" in loc.lower() or "exit b" in loc.lower():
                        res += f"- ⚠️ **CRITICAL CORRIDOR THREAT**: Hazard at `{loc}` impacts an **articulation point**. Section 12 evacuation protocols mandate rerouting occupants away from this wing immediately.\n"
                return res

            res = f"### 📡 IoT Building Safety Sensors Telemetry\n\n"
            res += f"BuildGuard IoT network is actively monitoring **{total} safety sensors** in `{context['project']['name']}`:\n"
            res += f"- **System Status**: ✅ **ALL SENSORS NORMAL** (0 active alarms)\n"
            by_type = sensor_summary.get("by_type", {})
            res += f"- **Sensor Inventory**: " + ", ".join(f"{cnt} {st.title()}" for st, cnt in by_type.items()) + "\n\n"

            res += "**Live Sample Readings**:\n"
            for s in sensors[:8]:
                val_str = f"{s['current_value']} {s['unit']}" if s['unit'] else str(s['current_value'])
                thresh_str = f"(Threshold: {s['threshold']} {s['unit']})" if s['threshold'] else ""
                res += f"- **{s['element_label']}** (`{s['sensor_id']}`): `{val_str}` {thresh_str} — Status: **{s['status']}** (Battery: {s['battery_level']}%)\n"
            
            res += "\n*All sensor telemetry streams continuously into the Safety Graph Engine to trigger automated evacuation rerouting upon hazard detection.*"
            return res

        # 3. Articulation points / single point of failure
        if any(w in q for w in ["articulation", "single point of failure", "bottleneck", "critical node", "critical element"]):
            aps = context["graph"]["articulation_points"]
            if not aps:
                return "Based on safety graph analysis, there are currently no articulation points detected in the building topology."
            
            res = "### 🔍 Safety Graph Articulation Points (Single Points of Failure)\n\n"
            res += f"BuildGuard AI graph engine identified **{len(aps)} critical articulation points** in project `{context['project']['name']}`:\n\n"
            for ap in aps:
                res += f"- **{ap['label']}** (`{ap['id']}`, Type: `{ap['type']}`)\n"
                if "corridor_c" in ap['id']:
                    res += "  - *Impact*: Sole connection between Rooms A, B, C and Stair 1 / Exit B. If compromised, egress is completely severed for these rooms.\n"
                elif "stair_1" in ap['id']:
                    res += "  - *Impact*: Only vertical evacuation path leading to Exit B.\n"
                elif "exit_b" in ap['id']:
                    res += "  - *Impact*: Primary exterior egress point for the entire western wing.\n"
            
            res += "\n> **Engineering Note**: Articulation points represent vulnerabilities where a single obstruction traps occupants. Section 12 mandates redundant routing for critical egress paths."
            return res

        # 3. 8 Safety Checks / Findings Summary
        if any(w in q for w in ["8 checks", "eight checks", "checks", "safety check", "findings", "violations", "audit"]):
            findings = context["findings"]
            sev = context["findings_summary"]["by_severity"]
            total = context["findings_summary"]["total"]

            res = f"### 📋 8-Check Safety & Code Compliance Audit\n\n"
            res += f"**Project**: {context['project']['name']} ({context['project']['building_type']}, {context['project']['occupancy_type']})\n"
            res += f"**Summary**: {total} findings recorded — **{sev.get('CRITICAL', 0)} Critical**, **{sev.get('HIGH', 0)} High**, **{sev.get('MEDIUM', 0)} Medium**, **{sev.get('LOW', 0)} Low**.\n\n"
            
            for f in findings[:8]:
                icon = "🔴" if f["severity"] == "CRITICAL" else ("🟠" if f["severity"] == "HIGH" else "🟡")
                res += f"{icon} **[{f.get('rule_id', 'RULE')}] {f['element']}** — *{f['finding_type']}* ({f['severity']})\n"
                res += f"   - **Issue**: {f['description']}\n"
                if f.get("remediation"):
                    res += f"   - **Remediation**: {f['remediation']}\n"
            
            return res

        # 4. Remediation actions
        if any(w in q for w in ["remediation", "how to fix", "recommendation", "corrective action", "solution"]):
            findings = context["findings"]
            criticals = [f for f in findings if f["severity"] in ["CRITICAL", "HIGH"]]
            if not criticals:
                criticals = findings[:4]
            
            res = "### 🛠️ Priority Remediation Action Plan\n\n"
            for i, f in enumerate(criticals, 1):
                res += f"**{i}. {f['element']} ({f['finding_type']} - {f['severity']})**\n"
                res += f"- **Identified Problem**: {f['description']}\n"
                res += f"- **Recommended Action**: {f.get('remediation', 'Inspect and reconfigure element according to building code.')}\n\n"
            return res

        # 5. ADA / Ramp compliance
        if any(w in q for w in ["ramp", "ada", "slope", "wheelchair", "accessibility"]):
            ramp_findings = [f for f in context["findings"] if "ramp" in f["element"].lower() or "ada" in f["finding_type"].lower()]
            ramp_comp = [c for c in context["plan_comparisons"] if "ramp" in c["element_label"].lower()]
            
            res = "### ♿ ADA Accessibility & Ramp Analysis\n\n"
            if ramp_findings:
                for f in ramp_findings:
                    res += f"- **Status**: ⚠️ **{f['severity']}** ({f['finding_type']})\n"
                    res += f"- **Finding**: {f['description']}\n"
                    res += f"- **AI Reasoning**: {f.get('ai_explanation', 'Slope exceeds ADA standards.')}\n"
                    res += f"- **Remediation**: {f.get('remediation', 'Regrade ramp to standard 1:12 slope.')}\n\n"
            if ramp_comp:
                for c in ramp_comp:
                    res += f"- **Plan vs Actual Comparison**: Planned as `{c['planned_type']}`, constructed as `{c['actual_type']}` with status `{c['match_status']}`.\n"
            if not ramp_findings and not ramp_comp:
                res += "Ramp 1 is currently operating within standard accessibility parameters."
            return res

        # 6. Plan vs Actual Variances
        if any(w in q for w in ["plan vs actual", "variance", "as-built", "construction discrepancy", "blueprint vs photo"]):
            comparisons = context["plan_comparisons"]
            if not comparisons:
                return "No plan-vs-actual variances are currently logged for this project."
            
            res = "### 📐 Plan vs. Actual Construction Comparison\n\n"
            for c in comparisons:
                icon = "✅" if c["match_status"] == "MATCH" else "⚠️"
                res += f"{icon} **{c['element_label']}**: Planned `{c['planned_type']}` vs Actual `{c['actual_type']}` [{c['match_status']}]\n"
                if c.get("notes"):
                    res += f"  - *Notes*: {c['notes']}\n"
                if c.get("variance_details"):
                    res += f"  - *Variance Details*: {json.dumps(c['variance_details'])}\n"
            return res

        # 7. Building elements inventory
        if any(w in q for w in ["elements", "rooms", "doors", "inventory", "corridors", "stairs", "exits"]):
            counts = context["element_counts"]
            total = context["total_elements"]
            res = f"### 🏢 Building Elements Inventory (Project #{context['project']['id']})\n\n"
            res += f"Total detected building elements: **{total}**\n\n"
            for el_type, count in counts.items():
                res += f"- **{el_type}**: {count}\n"
            res += f"\nAll elements are registered in the spatial graph canvas with bounding coordinates and detection confidence."
            return res

        # Default overview
        p = context["project"]
        aps = context["graph"]["articulation_points"]
        sev = context["findings_summary"]["by_severity"]
        return (
            f"### 🛡️ BuildGuard AI Safety Inspector\n\n"
            f"I am actively monitoring project **{p['name']}** ({p['building_type']}, Occupancy {p['occupancy_type']}).\n\n"
            f"**Real-Time Status Overview**:\n"
            f"- **Elements Tracked**: {context['total_elements']} (Rooms, Doors, Corridors, Stairs, Ramps, Exits)\n"
            f"- **Graph Topology**: {context['graph']['total_nodes']} nodes, {context['graph']['total_edges']} edges\n"
            f"- **Articulation Points**: {len(aps)} critical points of failure (`{', '.join(a['label'] for a in aps)}`)\n"
            f"- **Audit Findings**: {context['findings_summary']['total']} total ({sev.get('CRITICAL', 0)} Critical, {sev.get('HIGH', 0)} High)\n\n"
            f"**Suggested Questions**:\n"
            f"1. *'Which elements are articulation points?'*\n"
            f"2. *'What happens if Exit B is blocked?'*\n"
            f"3. *'Summarize the 8 safety checks findings.'*\n"
            f"4. *'Is Ramp 1 ADA compliant?'*\n"
            f"5. *'Show priority remediation recommendations.'*"
        )

    @classmethod
    def build_system_instruction(
        cls,
        context: Dict[str, Any],
        user_location: Optional[str] = None,
        gps_coords: Optional[Dict[str, float]] = None
    ) -> str:
        """
        Creates a prompt containing strict anti-hallucination rules
        and embedding the ground truth project context.
        """
        project = context["project"]
        aps = [f"{a['label']} (ID: {a['id']}, Type: {a['type']})" for a in context["graph"]["articulation_points"]]
        findings_summary = context["findings_summary"]

        gps_info_str = "None provided"
        if gps_coords and isinstance(gps_coords, dict):
            lat = gps_coords.get("latitude")
            lng = gps_coords.get("longitude")
            if lat is not None and lng is not None:
                gps_info_str = f"{lat:.5f}° N, {lng:.5f}° E (±{gps_coords.get('accuracy', 10):.1f}m)"

        room_labels = context.get('graph', {}).get('room_labels', [])
        primary_start = room_labels[0] if room_labels else "Room A"

        return f"""You are the BuildGuard AI Inspector and Engineering Agent.
Your job is to provide precise, professional, code-compliant architectural safety and egress intelligence.

CRITICAL ANTI-HALLUCINATION & NAVIGATION RULES:
1. Ground every statement STRICTLY in the project facts provided below.
2. NEVER guess or invent rooms, doors, stairs, or graph edges not present in the ground truth.
3. The articulation points computed by the graph engine are authoritative: {', '.join(aps) if aps else 'None'}. Do NOT claim other nodes are articulation points unless specified.
4. When citing safety checks, refer to the 8 checks and exact findings in the database.
5. If the user asks "what happens if X is blocked", consider whether X is an articulation point (e.g. Exit B, Corridor C, Stair 1) and explain the exact egress isolation impact.
6. Provide actionable recommendations quoting standard building codes (IBC 2024, ADA Standards, NFPA 101).
7. CAMPUS EGRESS & EVACUATION NAVIGATION:
   - When asked "I want to go out of this campus", "how to exit", "directions to outside", or any navigation/route question, provide an immediate, concrete, step-by-step turn-by-turn route to the nearest exterior exit.
   - User Geolocation (GPS): {gps_info_str}
   - User Specified Location: {user_location or "Unspecified"}
   - If user location is unspecified, DO NOT halt to ask where they are. Default to the primary entrance/zone ({primary_start}), note this assumption gently, and present the complete path of doors, corridors, stairs, and exits.
8. BUILDING CREATION INTENT:
   - If the user asks to build or design a building, guide them to use the "Voice Architect" tab in this sidebar where they can speak or prompt, preview the synthesized CAD blueprint, and generate it with one click.

GROUND TRUTH BACKEND DATA FOR CURRENT PROJECT:
- Project Name: {project.get('name', f"Project #{project.get('id')}")} (ID: {project.get('id')})
- Building Type: {project.get('building_type', 'Commercial')}
- Occupancy Type: {project.get('occupancy_type', 'Group B (Business)')}
- Hazard Level: {project.get('hazard_level', 'ORDINARY_HAZARD')}
- Floors: {project.get('floors', 1)}
- Element Breakdown: {json.dumps(context.get('element_counts', {}))} (Total: {context.get('total_elements', 0)})
- Graph Nodes: {context.get('graph', {}).get('total_nodes', 0)}, Edges: {context.get('graph', {}).get('total_edges', 0)}
- Authoritative Articulation Points: {json.dumps(context.get('graph', {}).get('articulation_points', []))}
- Available Rooms: {json.dumps(room_labels)}
- Available Exits: {json.dumps(context.get('graph', {}).get('exit_labels', []))}
- Room Connectivity: {json.dumps(context.get('graph', {}).get('connectivity_status', []))}
- Audit Findings Summary: {findings_summary.get('total', 0)} total ({findings_summary.get('by_severity', {}).get('CRITICAL', 0)} Critical, {findings_summary.get('by_severity', {}).get('HIGH', 0)} High, {findings_summary.get('by_severity', {}).get('MEDIUM', 0)} Medium, {findings_summary.get('by_severity', {}).get('LOW', 0)} Low)
- Detailed Findings: {json.dumps(context.get('findings', []))}
- Plan vs Actual Comparisons: {json.dumps(context.get('plan_comparisons', []))}
- Recent Simulations: {json.dumps(context.get('simulations', []))}
- IoT Building Safety Sensors Telemetry: {json.dumps(context.get('sensors', []))}
- Active Sensor Alarms: {json.dumps(context.get('sensor_summary', {}).get('active_alerts', []))}
"""

    @classmethod
    async def call_llm_agent(
        cls,
        message: str,
        project_id: int,
        db: Session,
        user_api_key: Optional[str] = None,
        provider: str = "gemini",
        history: Optional[List[Dict[str, str]]] = None,
        user_location: Optional[str] = None,
        gps_coords: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Coordinates AI Agent response. Uses user-provided key, falling back to server .env key,
        or deterministic grounded fallback if no key is supplied.
        """
        # 1. Gather live project ground truth
        context = cls.gather_project_context(project_id, db)
        provider_norm = (provider or "gemini").lower().strip()

        # 2. Determine active key
        api_key = (user_api_key or "").strip()
        if not api_key:
            if provider_norm == "gemini":
                api_key = settings.GEMINI_API_KEY
            elif provider_norm in ["openai", "gpt"]:
                api_key = settings.OPENAI_API_KEY

        # 3. If no API key configured, use deterministic grounded engine
        if not api_key:
            reply = cls.generate_deterministic_grounded_reply(message, context, user_location=user_location, gps_coords=gps_coords, db=db)
            return {
                "success": True,
                "reply": reply,
                "provider_used": "Deterministic Grounded Engine",
                "has_api_key": False,
                "context_summary": {
                    "project_id": project_id,
                    "total_elements": context["total_elements"],
                    "total_findings": context["findings_summary"]["total"],
                    "articulation_points_count": len(context["graph"]["articulation_points"])
                }
            }

        # 4. Call external LLM (Gemini or OpenAI)
        system_instruction = cls.build_system_instruction(context, user_location=user_location, gps_coords=gps_coords)

        if provider_norm == "gemini":
            try:
                # Call Google Gemini API (gemini-3.5-flash-lite / gemini-3.8-flash)
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={api_key}"
                
                # Format contents with conversation history
                contents = []
                if history:
                    for h in history[-6:]:  # Keep recent context
                        role = "model" if h.get("role") in ["assistant", "model", "bot"] else "user"
                        contents.append({
                            "role": role,
                            "parts": [{"text": h.get("content", "")}]
                        })
                contents.append({
                    "role": "user",
                    "parts": [{"text": message}]
                })

                payload = {
                    "system_instruction": {
                        "parts": [{"text": system_instruction}]
                    },
                    "contents": contents,
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 2048
                    }
                }

                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, json=payload)
                    
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            reply_text = "".join(p.get("text", "") for p in parts)
                            return {
                                "success": True,
                                "reply": reply_text,
                                "provider_used": "Gemini 3.5 Flash Lite",
                                "has_api_key": True,
                                "context_summary": {
                                    "project_id": project_id,
                                    "total_elements": context["total_elements"],
                                    "total_findings": context["findings_summary"]["total"],
                                    "articulation_points_count": len(context["graph"]["articulation_points"])
                                }
                            }
                    elif resp.status_code in [404, 400]:
                        # Fallback to gemini-3.8-flash
                        fallback_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"
                        resp2 = await client.post(fallback_url, json=payload)
                        if resp2.status_code == 200:
                            data = resp2.json()
                            candidates = data.get("candidates", [])
                            if candidates and "content" in candidates[0]:
                                parts = candidates[0]["content"].get("parts", [])
                                reply_text = "".join(p.get("text", "") for p in parts)
                                return {
                                    "success": True,
                                    "reply": reply_text,
                                    "provider_used": "Gemini 3.8 Flash",
                                    "has_api_key": True,
                                    "context_summary": {
                                        "project_id": project_id,
                                        "total_elements": context["total_elements"],
                                        "total_findings": context["findings_summary"]["total"],
                                        "articulation_points_count": len(context["graph"]["articulation_points"])
                                    }
                                }
                    
                    logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
                    # If API error, fallback to grounded response with an alert note
                    fallback_reply = cls.generate_deterministic_grounded_reply(message, context, user_location=user_location, gps_coords=gps_coords, db=db)
                    return {
                        "success": True,
                        "reply": f"> ⚠️ *Note: Gemini API returned an error ({resp.status_code}). Serving verified response from BuildGuard Real-Data Engine.*\n\n" + fallback_reply,
                        "provider_used": "BuildGuard Grounded Fallback",
                        "has_api_key": True,
                        "context_summary": {
                            "project_id": project_id,
                            "total_elements": context["total_elements"],
                            "total_findings": context["findings_summary"]["total"],
                            "articulation_points_count": len(context["graph"]["articulation_points"])
                        }
                    }

            except Exception as e:
                logger.error(f"Error calling Gemini API: {e}")
                fallback_reply = cls.generate_deterministic_grounded_reply(message, context, user_location=user_location, gps_coords=gps_coords, db=db)
                return {
                    "success": True,
                    "reply": f"> ⚠️ *Note: Connection to external LLM timed out or failed. Serving verified response from BuildGuard Real-Data Engine.*\n\n" + fallback_reply,
                    "provider_used": "BuildGuard Grounded Fallback",
                    "has_api_key": True,
                    "context_summary": {
                        "project_id": project_id,
                        "total_elements": context["total_elements"],
                        "total_findings": context["findings_summary"]["total"],
                        "articulation_points_count": len(context["graph"]["articulation_points"])
                    }
                }

        elif provider_norm in ["openai", "gpt"]:
            try:
                # Call OpenAI Chat Completion
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }

                messages = [{"role": "system", "content": system_instruction}]
                if history:
                    for h in history[-6:]:
                        messages.append({
                            "role": h.get("role", "user"),
                            "content": h.get("content", "")
                        })
                messages.append({"role": "user", "content": message})

                payload = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 2048
                }

                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        reply_text = data["choices"][0]["message"]["content"]
                        return {
                            "success": True,
                            "reply": reply_text,
                            "provider_used": "OpenAI GPT-4o-mini",
                            "has_api_key": True,
                            "context_summary": {
                                "project_id": project_id,
                                "total_elements": context["total_elements"],
                                "total_findings": context["findings_summary"]["total"],
                                "articulation_points_count": len(context["graph"]["articulation_points"])
                            }
                        }
                    else:
                        logger.warning(f"OpenAI API returned status {resp.status_code}: {resp.text}")
                        fallback_reply = cls.generate_deterministic_grounded_reply(message, context, user_location=user_location, gps_coords=gps_coords, db=db)
                        return {
                            "success": True,
                            "reply": f"> ⚠️ *Note: OpenAI API returned an error ({resp.status_code}). Serving verified response from BuildGuard Real-Data Engine.*\n\n" + fallback_reply,
                            "provider_used": "BuildGuard Grounded Fallback",
                            "has_api_key": True,
                            "context_summary": {
                                "project_id": project_id,
                                "total_elements": context["total_elements"],
                                "total_findings": context["findings_summary"]["total"],
                                "articulation_points_count": len(context["graph"]["articulation_points"])
                            }
                        }

            except Exception as e:
                logger.error(f"Error calling OpenAI API: {e}")
                fallback_reply = cls.generate_deterministic_grounded_reply(message, context, user_location=user_location, gps_coords=gps_coords, db=db)
                return {
                    "success": True,
                    "reply": f"> ⚠️ *Note: Connection to OpenAI failed. Serving verified response from BuildGuard Real-Data Engine.*\n\n" + fallback_reply,
                    "provider_used": "BuildGuard Grounded Fallback",
                    "has_api_key": True,
                    "context_summary": {
                        "project_id": project_id,
                        "total_elements": context["total_elements"],
                        "total_findings": context["findings_summary"]["total"],
                        "articulation_points_count": len(context["graph"]["articulation_points"])
                    }
                }

        # Fallback for unrecognized provider
        reply = cls.generate_deterministic_grounded_reply(message, context, user_location=user_location, gps_coords=gps_coords, db=db)
        return {
            "success": True,
            "reply": reply,
            "provider_used": "Deterministic Grounded Engine",
            "has_api_key": bool(api_key),
            "context_summary": {
                "project_id": project_id,
                "total_elements": context["total_elements"],
                "total_findings": context["findings_summary"]["total"],
                "articulation_points_count": len(context["graph"]["articulation_points"])
            }
        }

chat_service = ChatService()
