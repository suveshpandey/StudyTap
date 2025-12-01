# -----------------------------------------------------------------------------
# File: materials.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Admin router for managing study material documents and chunks
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, get_current_university_admin

router = APIRouter()


@router.post("/documents", response_model=schemas.MaterialDocumentResponse)
async def create_document(
    document_data: schemas.MaterialDocumentCreate,
    current_admin: models.User = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new material document (university admin only).
    Validates that the Subject exists and belongs to admin's university.
    """
    # Validate that the Subject exists and belongs to admin's university
    subject = (
        db.query(models.Subject)
        .join(models.Course, models.Subject.course_id == models.Course.id)
        .filter(
            models.Subject.id == document_data.subject_id,
            models.Course.university_id == current_admin.university_id
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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all material documents for a specific subject.
    Only returns documents for subjects in the user's university.
    Returns list ordered by created_at DESC.
    """
    if current_user.university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not assigned to any university"
        )
    
    # Filter by subject_id and ensure subject belongs to user's university
    documents = (
        db.query(models.MaterialDocument)
        .join(models.Subject, models.MaterialDocument.subject_id == models.Subject.id)
        .join(models.Course, models.Subject.course_id == models.Course.id)
        .filter(
            models.MaterialDocument.subject_id == subject_id,
            models.Course.university_id == current_user.university_id
        )
        .order_by(models.MaterialDocument.created_at.desc())
        .all()
    )
    
    return documents


@router.post("/chunks", response_model=schemas.MaterialChunkResponse)
async def create_chunk(
    chunk_data: schemas.MaterialChunkCreate,
    current_admin: models.User = Depends(get_current_university_admin),
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
        .join(models.Course, models.Subject.course_id == models.Course.id)
        .filter(
            models.MaterialDocument.id == chunk_data.document_id,
            models.Course.university_id == current_admin.university_id
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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all material chunks for a specific document.
    Only returns chunks for documents in the user's university.
    Returns list ordered by created_at ASC.
    """
    if current_user.university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not assigned to any university"
        )
    
    # Filter by document_id and ensure document belongs to user's university
    chunks = (
        db.query(models.MaterialChunk)
        .join(models.MaterialDocument, models.MaterialChunk.document_id == models.MaterialDocument.id)
        .join(models.Subject, models.MaterialDocument.subject_id == models.Subject.id)
        .join(models.Course, models.Subject.course_id == models.Course.id)
        .filter(
            models.MaterialChunk.document_id == document_id,
            models.Course.university_id == current_user.university_id
        )
        .order_by(models.MaterialChunk.created_at.asc())
        .all()
    )
    
    return chunks

