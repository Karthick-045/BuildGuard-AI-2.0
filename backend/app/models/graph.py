from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class GraphNode(Base):
    __tablename__ = "graph_nodes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    node_key = Column(String(100), nullable=False)
    node_type = Column(String(50), nullable=False)  # ROOM, DOOR, CORRIDOR, STAIR, RAMP, EXIT
    label = Column(String(100), nullable=False)

    project = relationship("Project", back_populates="graph_nodes")


class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    source_node = Column(String(100), nullable=False)
    target_node = Column(String(100), nullable=False)
    relationship = Column(String(50), default="CONNECTS_TO")  # CONNECTS_TO, LEADS_TO, ESCAPE_ROUTE_TO

    project = relationship("Project", back_populates="graph_edges")
