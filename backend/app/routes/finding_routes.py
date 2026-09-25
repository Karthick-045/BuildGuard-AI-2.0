from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.project import Project
from app.services.bottleneck_service import bottleneck_service
from app.schemas.finding import FindingResponse

router = APIRouter(prefix="/projects", tags=["Findings"])

@router.get("/{project_id}/findings", response_model=List[FindingResponse])
def get_project_findings(project_id: int, db: Session = Depends(get_db)):
    """
    Returns all safety findings, bottleneck alerts, and compliance flags.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    return bottleneck_service.get_findings_for_project(project_id, db)
