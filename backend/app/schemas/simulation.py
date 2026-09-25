from typing import List, Optional, Any
from pydantic import BaseModel, Field

class SimulationRequest(BaseModel):
    action: str = Field(default="BLOCK", description="BLOCK, DISABLE, or RESTORE")
    target_element: Optional[str] = Field(default=None, description="ID of element to block, e.g. 'exit_b'")
    element_id: Optional[str] = Field(default=None, description="Alternative field for target_element")

    def get_target(self) -> str:
        target = self.target_element or self.element_id
        if not target:
            raise ValueError("target_element or element_id must be provided")
        return target.strip().lower()

class SimulationResponse(BaseModel):
    success: bool
    target: str
    action: str
    lost_connectivity: bool
    affected_rooms: List[str]
    message: str
    articulation_points: Optional[List[str]] = []
    simulation_run_id: Optional[int] = None

class ResetSimulationResponse(BaseModel):
    success: bool
    message: str
