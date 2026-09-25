from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.project import Project
from app.models.finding import Finding
from app.models.building_element import BuildingElement
from app.models.asset import Asset
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectListResponse

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    """
    Creates a new building project.
    """
    new_project = Project(
        name=payload.name,
        building_type=payload.building_type,
        floors=payload.floors
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return ProjectResponse(
        id=new_project.id,
        name=new_project.name,
        building_type=new_project.building_type,
        floors=new_project.floors,
        created_at=new_project.created_at,
        total_findings=0,
        critical_findings=0,
        total_elements=0,
        site_photos_count=0
    )

@router.post("/sample-sensor-workspace", status_code=status.HTTP_201_CREATED)
def create_sample_sensor_workspace(db: Session = Depends(get_db)):
    """
    Creates or loads the dedicated IoT Sensor Simulation Workspace preloaded with
    13 building sensors, structural graph, and dynamic safety recalculation support.
    """
    from app.services.sensor_service import sensor_service
    from app.services.graph_service import graph_service

    sample_name = "IoT Sensor Safety & Dynamic Recalculation Lab"
    existing = db.query(Project).filter(Project.name == sample_name).first()
    if existing:
        # Reset sensors to baseline
        sensor_service.reset_all_sensors(existing.id, db)
        graph_data = graph_service.get_project_graph(existing.id, db)
        return {
            "success": True,
            "project_id": existing.id,
            "project_name": existing.name,
            "message": "Loaded existing Sensor Safety Lab workspace with baseline telemetry.",
            "graph": graph_data.model_dump()
        }

    # Create project
    project = Project(
        name=sample_name,
        building_type="Healthcare",
        floors=2
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    from app.services.blueprint_service import blueprint_service
    from app.services.bottleneck_service import bottleneck_service

    # 1. Populate demo elements
    blueprint_service.generate_demo_elements(project.id, db, None)

    # 2. Sync graph
    graph_service.sync_project_graph(project.id, db)

    # 3. Evaluate 8 checks
    bottleneck_service.analyze_and_record_findings(project.id, db, project.building_type)

    # 4. Initialize sensors
    sensor_service.get_or_init_project_sensors(project.id, db)

    # 5. Fetch computed graph
    graph_data = graph_service.get_project_graph(project.id, db)

    return {
        "success": True,
        "project_id": project.id,
        "project_name": project.name,
        "message": "Initialized new Sample Sensor Workspace with 13 IoT sensors and dynamic graph.",
        "graph": graph_data.model_dump()
    }

@router.get("", response_model=ProjectListResponse)
def get_projects(db: Session = Depends(get_db)):
    """
    Retrieves all projects with summary metrics for the Dashboard.
    """
    projects = db.query(Project).order_by(Project.created_at.desc()).all()

    project_responses = []
    total_findings_count = 0
    critical_findings_count = 0
    buildings_analyzed_count = 0

    for p in projects:
        findings = db.query(Finding).filter(Finding.project_id == p.id).all()
        elements_count = db.query(BuildingElement).filter(BuildingElement.project_id == p.id).count()
        
        # Check blueprint asset
        blueprint_asset = db.query(Asset).filter(
            Asset.project_id == p.id,
            Asset.asset_type == "BLUEPRINT"
        ).first()
        photos_count = db.query(Asset).filter(
            Asset.project_id == p.id,
            Asset.asset_type == "SITE_PHOTO"
        ).count()

        f_count = len(findings)
        crit_count = sum(1 for f in findings if f.severity in ["CRITICAL", "HIGH"])

        total_findings_count += f_count
        critical_findings_count += crit_count
        if elements_count > 0:
            buildings_analyzed_count += 1

        project_responses.append(ProjectResponse(
            id=p.id,
            name=p.name,
            building_type=p.building_type,
            floors=p.floors,
            created_at=p.created_at,
            total_findings=f_count,
            critical_findings=crit_count,
            total_elements=elements_count,
            blueprint_path=f"/uploads/blueprints/{blueprint_asset.file_name}" if blueprint_asset else None,
            site_photos_count=photos_count
        ))

    return ProjectListResponse(
        total_projects=len(projects),
        total_findings=total_findings_count,
        critical_findings=critical_findings_count,
        buildings_analyzed=buildings_analyzed_count,
        projects=project_responses
    )

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """
    Retrieves a single project by ID.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    findings = db.query(Finding).filter(Finding.project_id == project_id).all()
    elements_count = db.query(BuildingElement).filter(BuildingElement.project_id == project_id).count()
    blueprint_asset = db.query(Asset).filter(
        Asset.project_id == project_id,
        Asset.asset_type == "BLUEPRINT"
    ).first()
    photos_count = db.query(Asset).filter(
        Asset.project_id == project_id,
        Asset.asset_type == "SITE_PHOTO"
    ).count()

    f_count = len(findings)
    crit_count = sum(1 for f in findings if f.severity in ["CRITICAL", "HIGH"])

    return ProjectResponse(
        id=project.id,
        name=project.name,
        building_type=project.building_type,
        floors=project.floors,
        created_at=project.created_at,
        total_findings=f_count,
        critical_findings=crit_count,
        total_elements=elements_count,
        blueprint_path=f"/uploads/blueprints/{blueprint_asset.file_name}" if blueprint_asset else None,
        site_photos_count=photos_count
    )

@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """
    Deletes a project and all associated assets, findings, building elements, sensors, and simulations.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    db.delete(project)
    db.commit()
    return {
        "success": True,
        "message": f"Project {project_id} ('{project.name}') and all associated data successfully deleted."
    }

