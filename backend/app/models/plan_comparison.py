from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class PlanComparison(Base):
    __tablename__ = "plan_comparisons"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    element_label = Column(String(100), nullable=False)
    planned_type = Column(String(50), nullable=False)
    actual_type = Column(String(50), nullable=False)
    match_status = Column(String(50), default="MATCH")  # MATCH, MISMATCH, NOT_FOUND, REQUIRES_REVIEW
    confidence = Column(Float, default=0.95)
    variance_details = Column(JSON, nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    project = relationship("Project", back_populates="plan_comparisons")
