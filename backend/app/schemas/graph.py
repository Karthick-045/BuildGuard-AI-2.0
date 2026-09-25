from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class GraphNodeSchema(BaseModel):
    id: str
    type: str  # ROOM, DOOR, CORRIDOR, STAIR, RAMP, EXIT
    label: str
    is_blocked: Optional[bool] = False
    is_affected: Optional[bool] = False
    is_bottleneck: Optional[bool] = False
    position: Optional[Dict[str, float]] = None

    model_config = ConfigDict(from_attributes=True)

class GraphEdgeSchema(BaseModel):
    source: str
    target: str
    relationship: Optional[str] = "CONNECTS_TO"  # CONNECTS_TO, LEADS_TO, ESCAPE_ROUTE_TO
    animated: Optional[bool] = False
    is_affected: Optional[bool] = False

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
