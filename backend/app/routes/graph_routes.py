from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.project import Project
from app.services.graph_service import graph_service
from app.schemas.graph import SafetyGraphResponse

router = APIRouter(prefix="/projects", tags=["Safety Graph"])

@router.get("/{project_id}/graph", response_model=SafetyGraphResponse)
def get_project_graph(project_id: int, db: Session = Depends(get_db)):
    """
    Returns the nodes, edges, and connectivity state of the safety graph.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    # Return graph representation
    return graph_service.get_project_graph(project_id, db)
