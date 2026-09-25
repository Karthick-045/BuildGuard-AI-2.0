from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class BuildingElementBase(BaseModel):
    element_type: str  # ROOM, DOOR, CORRIDOR, STAIR, RAMP, EXIT
    label: str
    x: float = 0.0
    y: float = 0.0
    width: float = 0.0
    height: float = 0.0
    confidence: float = 1.0
    source: Optional[str] = "BLUEPRINT"
    detected_class: Optional[str] = None
    bounding_box: Optional[Dict[str, Any]] = None
    attributes: Optional[Dict[str, Any]] = None

class BuildingElementCreate(BuildingElementBase):
    pass

class BuildingElementResponse(BuildingElementBase):
    id: int
    project_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BuildingSummaryResponse(BaseModel):
    rooms: int
    doors: int
    corridors: int
    stairs: int
    exits: int
    ramps: int
    total_elements: int
    elements: List[BuildingElementResponse] = []
