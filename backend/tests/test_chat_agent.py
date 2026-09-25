"""
Verification tests for BuildGuard AI Agent Chatbot & Real Backend Data API.
Tests:
- /api/chat/status endpoint
- /api/projects/{id}/chat with project context grounding
- Articulation point reasoning
- What-if obstruction simulation reasoning
- 8 Safety Checks audit query
- ADA compliance & plan-vs-actual variance queries
- Robust fallback when no API key or mock key is provided
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_chat_agent():
    print("\n--- 1. Testing Chat Status Endpoint ---")
    res = client.get("/api/chat/status")
    assert res.status_code == 200, f"Chat status failed: {res.text}"
    status_data = res.json()
    print("Chat status:", status_data)
    assert "supported_providers" in status_data
    assert "gemini" in status_data["supported_providers"]

    print("\n--- 2. Testing Chat 404 on Non-Existent Project ---")
    res = client.post("/api/projects/999999/chat", json={"message": "Hello"})
    assert res.status_code == 404, "Expected 404 for invalid project ID"

    print("\n--- 3. Setting Up Project with Real Backend Data ---")
    # Create project
    create_res = client.post("/api/projects", json={
        "name": "Chatbot Grounding Test Facility",
        "building_type": "Commercial",
        "floors": 1
    })
    assert create_res.status_code == 201
    project_id = create_res.json()["id"]

    # Run analysis pipeline to populate real database tables
    analyze_res = client.post(f"/api/projects/{project_id}/analyze")
    assert analyze_res.status_code == 200

    print(f"Project #{project_id} initialized with real building elements, graph, and 8 checks.")

    print("\n--- 4. Testing Query: Articulation Points ---")
    chat_res = client.post(f"/api/projects/{project_id}/chat", json={
        "message": "Which elements are articulation points in this building?"
    })
    assert chat_res.status_code == 200, f"Chat error: {chat_res.text}"
    reply_data = chat_res.json()
    print("Provider used:", reply_data["provider_used"])
    print("Reply snippet:\n", reply_data["reply"][:250], "...")
    assert reply_data["success"] is True
    assert "Corridor C" in reply_data["reply"] or "corridor_c" in reply_data["reply"]
    assert reply_data["context_summary"]["articulation_points_count"] > 0

    print("\n--- 5. Testing Query: What-If Simulation (Exit B Blocked) ---")
    chat_res = client.post(f"/api/projects/{project_id}/chat", json={
        "message": "What happens if Exit B is blocked?"
    })
    assert chat_res.status_code == 200
    reply_data = chat_res.json()
    print("Simulation reply snippet:\n", reply_data["reply"][:300], "...")
    assert "Exit B" in reply_data["reply"] or "exit_b" in reply_data["reply"]
    assert "Room A" in reply_data["reply"] or "room" in reply_data["reply"].lower()

    print("\n--- 6. Testing Query: 8 Safety Checks Summary ---")
    chat_res = client.post(f"/api/projects/{project_id}/chat", json={
        "message": "Summarize the 8 safety checks for this project."
    })
    assert chat_res.status_code == 200
    reply_data = chat_res.json()
    print("8 Checks reply snippet:\n", reply_data["reply"][:300], "...")
    assert "findings" in reply_data["reply"].lower() or "check" in reply_data["reply"].lower()

    print("\n--- 7. Testing Query: ADA Ramp Compliance ---")
    chat_res = client.post(f"/api/projects/{project_id}/chat", json={
        "message": "Is Ramp 1 ADA compliant?"
    })
    assert chat_res.status_code == 200
    reply_data = chat_res.json()
    print("ADA Ramp reply snippet:\n", reply_data["reply"][:300], "...")
    assert "ramp" in reply_data["reply"].lower()

    print("\n--- 8. Testing User-Provided API Key Handling (Fallback on invalid key) ---")
    chat_res = client.post(f"/api/projects/{project_id}/chat", json={
        "message": "Show priority remediation recommendations.",
        "api_key": "invalid_test_api_key_12345",
        "provider": "gemini"
    })
    assert chat_res.status_code == 200
    reply_data = chat_res.json()
    print("Key test reply snippet:\n", reply_data["reply"][:250], "...")
    assert reply_data["success"] is True
    assert "Remediation" in reply_data["reply"] or "action" in reply_data["reply"].lower()

    print("\n--- 9. Testing IoT Building Sensors Endpoint ---")
    sensor_res = client.get(f"/api/projects/{project_id}/sensors")
    assert sensor_res.status_code == 200, f"Sensors failed: {sensor_res.text}"
    sensor_data = sensor_res.json()
    print(f"Sensors verified: {sensor_data['total_sensors']} total, {sensor_data['active_alerts_count']} active alerts")
    assert sensor_data["total_sensors"] >= 10
    assert "SMOKE" in sensor_data["by_type"]
    assert "TEMPERATURE" in sensor_data["by_type"]

    print("\n--- 10. Testing Chatbot Sensor Telemetry Query ---")
    chat_sensor = client.post(f"/api/projects/{project_id}/chat", json={
        "message": "What is the status of the building sensors and telemetry?"
    })
    assert chat_sensor.status_code == 200
    sensor_reply = chat_sensor.json()
    print("Chatbot Sensor Telemetry snippet:\n", sensor_reply["reply"][:250], "...")
    assert "sensors" in sensor_reply["reply"].lower() or "telemetry" in sensor_reply["reply"].lower()

    print("\n--- 11. Testing Sensor Trigger Alert & Chatbot Hazard Notification ---")
    alert_res = client.post(f"/api/projects/{project_id}/sensors/trigger-alert", json={
        "sensor_id": "SENSOR_SMOKE_ROOM_B",
        "value": 75.0,
        "status": "CRITICAL_ALERT",
        "alert_message": "Dense particulate smoke detected in Room B"
    })
    assert alert_res.status_code == 200

    chat_alert = client.post(f"/api/projects/{project_id}/chat", json={
        "message": "Are there any fire or smoke alarms triggered right now?"
    })
    assert chat_alert.status_code == 200
    alert_reply = chat_alert.json()
    print("Chatbot Sensor Alarm snippet:\n", alert_reply["reply"][:300], "...")
    assert "SENSOR_SMOKE_ROOM_B" in alert_reply["reply"] or "Room B" in alert_reply["reply"]

    print("\n--- 12. Resetting Sensor Telemetry ---")
    reset_res = client.post(f"/api/projects/{project_id}/sensors/reset")
    assert reset_res.status_code == 200
    print("Sensor reset response:", reset_res.json())

    print("\n✅ ALL CHAT AGENT & SENSOR TELEMETRY TESTS PASSED!")

if __name__ == "__main__":
    test_chat_agent()

