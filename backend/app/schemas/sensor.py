from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class SensorResponse(BaseModel):
    id: int
    sensor_id: str
    sensor_type: str
    element_label: str
    location: str
    status: str
    current_value: float
    unit: str
    threshold: float
    battery_level: int
    last_reading: Optional[datetime] = None
    alert_message: Optional[str] = None

    class Config:
        from_attributes = True

class SensorTelemetryUpdate(BaseModel):
    value: float = Field(..., description="New sensor telemetry reading")
    status: Optional[str] = Field(None, description="NORMAL, WARNING, or CRITICAL_ALERT")
    alert_message: Optional[str] = Field(None, description="Optional incident description")

class SensorTriggerAlertRequest(BaseModel):
    sensor_id: str = Field(..., description="Target sensor ID e.g. SENSOR_SMOKE_ROOM_B")
    value: float = Field(..., description="Simulated value e.g. 78.5 ppm or 65.0 C")
    status: str = Field("CRITICAL_ALERT", description="Alert status")
    alert_message: str = Field("Hazard condition detected", description="Alert message")

class SensorListResponse(BaseModel):
    total_sensors: int
    active_alerts_count: int
    by_type: Dict[str, int]
    by_status: Dict[str, int]
    sensors: List[SensorResponse]
