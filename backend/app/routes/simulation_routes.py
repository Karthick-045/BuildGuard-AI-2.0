from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.project import Project
from app.services.simulation_service import simulation_service
from app.schemas.simulation import SimulationRequest, SimulationResponse, ResetSimulationResponse

router = APIRouter(prefix="/projects", tags=["What-If Simulation"])

@router.post("/{project_id}/simulate", response_model=SimulationResponse)
def simulate_obstruction(
    project_id: int,
    payload: SimulationRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates obstruction of an exit, corridor, or stair and computes affected rooms.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    return simulation_service.run_simulation(project_id, payload, db)

@router.post("/{project_id}/reset-simulation", response_model=ResetSimulationResponse)
def reset_simulation(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    Clears all active simulated blockages and restores the base graph.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    return simulation_service.reset_simulation(project_id, db)
