from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class RouteStep(BaseModel):
    id: str
    label: str
    type: str
    position: Optional[Dict[str, float]] = None

class DynamicRouteRequest(BaseModel):
    start_room: Optional[str] = Field(None, description="Origin room e.g. Room A, Room B, Room D")
    from_location: Optional[str] = Field(None, description="Alternative alias for start_room")
    avoid_elements: Optional[List[str]] = Field(default=[], description="Explicit nodes to avoid")
    use_sensor_alerts: bool = Field(True, description="Whether to automatically avoid active sensor hazards")

    def get_start_room(self) -> str:
        return self.start_room or self.from_location or "Room A"

class DynamicRouteResponse(BaseModel):
    success: bool
    project_id: int
    start_room: str
    start_node_id: Optional[str] = None
    target_exit: str
    target_exit_id: Optional[str] = None
    route_status: str
    total_steps: int
    route_steps: List[RouteStep]
    hazards_avoided: List[str]
    sensor_validation: Dict[str, Any]
    ai_guidance: str
