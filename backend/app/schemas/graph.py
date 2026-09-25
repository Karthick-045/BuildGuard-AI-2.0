from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class GraphNodeSchema(BaseModel):
    id: str
    type: str  # ROOM, DOOR, CORRIDOR, STAIR, RAMP, EXIT
    label: str
    is_blocked: Optional[bool] = False
    is_affected: Optional[bool] = False
    is_bottleneck: Optional[bool] = False
    is_hazard: Optional[bool] = False
    hazard_type: Optional[str] = None
    sensor_reading: Optional[str] = None
    sensor_id: Optional[str] = None
    hazard_message: Optional[str] = None
    position: Optional[Dict[str, float]] = None

    model_config = ConfigDict(from_attributes=True)

class GraphEdgeSchema(BaseModel):
    source: str
    target: str
    relationship: Optional[str] = "CONNECTS_TO"  # CONNECTS_TO, LEADS_TO, ESCAPE_ROUTE_TO
    animated: Optional[bool] = False
    is_affected: Optional[bool] = False
    is_egress: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)

class ConnectivityStatus(BaseModel):
    room: str
    connected_to_exit: bool
    nearest_exit: Optional[str] = None
    path: Optional[List[str]] = []

class SafetyGraphResponse(BaseModel):
    nodes: List[GraphNodeSchema]
    edges: List[GraphEdgeSchema]
    connectivity: Optional[List[ConnectivityStatus]] = []
    articulation_points: Optional[List[str]] = []
    all_rooms_safe: Optional[bool] = True
    dynamic_safety_state: Optional[str] = "SAFE"
    active_hazard_count: Optional[int] = 0
    isolated_rooms: Optional[List[str]] = []
