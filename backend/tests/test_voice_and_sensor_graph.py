"""
Verification test suite for:
1. Voice-to-Building Speech Layout Ingestion (/api/voice/build-project)
2. Voice Command Translation (/api/voice/command)
3. Dynamic Sensor Recalculation on Safety Graph (/api/projects/{id}/graph)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_voice_and_sensor_graph():
    print("\n--- 1. Testing Voice Building Generation (/api/voice/build-project) ---")
    speech_transcript = (
        "This is an emergency medical clinic. On the ground floor we have a triage lobby connected to "
        "Corridor Alpha. Corridor Alpha branches into Consultation Room 1, Trauma Room 2, and Emergency Exit North. "
        "There is also a smoke detector installed in Corridor Alpha and a temperature sensor at Exit North."
    )
    res = client.post("/api/voice/build-project", json={
        "speech_transcript": speech_transcript,
        "building_name": "Voice-Generated Clinic Alpha"
    })
    assert res.status_code == 201, f"Voice build failed: {res.text}"
    voice_data = res.json()
    print("Voice project created successfully:", voice_data)
    assert voice_data["success"] is True
    project_id = voice_data["project_id"]
    assert project_id > 0
    assert voice_data["elements_created"] >= 3
    assert voice_data["node_count"] >= 3
    assert voice_data["edge_count"] >= 2

    print("\n--- 2. Verifying Safety Graph Dynamic State on Fresh Voice Project ---")
    graph_res = client.get(f"/api/projects/{project_id}/graph")
    assert graph_res.status_code == 200, f"Graph retrieval failed: {graph_res.text}"
    graph_data = graph_res.json()
    print("Initial Dynamic Safety State:", graph_data.get("dynamic_safety_state"))
    assert "dynamic_safety_state" in graph_data
    assert graph_data["dynamic_safety_state"] in ["SAFE", "WARNING", "HAZARD", "BLOCKED"]
    assert "active_hazard_count" in graph_data
    assert len(graph_data["nodes"]) > 0

    print("\n--- 3. Testing Voice Command: Find Quickest Route ---")
    cmd_res = client.post("/api/voice/command", json={
        "project_id": project_id,
        "command": "Find the safest egress route from Room A to the nearest emergency exit."
    })
    assert cmd_res.status_code == 200, f"Voice command failed: {cmd_res.text}"
    cmd_data = cmd_res.json()
    print("Voice command result:", cmd_data)
    assert cmd_data["action"] == "ROUTE_FINDER"
    assert "spoken_summary" in cmd_data
    assert "data" in cmd_data

    print("\n--- 4. Testing Dynamic Sensor Hazard Injection & Graph Recalculation ---")
    # Fetch sensors present on this project
    sensors_res = client.get(f"/api/projects/{project_id}/sensors")
    assert sensors_res.status_code == 200
    sensor_list = sensors_res.json()["sensors"]
    print(f"Project #{project_id} has {len(sensor_list)} sensor(s):", [s["sensor_id"] for s in sensor_list])
    assert len(sensor_list) > 0, "Expected at least 1 sensor on project"
    target_sensor = sensor_list[0]
    target_sensor_id = target_sensor["sensor_id"]

    # Trigger hazard alarm on this sensor
    sensor_res = client.post(f"/api/projects/{project_id}/sensors/trigger-alert", json={
        "sensor_id": target_sensor_id,
        "value": 85.0,
        "status": "CRITICAL_ALERT",
        "alert_message": f"Heavy smoke detected on {target_sensor['element_label']}"
    })
    assert sensor_res.status_code == 200, f"Sensor trigger failed: {sensor_res.text}"
    print("Sensor reading submitted for:", target_sensor_id)

    # Now fetch project graph again - Corridor C should be flagged as hazard
    recalc_res = client.get(f"/api/projects/{project_id}/graph")
    assert recalc_res.status_code == 200
    recalc_graph = recalc_res.json()
    print("Post-Hazard Dynamic Safety State:", recalc_graph.get("dynamic_safety_state"))
    print("Active hazard count:", recalc_graph.get("active_hazard_count"))
    assert recalc_graph["dynamic_safety_state"] in ["HAZARD", "BLOCKED", "WARNING"]
    assert recalc_graph["active_hazard_count"] >= 1

    # Check if any node is flagged is_hazard
    hazard_nodes = [n for n in recalc_graph["nodes"] if n.get("is_hazard")]
    print(f"Detected {len(hazard_nodes)} hazard node(s):", [n["id"] for n in hazard_nodes])
    assert len(hazard_nodes) >= 1
    assert hazard_nodes[0]["hazard_type"] == "SMOKE"
    assert "ppm" in (hazard_nodes[0].get("sensor_reading") or "")

    print("\n[PASS] All voice-to-graph and dynamic sensor recalculation tests passed successfully!")

if __name__ == "__main__":
    test_voice_and_sensor_graph()
