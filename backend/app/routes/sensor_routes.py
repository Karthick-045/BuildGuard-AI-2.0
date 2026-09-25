import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.sensor import BuildingSensor
from app.services.sensor_service import sensor_service
from app.schemas.sensor import (
    SensorResponse,
    SensorTelemetryUpdate,
    SensorTriggerAlertRequest,
    SensorListResponse
)

logger = logging.getLogger("buildguard.sensor_routes")

router = APIRouter(prefix="/projects", tags=["IoT Building Safety Sensors"])

@router.get("/{project_id}/sensors", response_model=SensorListResponse)
def get_project_sensors(project_id: int, db: Session = Depends(get_db)):
    """
    Returns the real-time telemetry, active alarms, and status of all IoT sensors
    (smoke detectors, heat/temperature, door obstruction contacts, occupancy)
    deployed across the building elements.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    sensors = sensor_service.get_or_init_project_sensors(project_id, db)
    summary = sensor_service.get_sensor_summary(project_id, db)

    return SensorListResponse(
        total_sensors=summary["total_sensors"],
        active_alerts_count=summary["active_alerts_count"],
        by_type=summary["by_type"],
        by_status=summary["by_status"],
        sensors=[SensorResponse.model_validate(s) for s in sensors]
    )

@router.post("/{project_id}/sensors/{sensor_id}/telemetry", response_model=SensorResponse)
def update_sensor_telemetry(
    project_id: int,
    sensor_id: str,
    payload: SensorTelemetryUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates the live telemetry value and status of a specific building sensor.
    """
    sensor = sensor_service.update_sensor_telemetry(
        project_id=project_id,
        sensor_id=sensor_id,
        value=payload.value,
        status=payload.status,
        alert_message=payload.alert_message,
        db=db
    )
    if not sensor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sensor '{sensor_id}' not found for project {project_id}."
        )

    return SensorResponse.model_validate(sensor)

@router.post("/{project_id}/sensors/trigger-alert", response_model=SensorResponse)
def trigger_sensor_alert(
    project_id: int,
    payload: SensorTriggerAlertRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates a hazard alarm (e.g. fire/smoke detection, thermal spike, door blockage)
    on a target sensor to test real-time AI Agent reasoning and evacuation safety.
    """
    sensor = sensor_service.update_sensor_telemetry(
        project_id=project_id,
        sensor_id=payload.sensor_id,
        value=payload.value,
        status=payload.status,
        alert_message=payload.alert_message,
        db=db
    )
    if not sensor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sensor '{payload.sensor_id}' not found."
        )

    return SensorResponse.model_validate(sensor)

@router.post("/{project_id}/sensors/reset", response_model=Dict[str, Any])
def reset_project_sensors(project_id: int, db: Session = Depends(get_db)):
    """
    Clears all active alarms and resets building sensors to normal baseline telemetry.
    """
    sensors = db.query(BuildingSensor).filter(BuildingSensor.project_id == project_id).all()
    for s in sensors:
        s.status = "NORMAL"
        s.alert_message = None
        if s.sensor_type == "SMOKE":
            s.current_value = 12.0
        elif s.sensor_type == "TEMPERATURE":
            s.current_value = 21.5
        elif s.sensor_type == "DOOR_CONTACT":
            s.current_value = 1.0
            s.alert_message = "Door latched, panic hardware operational"
        elif s.sensor_type == "OCCUPANCY":
            s.current_value = 10.0
    db.commit()

    return {
        "success": True,
        "message": f"All {len(sensors)} sensors in project {project_id} reset to NORMAL status."
    }
