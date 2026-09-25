from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.building import BuildingSummaryResponse
from app.schemas.finding import FindingResponse
from app.schemas.graph import SafetyGraphResponse

class EvidenceQualitySummary(BaseModel):
    status: str
    average_score: float
    resolution_status: str
    brightness_status: str
    contrast_status: str
    sharpness_status: str

class AiAnalysisResponse(BaseModel):
    success: bool
    project_id: int
    message: str
    building_info: Dict[str, Any]
    ocr_results: List[Dict[str, Any]]
    cv_detections: List[Dict[str, Any]]
    evidence_quality: Dict[str, Any]
    plan_vs_actual: Dict[str, Any]
    checks_summary: Dict[str, Any]
    summary: BuildingSummaryResponse
    findings: List[FindingResponse]
    graph: SafetyGraphResponse
    created_at: datetime = datetime.utcnow()
