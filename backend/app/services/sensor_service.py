"""
BuildGuard AI — IoT Building Safety Sensor Service
Manages real-time telemetry from environmental, fire, door obstruction,
and occupancy sensors deployed across building elements.
Integrates live sensor streams with the safety graph and AI Chatbot.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.sensor import BuildingSensor
from app.models.project import Project

class SensorService:
    DEFAULT_SENSORS_CONFIG = [
        # Smoke Detectors
        {
            "sensor_id": "SENSOR_SMOKE_ROOM_A",
            "sensor_type": "SMOKE",
            "element_label": "Room A",
            "location": "Room A Ceiling Zone 1",
            "status": "NORMAL",
            "current_value": 11.5,
            "unit": "ppm",
            "threshold": 50.0,
            "battery_level": 98,
            "alert_message": None
        },
        {
            "sensor_id": "SENSOR_SMOKE_ROOM_B",
            "sensor_type": "SMOKE",
            "element_label": "Room B",
            "location": "Room B Ceiling Zone 1",
            "status": "NORMAL",
            "current_value": 14.0,
            "unit": "ppm",
            "threshold": 50.0,
            "battery_level": 94,
            "alert_message": None
        },
        {
            "sensor_id": "SENSOR_SMOKE_CORR_C",
            "sensor_type": "SMOKE",
            "element_label": "Corridor C",
            "location": "Corridor C Egress Junction",
            "status": "NORMAL",
            "current_value": 12.2,
            "unit": "ppm",
            "threshold": 50.0,
            "battery_level": 96,
            "alert_message": None
        },
        {
            "sensor_id": "SENSOR_SMOKE_STAIR_1",
            "sensor_type": "SMOKE",
            "element_label": "Stair 1",
            "location": "Stair 1 Pressurized Enclosure",
            "status": "NORMAL",
            "current_value": 8.0,
            "unit": "ppm",
            "threshold": 50.0,
            "battery_level": 99,
            "alert_message": None
        },
        # Thermal / Heat Sensors
        {
            "sensor_id": "SENSOR_TEMP_ROOM_A",
            "sensor_type": "TEMPERATURE",
            "element_label": "Room A",
            "location": "Room A North Wall",
            "status": "NORMAL",
            "current_value": 21.8,
            "unit": "°C",
            "threshold": 55.0,
            "battery_level": 92,
            "alert_message": None
        },
        {
            "sensor_id": "SENSOR_TEMP_CORR_C",
            "sensor_type": "TEMPERATURE",
            "element_label": "Corridor C",
            "location": "Corridor C Midpoint",
            "status": "NORMAL",
            "current_value": 22.4,
            "unit": "°C",
            "threshold": 55.0,
            "battery_level": 95,
            "alert_message": None
        },
        {
            "sensor_id": "SENSOR_TEMP_EXIT_B",
            "sensor_type": "TEMPERATURE",
            "element_label": "Exit B",
            "location": "Exit Door B Vestibule",
            "status": "NORMAL",
            "current_value": 20.5,
            "unit": "°C",
            "threshold": 55.0,
            "battery_level": 97,
            "alert_message": None
        },
        # Door Contact & Obstruction Sensors
        {
            "sensor_id": "SENSOR_DOOR_EXIT_A",
            "sensor_type": "DOOR_CONTACT",
            "element_label": "Exit Door A",
            "location": "Exit Door A Latch & Panic Bar",
            "status": "NORMAL",
            "current_value": 1.0,  # 1.0 = Closed / Operational, 0.0 = Blocked/Fault
            "unit": "state",
            "threshold": 0.0,
            "battery_level": 100,
            "alert_message": "Door latched, panic hardware operational"
        },
        {
            "sensor_id": "SENSOR_DOOR_EXIT_B",
            "sensor_type": "DOOR_CONTACT",
            "element_label": "Exit Door B",
            "location": "Exit Door B Latch & Panic Bar",
            "status": "NORMAL",
            "current_value": 1.0,
            "unit": "state",
            "threshold": 0.0,
            "battery_level": 100,
            "alert_message": "Door latched, panic hardware operational"
        },
        {
            "sensor_id": "SENSOR_DOOR_FIRE_1",
            "sensor_type": "DOOR_CONTACT",
            "element_label": "Fire Door 1",
            "location": "Corridor West-East Fire Barrier",
            "status": "NORMAL",
            "current_value": 1.0,
            "unit": "state",
            "threshold": 0.0,
            "battery_level": 91,
            "alert_message": "Magnetic release arm armed"
        },
        # Occupancy Telemetry
        {
            "sensor_id": "SENSOR_OCC_ROOM_A",
            "sensor_type": "OCCUPANCY",
            "element_label": "Room A",
            "location": "Room A PIR Sensor",
            "status": "NORMAL",
            "current_value": 14.0,
            "unit": "occupants",
            "threshold": 35.0,
            "battery_level": 90,
            "alert_message": None
        },
        {
            "sensor_id": "SENSOR_OCC_ROOM_B",
            "sensor_type": "OCCUPANCY",
            "element_label": "Room B",
            "location": "Room B PIR Sensor",
            "status": "NORMAL",
            "current_value": 9.0,
            "unit": "occupants",
            "threshold": 25.0,
            "battery_level": 93,
            "alert_message": None
        },
        {
            "sensor_id": "SENSOR_OCC_MAIN_HALL",
            "sensor_type": "OCCUPANCY",
            "element_label": "Main Hallway",
            "location": "Main Hallway Overhead Counter",
            "status": "NORMAL",
            "current_value": 18.0,
            "unit": "occupants",
            "threshold": 60.0,
            "battery_level": 99,
            "alert_message": None
        }
    ]

    @classmethod
    def get_or_init_project_sensors(cls, project_id: int, db: Session) -> List[BuildingSensor]:
        """
        Retrieves existing sensors for the project, or initializes the default
        comprehensive IoT sensor suite if none exist yet.
        """
        existing = db.query(BuildingSensor).filter(BuildingSensor.project_id == project_id).all()
        if existing:
            return existing

        created = []
        for s_cfg in cls.DEFAULT_SENSORS_CONFIG:
            sensor = BuildingSensor(
                project_id=project_id,
                sensor_id=s_cfg["sensor_id"],
                sensor_type=s_cfg["sensor_type"],
                element_label=s_cfg["element_label"],
                location=s_cfg["location"],
                status=s_cfg["status"],
                current_value=s_cfg["current_value"],
                unit=s_cfg["unit"],
                threshold=s_cfg["threshold"],
                battery_level=s_cfg["battery_level"],
                last_reading=datetime.utcnow(),
                alert_message=s_cfg.get("alert_message")
            )
            db.add(sensor)
            created.append(sensor)

        db.commit()
        return db.query(BuildingSensor).filter(BuildingSensor.project_id == project_id).all()

    @classmethod
    def get_sensor_summary(cls, project_id: int, db: Session) -> Dict[str, Any]:
        """
        Provides aggregated statistics of active sensors and any current alarms.
        """
        sensors = cls.get_or_init_project_sensors(project_id, db)
        
        counts_by_type: Dict[str, int] = {}
        counts_by_status: Dict[str, int] = {"NORMAL": 0, "WARNING": 0, "CRITICAL_ALERT": 0, "OFFLINE": 0}
        active_alerts: List[Dict[str, Any]] = []

        for s in sensors:
            counts_by_type[s.sensor_type] = counts_by_type.get(s.sensor_type, 0) + 1
            st = s.status.upper() if s.status else "NORMAL"
            counts_by_status[st] = counts_by_status.get(st, 0) + 1

            if st in ["WARNING", "CRITICAL_ALERT"]:
                active_alerts.append({
                    "sensor_id": s.sensor_id,
                    "sensor_type": s.sensor_type,
                    "element_label": s.element_label,
                    "location": s.location,
                    "status": s.status,
                    "current_value": s.current_value,
                    "threshold": s.threshold,
                    "unit": s.unit,
                    "alert_message": s.alert_message,
                    "last_reading": s.last_reading.isoformat() if s.last_reading else None
                })

        return {
            "total_sensors": len(sensors),
            "by_type": counts_by_type,
            "by_status": counts_by_status,
            "active_alerts_count": len(active_alerts),
            "active_alerts": active_alerts
        }

    @classmethod
    def update_sensor_telemetry(
        cls,
        project_id: int,
        sensor_id: str,
        value: float,
        status: Optional[str] = None,
        alert_message: Optional[str] = None,
        db: Session = None
    ) -> Optional[BuildingSensor]:
        """
        Updates a specific sensor with new live telemetry reading.
        """
        sensor = (
            db.query(BuildingSensor)
            .filter(BuildingSensor.project_id == project_id, BuildingSensor.sensor_id == sensor_id)
            .first()
        )
        if not sensor:
            # Fallback matching by type/name so simulation controls work seamlessly across all facilities
            norm_sid = sensor_id.lower()
            if "smoke" in norm_sid or "corr" in norm_sid:
                sensor = db.query(BuildingSensor).filter(
                    BuildingSensor.project_id == project_id,
                    BuildingSensor.sensor_type == "SMOKE"
                ).first()
            elif "door" in norm_sid or "exit" in norm_sid:
                sensor = db.query(BuildingSensor).filter(
                    BuildingSensor.project_id == project_id,
                    BuildingSensor.sensor_type == "DOOR_CONTACT"
                ).first()
            elif "temp" in norm_sid:
                sensor = db.query(BuildingSensor).filter(
                    BuildingSensor.project_id == project_id,
                    BuildingSensor.sensor_type == "TEMPERATURE"
                ).first()

        if not sensor:
            return None

        sensor.current_value = value
        sensor.last_reading = datetime.utcnow()
        if status:
            sensor.status = status
        elif value > sensor.threshold and sensor.threshold > 0:
            sensor.status = "CRITICAL_ALERT"
        else:
            sensor.status = "NORMAL"

        if alert_message is not None:
            sensor.alert_message = alert_message

        db.commit()
        db.refresh(sensor)
        return sensor

    @classmethod
    def reset_all_sensors(cls, project_id: int, db: Session) -> List[BuildingSensor]:
        """
        Resets all sensors for a project back to normal baseline telemetry values.
        """
        sensors = db.query(BuildingSensor).filter(BuildingSensor.project_id == project_id).all()
        for s in sensors:
            stype = (s.sensor_type or "").upper()
            if stype == "SMOKE":
                s.current_value = 12.0
                s.status = "NORMAL"
                s.alert_message = None
            elif stype == "TEMPERATURE":
                s.current_value = 22.0
                s.status = "NORMAL"
                s.alert_message = None
            elif stype == "DOOR_CONTACT":
                s.current_value = 1.0
                s.status = "NORMAL"
                s.alert_message = "Door latched, panic hardware operational"
            elif stype == "OCCUPANCY":
                s.current_value = 10.0
                s.status = "NORMAL"
                s.alert_message = None
            else:
                s.status = "NORMAL"
                s.alert_message = None
            s.last_reading = datetime.utcnow()

        db.commit()
        return sensors

sensor_service = SensorService()
