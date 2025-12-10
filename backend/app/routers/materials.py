# -----------------------------------------------------------------------------
# File: materials.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Admin router for managing study material documents and chunks
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Union
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, get_current_university_admin
from app.s3_config import upload_file_to_s3, generate_s3_key, S3_ENABLED
import os

# Type alias for role models
RoleModel = Union[models.MasterAdmin, models.UniversityAdmin, models.Student]

router = APIRouter()


@router.post("/documents", response_model=schemas.MaterialDocumentResponse)
async def create_document(
    document_data: schemas.MaterialDocumentCreate,
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new material document (university admin only).
    Validates that the Subject exists and belongs to admin's university.
    """
    # Validate that the Subject exists and belongs to admin's university
    subject = (
        db.query(models.Subject)
        .join(models.Semester, models.Subject.semester_id == models.Semester.id)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(
            models.Subject.id == document_data.subject_id,
            models.Branch.university_id == current_admin.university_id
        )
        .first()
    )
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Subject not found or does not belong to your university"
        )
    
    # Create MaterialDocument with source_type="manual" and s3_key=None
    new_document = models.MaterialDocument(
        subject_id=document_data.subject_id,
        title=document_data.title,
        source_type="manual",
        s3_key=None
    )
    db.add(new_document)
    db.commit()
    db.refresh(new_document)
    
    return new_document


@router.get("/documents/{subject_id}", response_model=List[schemas.MaterialDocumentResponse])
async def get_documents_by_subject(
    subject_id: int,
    current_user: RoleModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all material documents for a specific subject.
    Only returns documents for subjects in the user's university.
    Returns list ordered by created_at DESC.
    """
    # Get university_id based on role
    university_id = None
    if isinstance(current_user, models.Student):
        university_id = current_user.university_id
    elif isinstance(current_user, models.UniversityAdmin):
        university_id = current_user.university_id
    elif isinstance(current_user, models.MasterAdmin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Master admin cannot access documents. Please use the admin panel."
        )
    
    if university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not assigned to any university"
        )
    
    # Filter by subject_id and ensure subject belongs to user's university
    documents = (
        db.query(models.MaterialDocument)
        .join(models.Subject, models.MaterialDocument.subject_id == models.Subject.id)
        .join(models.Semester, models.Subject.semester_id == models.Semester.id)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(
            models.MaterialDocument.subject_id == subject_id,
            models.Branch.university_id == university_id
        )
        .order_by(models.MaterialDocument.created_at.desc())
        .all()
    )
    
    return documents


@router.post("/chunks", response_model=schemas.MaterialChunkResponse)
async def create_chunk(
    chunk_data: schemas.MaterialChunkCreate,
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new material chunk (university admin only).
    Validates that the MaterialDocument exists and belongs to admin's university.
    """
    # Validate that MaterialDocument exists and belongs to admin's university
    document = (
        db.query(models.MaterialDocument)
        .join(models.Subject, models.MaterialDocument.subject_id == models.Subject.id)
        .join(models.Semester, models.Subject.semester_id == models.Semester.id)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(
            models.MaterialDocument.id == chunk_data.document_id,
            models.Branch.university_id == current_admin.university_id
        )
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Material document not found or does not belong to your university"
        )
    
    # Create MaterialChunk
    new_chunk = models.MaterialChunk(
        document_id=chunk_data.document_id,
        page_number=chunk_data.page_number,
        heading=chunk_data.heading,
        keywords=chunk_data.keywords,
        text=chunk_data.text
    )
    db.add(new_chunk)
    db.commit()
    db.refresh(new_chunk)
    
    return new_chunk


@router.get("/chunks/{document_id}", response_model=List[schemas.MaterialChunkResponse])
async def get_chunks_by_document(
    document_id: int,
    current_user: RoleModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all material chunks for a specific document.
    Only returns chunks for documents in the user's university.
    Returns list ordered by created_at ASC.
    """
    # Get university_id based on role
    university_id = None
    if isinstance(current_user, models.Student):
        university_id = current_user.university_id
    elif isinstance(current_user, models.UniversityAdmin):
        university_id = current_user.university_id
    elif isinstance(current_user, models.MasterAdmin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Master admin cannot access chunks. Please use the admin panel."
        )
    
    if university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not assigned to any university"
        )
    
    # Filter by document_id and ensure document belongs to user's university
    chunks = (
        db.query(models.MaterialChunk)
        .join(models.MaterialDocument, models.MaterialChunk.document_id == models.MaterialDocument.id)
        .join(models.Subject, models.MaterialDocument.subject_id == models.Subject.id)
        .join(models.Semester, models.Subject.semester_id == models.Semester.id)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(
            models.MaterialChunk.document_id == document_id,
            models.Branch.university_id == university_id
        )
        .order_by(models.MaterialChunk.created_at.asc())
        .all()
    )
    
    return chunks


@router.post("/documents/upload", response_model=schemas.MaterialDocumentResponse)
async def upload_document_to_s3(
    file: UploadFile = File(...),
    branch_id: int = Form(...),
    subject_id: int = Form(...),
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF document to AWS S3 (university admin only).
    Creates a MaterialDocument with source_type='pdf' and stores the S3 key.
    
    S3 Key Format: universities/{university_id}/branches/{branch_id}/subjects/{subject_id}/materials/{uuid}.pdf
    
    Args:
        file: PDF file to upload
        branch_id: Branch ID (required for S3 key generation)
        subject_id: Subject ID
        current_admin: Current authenticated university admin
        db: Database session
    
    Returns:
        Created MaterialDocument with S3 key
    """
    # Check if S3 is configured
    if not S3_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="S3 upload is not configured. Please contact the system administrator."
        )
    
    # Validate file type (PDF only)
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Validate file extension
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ['.pdf']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .pdf files are allowed"
        )
    
    # Validate that the Subject exists and belongs to admin's university
    subject = (
        db.query(models.Subject)
        .join(models.Semester, models.Subject.semester_id == models.Semester.id)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(
            models.Subject.id == subject_id,
            models.Branch.university_id == current_admin.university_id
        )
        .first()
    )
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Subject not found or does not belong to your university"
        )
    
    # Validate that the provided branch_id matches the subject's branch
    if subject.semester.branch_id != branch_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Branch ID does not match the subject's branch"
        )
    
    # Validate that the branch belongs to admin's university
    branch = db.query(models.Branch).filter(
        models.Branch.id == branch_id,
        models.Branch.university_id == current_admin.university_id
    ).first()
    
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Branch not found or does not belong to your university"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Validate file size (max 50MB)
        max_size = 50 * 1024 * 1024  # 50MB in bytes
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size must be less than 50MB"
            )
        
        # Generate S3 key
        s3_key = generate_s3_key(
            university_id=current_admin.university_id,
            branch_id=branch_id,
            subject_id=subject_id,
            file_extension='pdf'
        )
        
        # Upload to S3
        upload_file_to_s3(
            file_content=file_content,
            s3_key=s3_key,
            content_type="application/pdf"
        )
        
        # Create MaterialDocument with source_type="pdf" and the S3 key
        # Use the original filename (without extension) as the title
        title = os.path.splitext(file.filename)[0]
        
        new_document = models.MaterialDocument(
            subject_id=subject_id,
            title=title,
            source_type="pdf",
            s3_key=s3_key
        )
        db.add(new_document)
        db.commit()
        db.refresh(new_document)
        
        return new_document
        
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(ve)
        )
    except Exception as e:
        # Rollback database transaction if there was an error
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )

