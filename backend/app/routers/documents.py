"""Document upload and management API endpoints."""
import os
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user, require_analyst
from ..models.models import Document, Property, User
from ..schemas import DocumentOut
from ..config import get_settings

router = APIRouter(prefix="/documents", tags=["Documents"])
settings = get_settings()

# Ensure upload directory exists
os.makedirs(settings.upload_directory, exist_ok=True)

ALLOWED_EXTENSIONS = {
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 
    'png', 'jpg', 'jpeg', 'gif',
    'dwg', 'dxf'  # CAD files for plats
}

DOCUMENT_TYPES = [
    "Plat", "Site Plan", "Cost Sheet", "Contract",
    "Permit", "Survey", "Photo", "Correspondence", "Other"
]


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_file_type(filename: str) -> str:
    """Get file type from extension."""
    if '.' not in filename:
        return "Unknown"
    ext = filename.rsplit('.', 1)[1].lower()
    type_map = {
        'pdf': 'PDF',
        'doc': 'Word',
        'docx': 'Word',
        'xls': 'Excel',
        'xlsx': 'Excel',
        'png': 'Image',
        'jpg': 'Image',
        'jpeg': 'Image',
        'gif': 'Image',
        'dwg': 'CAD',
        'dxf': 'CAD'
    }
    return type_map.get(ext, "Unknown")


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    property_id: int = Form(...),
    document_type: str = Form("Other"),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Upload a document for a property."""
    # Validate property exists
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Validate file
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    contents = await file.read()
    if len(contents) > settings.max_upload_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_upload_size // (1024*1024)}MB"
        )
    
    # Generate unique filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4()}.{ext}"
    
    # Create property subdirectory
    prop_dir = os.path.join(settings.upload_directory, f"property_{property_id}")
    os.makedirs(prop_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(prop_dir, unique_filename)
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Create document record
    doc = Document(
        property_id=property_id,
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_type=get_file_type(file.filename),
        file_size=len(contents),
        document_type=document_type,
        description=description,
        uploaded_by_id=current_user.id
    )
    
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return doc


@router.get("", response_model=List[DocumentOut])
async def list_documents(
    property_id: Optional[int] = None,
    document_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List documents with optional filters."""
    query = db.query(Document)
    
    if property_id:
        query = query.filter(Document.property_id == property_id)
    if document_type:
        query = query.filter(Document.document_type == document_type)
    if search:
        query = query.filter(Document.original_filename.ilike(f"%{search}%"))
    
    return query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/property/{property_id}", response_model=List[DocumentOut])
async def get_property_documents(property_id: int, db: Session = Depends(get_db)):
    """Get all documents for a property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return db.query(Document).filter(Document.property_id == property_id).order_by(Document.created_at.desc()).all()


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(doc_id: int, db: Session = Depends(get_db)):
    """Get document metadata."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{doc_id}/download")
async def download_document(doc_id: int, db: Session = Depends(get_db)):
    """Download a document file."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        path=doc.file_path,
        filename=doc.original_filename,
        media_type='application/octet-stream'
    )


@router.patch("/{doc_id}", response_model=DocumentOut)
async def update_document(
    doc_id: int,
    document_type: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Update document metadata."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document_type:
        doc.document_type = document_type
    if description is not None:
        doc.description = description
    
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Delete a document."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from disk
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    
    db.delete(doc)
    db.commit()
    
    return {"message": "Document deleted"}


@router.get("/types")
async def get_document_types():
    """Get list of available document types."""
    return DOCUMENT_TYPES
