"""
Comprehensive verification test for BuildGuard AI pipeline:
- Project creation
- OCR perception & blueprint element extraction
- Computer Vision / YOLO site photo inspection
- Evidence quality analysis (4 signals)
- Plan vs Actual comparison
- 8 Architectural Safety & Egress Checks
- Safety graph generation & articulation point reasoning
- What-If simulation engine with explainable AI reasoning
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_pipeline():
    print("\n--- 1. Testing Health Endpoint ---")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("Health check response:", res.json())

    print("\n--- 2. Testing Project Creation ---")
    create_payload = {
        "name": "Westfield Commercial Center",
        "building_type": "Commercial",
        "floors": 1
    }
    res = client.post("/api/projects", json=create_payload)
    assert res.status_code == 201, f"Project creation failed: {res.text}"
    project = res.json()
    project_id = project["id"]
    print(f"Created project ID: {project_id}, Name: {project['name']}")

    print("\n--- 3. Testing Full AI Analysis Pipeline (OCR, YOLO/CV, 8 Checks, Evidence Quality) ---")
    res = client.post(f"/api/projects/{project_id}/analyze")
    assert res.status_code == 200, f"Analysis failed: {res.text}"
    analysis = res.json()

    # Check 1: Building Information
    assert "building_info" in analysis, "Missing building_info in analysis"
    b_info = analysis["building_info"]
    print(f"Building Info: {b_info.get('occupancy_group')}, Sprinkler: {b_info.get('sprinkler_protected')}")

    # Check 2: OCR Results
    assert "ocr_results" in analysis, "Missing ocr_results in analysis"
    ocr = analysis["ocr_results"]
    print(f"OCR Recognized Tokens: {len(ocr)} annotations found.")
    assert len(ocr) > 0, "OCR should recognize blueprint annotations"

    # Check 3: YOLO / CV Detections
    assert "cv_detections" in analysis, "Missing cv_detections in analysis"
    cv = analysis["cv_detections"]
    print(f"Computer Vision: {len(cv)} site features detected.")

    # Check 4: Evidence Quality
    assert "evidence_quality" in analysis, "Missing evidence_quality in analysis"
    eq = analysis["evidence_quality"]
    print(f"Evidence Quality Status: {eq.get('blueprint_quality', {}).get('quality_status')}")

    # Check 5: Plan vs Actual
    assert "plan_vs_actual" in analysis, "Missing plan_vs_actual in analysis"
    pva = analysis["plan_vs_actual"]
    print(f"Plan vs Actual Matches: {pva.get('matches')}, Compliance Rate: {pva.get('compliance_rate')}")

    # Check 6: 29 Building Elements Extracted
    summary = analysis["summary"]
    print(f"Building Elements Extracted: {summary['total_elements']} total (Rooms: {summary['rooms']}, Doors: {summary['doors']}, Corridors: {summary['corridors']}, Stairs: {summary['stairs']}, Exits: {summary['exits']}, Ramps: {summary['ramps']})")
    assert summary["total_elements"] == 29, f"Expected 29 building elements, got {summary['total_elements']}"

    # Check 7: 8 Safety Checks Evaluated
    findings = analysis["findings"]
    print(f"Safety Findings Generated: {len(findings)} findings")
    assert len(findings) >= 8, f"Expected at least 8 safety check findings, got {len(findings)}"
    
    print("\n--- Reviewing 8 Safety Checks ---")
    for f in findings:
        print(f"  [{f.get('rule_id', 'CHECK')}] {f['finding_type']} ({f['status']}) - {f['element']}")
        assert f.get("ai_explanation"), f"Finding {f['element']} is missing AI explanation"
        assert f.get("detection_confidence") is not None
        assert f.get("measurement_confidence") is not None
        assert f.get("rule_applicability") is not None
        assert f.get("evidence_quality") is not None

    # Check 8: Safety Graph & Articulation Points
    graph = analysis["graph"]
    print(f"\nSafety Graph: {len(graph['nodes'])} nodes, {len(graph['edges'])} edges")
    print(f"Articulation Points (Single Points of Failure): {graph.get('articulation_points')}")
    assert "corridor_c" in graph.get("articulation_points", []) or "exit_b" in graph.get("articulation_points", [])

    print("\n--- 4. Testing What-If Obstruction Simulation ---")
    sim_payload = {
        "action": "BLOCK",
        "target_element": "Exit B"
    }
    res = client.post(f"/api/projects/{project_id}/simulate", json=sim_payload)
    assert res.status_code == 200, f"Simulation failed: {res.text}"
    sim_res = res.json()
    print("Simulation Result:")
    print(f"  Target: {sim_res['target']}")
    print(f"  Lost Connectivity: {sim_res['lost_connectivity']}")
    print(f"  Affected Rooms: {sim_res['affected_rooms']}")
    print(f"  AI Explanation: {sim_res['message']}")
    assert sim_res["lost_connectivity"] is True, "Blocking Exit B should disconnect rooms"
    assert len(sim_res["affected_rooms"]) >= 3, "Expected at least 3 disconnected rooms"

    print("\n--- 5. Testing Simulation Reset ---")
    res = client.post(f"/api/projects/{project_id}/reset-simulation")
    assert res.status_code == 200, f"Reset simulation failed: {res.text}"
    print("Reset response:", res.json())

    # Verify graph restored
    res = client.get(f"/api/projects/{project_id}/graph")
    assert res.status_code == 200
    restored_graph = res.json()
    assert restored_graph["all_rooms_safe"] is True, "Graph should restore all rooms safe after reset"
    print("Graph fully restored. All rooms have escape routes.")

    print("\n ALL AI PIPELINE AND SAFETY CHECKS VERIFIED SUCCESSFULLY! ")

if __name__ == "__main__":
    test_full_pipeline()
