from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class FindingCreate(BaseModel):
    element: str
    finding_type: str
    severity: str
    status: str = "REQUIRES_REVIEW"
    description: str
    detection_confidence: float = 0.95
    measurement_confidence: float = 0.90
    rule_applicability: float = 0.85
    evidence_quality: float = 0.88

class FindingResponse(BaseModel):
    id: int
    project_id: int
    element: str
    finding_type: str
    severity: str
    status: str
    description: str
    detection_confidence: float
    measurement_confidence: float
    rule_applicability: float
    evidence_quality: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
