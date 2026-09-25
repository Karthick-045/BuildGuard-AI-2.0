from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    asset_type = Column(String(50), nullable=False)  # BLUEPRINT, SITE_PHOTO
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    
    # Evidence Quality & CV Inspection State
    resolution_width = Column(Integer, nullable=True)
    resolution_height = Column(Integer, nullable=True)
    brightness = Column(Float, nullable=True)
    contrast = Column(Float, nullable=True)
    sharpness = Column(Float, nullable=True)
    quality_status = Column(String(50), default="PASS")  # PASS, REVIEW, FAIL
    quality_score = Column(Float, default=0.90)
    quality_details = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    project = relationship("Project", back_populates="assets")
