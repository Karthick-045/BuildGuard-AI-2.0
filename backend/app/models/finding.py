from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    element = Column(String(100), nullable=False)
    finding_type = Column(String(100), nullable=False)  # BOTTLENECK, DEAD_END, EGRESS_RESTRICTION, etc.
    severity = Column(String(50), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(50), default="REQUIRES_REVIEW")  # PASS, WARNING, FAIL, REQUIRES_REVIEW
    description = Column(Text, nullable=False)
    detection_confidence = Column(Float, default=0.95)
    measurement_confidence = Column(Float, default=0.90)
    rule_applicability = Column(Float, default=0.85)
    evidence_quality = Column(Float, default=0.88)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    project = relationship("Project", back_populates="findings")
