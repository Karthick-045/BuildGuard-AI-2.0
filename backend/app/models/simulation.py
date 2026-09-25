from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    scenario = Column(String(255), default="Obstruction Simulation")
    action = Column(String(50), nullable=False)  # BLOCK, RESTORE, DISABLE
    target_element = Column(String(100), nullable=False)
    affected_rooms = Column(JSON, nullable=True)
    lost_connectivity = Column(Boolean, default=False)
    result = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    project = relationship("Project", back_populates="simulation_runs")
