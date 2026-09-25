"""
BuildGuard AI — Voice Input & Speech-to-Graph Endpoints
"""

import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.services.voice_service import voice_service
from app.services.chat_service import chat_service
from app.services.route_service import route_finder_service
from app.services.sensor_service import sensor_service
from app.services.graph_service import graph_service

logger = logging.getLogger("buildguard.voice_routes")

router = APIRouter(prefix="/voice", tags=["Voice Input & Speech-to-Graph"])

class VoiceBuildRequest(BaseModel):
    speech_transcript: str = Field(..., description="Transcribed spoken speech describing the building structure")
    building_name: Optional[str] = Field(None, description="Optional custom name for the building")

class VoiceCommandRequest(BaseModel):
    command: str = Field(..., description="Spoken voice command e.g. 'simulate fire in corridor', 'find route from room 1'")
    project_id: int

@router.post("/build-project", status_code=status.HTTP_201_CREATED)
async def create_project_from_speech(
    payload: VoiceBuildRequest,
    db: Session = Depends(get_db)
):
    """
    Takes natural speech input describing a building (rooms, corridors, stairs, exits, sensors),
    runs NLP extraction via Gemini / Rule Engine, and builds a complete interactive Safety Graph.
    """
    if not payload.speech_transcript or not payload.speech_transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Speech transcript cannot be empty."
        )

    try:
        # 1. Parse spoken text to architectural schema
        layout = await voice_service.parse_speech_to_layout(
            transcript=payload.speech_transcript,
            building_name=payload.building_name
        )

        # 2. Persist project, elements, graph nodes/edges, and sensors
        project = voice_service.create_project_from_layout(
            layout=layout,
            speech_transcript=payload.speech_transcript,
            db=db
        )

        # 3. Retrieve computed safety graph
        graph_data = graph_service.get_project_graph(project.id, db)

        return {
            "success": True,
            "project_id": project.id,
            "project_name": project.name,
            "building_type": project.building_type,
            "floors": project.floors,
            "elements_created": len(layout.get("elements", [])),
            "sensors_seeded": len(layout.get("sensors", [])),
            "node_count": len(graph_data.nodes),
            "edge_count": len(graph_data.edges),
            "sensor_count": len(layout.get("sensors", [])),
            "parsed_layout": layout,
            "graph": graph_data.model_dump(),
            "message": f"Successfully created '{project.name}' with {len(layout.get('elements', []))} building elements from voice description."
        }
    except Exception as e:
        logger.error(f"Failed to create project from speech: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice building generation failed: {str(e)}"
        )

@router.post("/command")
async def execute_voice_command(
    payload: VoiceCommandRequest,
    db: Session = Depends(get_db)
):
    """
    Executes spoken commands on a project:
    - Route finding: "Find exit from Room A"
    - Sensor simulation: "Simulate smoke in Corridor C"
    - Safety questions: "Are there active hazards?"
    """
    cmd = payload.command.lower().strip()
    project_id = payload.project_id

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found."
        )

    # 1. Route query command
    if "route" in cmd or "evacuat" in cmd or "exit" in cmd or "path" in cmd:
        # Extract room if mentioned
        room = "Room A"
        for candidate in ["Room A", "Room B", "Room C", "Room D", "Room E", "Room F", "Room G", "Room H"]:
            if candidate.lower() in cmd:
                room = candidate
                break

        route_result = route_finder_service.find_dynamic_route(
            project_id=project_id,
            start_room=room,
            use_sensor_alerts=True,
            db=db
        )
        return {
            "action": "ROUTE_FINDER",
            "command": payload.command,
            "spoken_summary": f"Calculated safest egress route from {room} to {route_result['target_exit']}. Total transit: {route_result['total_steps']} steps.",
            "data": route_result
        }

    # 2. Sensor hazard simulation command
    if "smoke" in cmd or "fire" in cmd or "hazard" in cmd:
        # Find matching sensor
        target_sensor_id = "SENSOR_SMOKE_CORR_C"
        if "room b" in cmd:
            target_sensor_id = "SENSOR_SMOKE_ROOM_B"
        elif "room a" in cmd:
            target_sensor_id = "SENSOR_SMOKE_ROOM_A"

        updated = sensor_service.update_sensor_telemetry(
            project_id=project_id,
            sensor_id=target_sensor_id,
            value=85.0,
            status="CRITICAL_ALERT",
            alert_message=f"Voice simulated hazard: heavy smoke alert on {target_sensor_id}",
            db=db
        )
        return {
            "action": "SENSOR_ALERT_TRIGGERED",
            "command": payload.command,
            "spoken_summary": f"Hazard alarm triggered on {target_sensor_id}. Safety Graph has automatically recalculated and isolated the hazard zone.",
            "data": {"sensor_id": target_sensor_id, "reading": "85.0 ppm", "status": "CRITICAL_ALERT"}
        }

    # 3. Reset command
    if "reset" in cmd or "clear" in cmd or "restore" in cmd:
        sensor_service.reset_all_sensors(project_id, db)
        return {
            "action": "RESET",
            "command": payload.command,
            "spoken_summary": "All building sensors have been reset to normal baseline telemetry.",
            "data": {"success": True}
        }

    # 4. Default: Chat Copilot reasoning
    chat_result = await chat_service.call_llm_agent(
        message=payload.command,
        project_id=project_id,
        db=db,
        provider="gemini"
    )
    return {
        "action": "CHAT_RESPONSE",
        "command": payload.command,
        "spoken_summary": chat_result["reply"][:250],
        "data": chat_result
    }
