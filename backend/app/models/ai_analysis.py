from datetime import datetime
from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class AiAnalysisRun(Base):
    __tablename__ = "ai_analysis_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="COMPLETED")  # PENDING, PROCESSING, COMPLETED, FAILED
    ocr_status = Column(String(50), default="COMPLETED")
    yolo_cv_status = Column(String(50), default="COMPLETED")
    evidence_quality_status = Column(String(50), default="PASS")
    checks_passed = Column(Integer, default=7)
    checks_warning = Column(Integer, default=1)
    checks_failed = Column(Integer, default=0)
    total_elements_detected = Column(Integer, default=29)
    building_info = Column(JSON, nullable=True)
    ocr_results = Column(JSON, nullable=True)
    cv_detections = Column(JSON, nullable=True)
    plan_vs_actual_summary = Column(JSON, nullable=True)
    checks_summary = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    project = relationship("Project", back_populates="ai_analysis_runs")
