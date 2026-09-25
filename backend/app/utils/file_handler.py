import os
import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile

def save_uploaded_file(upload_file: UploadFile, target_dir: Path) -> tuple[str, str]:
    """
    Saves an uploaded FastAPI file safely into target_dir.
    Returns: (stored_file_name, stored_file_path)
    """
    target_dir.mkdir(parents=True, exist_ok=True)
    
    original_filename = upload_file.filename or "file"
    file_ext = Path(original_filename).suffix
    stem = Path(original_filename).stem.replace(" ", "_")
    
    unique_name = f"{stem}_{uuid.uuid4().hex[:8]}{file_ext}"
    destination_path = target_dir / unique_name

    with open(destination_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    # Return relative path for database storage and serving
    return unique_name, str(destination_path)
