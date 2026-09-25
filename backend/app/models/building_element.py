from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class BuildingElement(Base):
    __tablename__ = "building_elements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    element_type = Column(String(50), nullable=False)  # ROOM, DOOR, CORRIDOR, STAIR, RAMP, EXIT
    label = Column(String(100), nullable=False)
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    width = Column(Float, default=0.0)
    height = Column(Float, default=0.0)
    confidence = Column(Float, default=1.0)
    
    # AI Detection Metadata
    source = Column(String(50), default="BLUEPRINT")  # BLUEPRINT, SITE_PHOTO
    detected_class = Column(String(50), nullable=True)
    bounding_box = Column(JSON, nullable=True)
    attributes = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    project = relationship("Project", back_populates="building_elements")
