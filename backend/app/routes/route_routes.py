import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.services.route_service import route_finder_service
from app.schemas.route import DynamicRouteRequest, DynamicRouteResponse

logger = logging.getLogger("buildguard.route_routes")

router = APIRouter(prefix="/projects", tags=["Dynamic Route Finder & Sensor Validation"])

@router.post("/{project_id}/routes/dynamic-find", response_model=DynamicRouteResponse)
def find_dynamic_evacuation_route(
    project_id: int,
    payload: DynamicRouteRequest,
    db: Session = Depends(get_db)
):
    """
    Finds the optimal, safest evacuation path from start_room to the nearest viable EXIT,
    automatically validating IoT sensor hazards (smoke, temperature, door blockages)
    and dynamically rerouting occupants around dangerous building zones.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    try:
        result = route_finder_service.find_dynamic_route(
            project_id=project_id,
            start_room=payload.start_room,
            avoid_elements=payload.avoid_elements,
            use_sensor_alerts=payload.use_sensor_alerts,
            db=db
        )
        return DynamicRouteResponse(**result)
    except Exception as e:
        logger.error(f"Error calculating dynamic route for project {project_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Route calculation error: {str(e)}"
        )
