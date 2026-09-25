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
