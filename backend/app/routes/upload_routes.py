from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.config import settings
from app.models.project import Project
from app.models.asset import Asset
from app.utils.file_handler import save_uploaded_file

router = APIRouter(prefix="/projects", tags=["Uploads"])

@router.post("/{project_id}/blueprint")
async def upload_blueprint(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads a building blueprint image for a project.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    # Save file
    file_name, file_path = save_uploaded_file(file, settings.BLUEPRINT_UPLOAD_DIR)

    # Remove previous blueprint asset if exists
    db.query(Asset).filter(
        Asset.project_id == project_id,
        Asset.asset_type == "BLUEPRINT"
    ).delete()

    asset = Asset(
        project_id=project_id,
        asset_type="BLUEPRINT",
        file_name=file_name,
        file_path=file_path
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    return {
        "success": True,
        "message": "Blueprint uploaded successfully.",
        "asset_id": asset.id,
        "file_name": file_name,
        "url": f"/uploads/blueprints/{file_name}"
    }

@router.post("/{project_id}/photos")
async def upload_site_photos(
    project_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads one or more site verification photos for a project.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    uploaded_assets = []
    for file in files:
        file_name, file_path = save_uploaded_file(file, settings.SITE_PHOTO_UPLOAD_DIR)
        asset = Asset(
            project_id=project_id,
            asset_type="SITE_PHOTO",
            file_name=file_name,
            file_path=file_path
        )
        db.add(asset)
        uploaded_assets.append({
            "file_name": file_name,
            "url": f"/uploads/site_photos/{file_name}"
        })

    db.commit()

    return {
        "success": True,
        "message": f"Successfully uploaded {len(uploaded_assets)} site photos.",
        "photos": uploaded_assets
    }
