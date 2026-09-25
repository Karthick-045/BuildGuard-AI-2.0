from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    building_type = Column(String(100), default="Commercial")
    floors = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    assets = relationship("Asset", back_populates="project", cascade="all, delete-orphan")
    building_elements = relationship("BuildingElement", back_populates="project", cascade="all, delete-orphan")
    graph_nodes = relationship("GraphNode", back_populates="project", cascade="all, delete-orphan")
    graph_edges = relationship("GraphEdge", back_populates="project", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="project", cascade="all, delete-orphan")
    simulation_runs = relationship("SimulationRun", back_populates="project", cascade="all, delete-orphan")
    plan_comparisons = relationship("PlanComparison", back_populates="project", cascade="all, delete-orphan")
    ai_analysis_runs = relationship("AiAnalysisRun", back_populates="project", cascade="all, delete-orphan")
