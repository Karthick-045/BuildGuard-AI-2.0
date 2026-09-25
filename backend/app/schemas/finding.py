from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict

class FindingCreate(BaseModel):
    element: str
    finding_type: str
    severity: str
    status: str = "REQUIRES_REVIEW"
    description: str
    rule_id: Optional[str] = None
    ai_explanation: Optional[str] = None
    remediation: Optional[str] = None
    affected_elements: Optional[List[str]] = None
    detection_confidence: float = 0.95
    measurement_confidence: float = 0.90
    rule_applicability: float = 0.85
    evidence_quality: float = 0.88

class FindingResponse(BaseModel):
    id: int
    project_id: int
    rule_id: Optional[str] = None
    element: str
    finding_type: str
    severity: str
    status: str
    description: str
    ai_explanation: Optional[str] = None
    remediation: Optional[str] = None
    affected_elements: Optional[List[str]] = None
    detection_confidence: float
    measurement_confidence: float
    rule_applicability: float
    evidence_quality: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
