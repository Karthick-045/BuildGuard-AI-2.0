from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class ProjectCreate(BaseModel):
    name: str
    building_type: str = "Commercial"
    floors: int = 1

class ProjectResponse(BaseModel):
    id: int
    name: str
    building_type: str
    floors: int
    created_at: datetime
    
    # Optional counts for dashboard card
    total_findings: Optional[int] = 0
    critical_findings: Optional[int] = 0
    total_elements: Optional[int] = 0
    blueprint_path: Optional[str] = None
    site_photos_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class ProjectListResponse(BaseModel):
    total_projects: int
    total_findings: int
    critical_findings: int
    buildings_analyzed: int
    projects: List[ProjectResponse]
