from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.project import Project
from app.services.blueprint_service import blueprint_service
from app.services.graph_service import graph_service
from app.services.bottleneck_service import bottleneck_service

router = APIRouter(prefix="/projects", tags=["Analysis"])

@router.post("/{project_id}/analyze")
def analyze_project(project_id: int, db: Session = Depends(get_db)):
    """
    Executes building structure analysis.
    In Phase 1, deterministically initializes:
    - 8 Rooms, 12 Doors, 4 Corridors, 2 Stairs, 2 Exits, 1 Ramp (29 building elements)
    - Safety graph nodes and edges
    - Articulation point detection & bottleneck findings
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    # 1. Generate building elements in DB
    summary = blueprint_service.generate_demo_elements(project_id, db)

    # 2. Populate graph in DB
    graph_service.sync_project_graph(project_id, db)

    # 3. Analyze bottlenecks & articulation points to generate findings in DB
    findings = bottleneck_service.analyze_and_record_findings(project_id, db)

    # 4. Fetch the computed safety graph response
    safety_graph = graph_service.get_project_graph(project_id, db)

    return {
        "success": True,
        "message": "Building structure and egress safety graph successfully analyzed.",
        "project_id": project_id,
        "summary": summary,
        "findings": findings,
        "graph": safety_graph
    }
