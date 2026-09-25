from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    rule_id = Column(String(50), nullable=True)  # EGRESS_CHECK_001, BOTTLENECK_CHECK_002, etc.
    element = Column(String(100), nullable=False)
    finding_type = Column(String(100), nullable=False)  # BOTTLENECK, DEAD_END, EGRESS_RESTRICTION, etc.
    severity = Column(String(50), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(50), default="REQUIRES_REVIEW")  # PASS, WARNING, FAIL, REQUIRES_REVIEW
    description = Column(Text, nullable=False)
    
    # AI Explanation & Remediation Reasoning
    ai_explanation = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    affected_elements = Column(JSON, nullable=True)

    # 4-Layer Trust Confidence Metrics (Slide 7)
    detection_confidence = Column(Float, default=0.95)
    measurement_confidence = Column(Float, default=0.90)
    rule_applicability = Column(Float, default=0.85)
    evidence_quality = Column(Float, default=0.88)

    evidence_asset_id = Column(Integer, ForeignKey("assets.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="findings")
    evidence_asset = relationship("Asset")
