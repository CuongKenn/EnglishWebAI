import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(tags=["media"])

# Media upload directory
MEDIA_DIR = Path("./media")
AUDIO_DIR = MEDIA_DIR / "audio"
IMAGE_DIR = MEDIA_DIR / "images"
DOCUMENT_DIR = MEDIA_DIR / "documents"

# Create directories if they don't exist
for directory in [AUDIO_DIR, IMAGE_DIR, DOCUMENT_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Allowed file extensions
AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".ppt", ".pptx"}

def get_file_extension(filename: str) -> str:
    """Get file extension in lowercase"""
    return Path(filename).suffix.lower()

def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename using timestamp and UUID"""
    ext = get_file_extension(original_filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"{timestamp}_{unique_id}{ext}"

@router.post("/upload")
async def upload_media_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a media file (audio, image, or document)
    Returns the URL of the uploaded file
    """
    try:
        # Get file extension
        file_ext = get_file_extension(file.filename)

        # Determine file type and directory
        if file_ext in AUDIO_EXTENSIONS:
            upload_dir = AUDIO_DIR
            file_type = "audio"
        elif file_ext in IMAGE_EXTENSIONS:
            upload_dir = IMAGE_DIR
            file_type = "image"
        elif file_ext in DOCUMENT_EXTENSIONS:
            upload_dir = DOCUMENT_DIR
            file_type = "document"
        else:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_ext} is not supported. Supported types: audio, image, document"
            )

        # Generate unique filename
        unique_filename = generate_unique_filename(file.filename)
        file_path = upload_dir / unique_filename

        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Generate URL (accessible via static mount or API route)
        # Use the static mount path since main.py mounts /media as StaticFiles
        file_url = f"/media/{file_type}/{unique_filename}"

        return {
            "success": True,
            "message": "File uploaded successfully",
            "url": file_url,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_type": file_type,
            "size": os.path.getsize(file_path)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}") from e

@router.get("/files/{file_type}/{filename}")
async def get_media_file(file_type: str, filename: str):
    """
    Serve a media file
    """
    # Determine directory based on file type
    if file_type == "audio":
        file_path = AUDIO_DIR / filename
    elif file_type == "image":
        file_path = IMAGE_DIR / filename
    elif file_type == "document":
        file_path = DOCUMENT_DIR / filename
    else:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Check if file exists
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path)

@router.delete("/files/{file_type}/{filename}")
async def delete_media_file(
    file_type: str,
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a media file (only accessible by teachers and admins)
    """
    # Check if user is teacher or admin
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can delete files")

    # Determine directory based on file type
    if file_type == "audio":
        file_path = AUDIO_DIR / filename
    elif file_type == "image":
        file_path = IMAGE_DIR / filename
    elif file_type == "document":
        file_path = DOCUMENT_DIR / filename
    else:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Check if file exists
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        # Delete file
        os.remove(file_path)
        return {
            "success": True,
            "message": "File deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}") from e
