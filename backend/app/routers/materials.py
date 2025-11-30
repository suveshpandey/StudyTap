from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, get_current_admin

router = APIRouter()


@router.post("/documents", response_model=schemas.MaterialDocumentResponse)
async def create_document(
    document_data: schemas.MaterialDocumentCreate,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new material document.
    Validates that the Subject exists.
    """
    # Validate that the Subject exists
    subject = db.query(models.Subject).filter(models.Subject.id == document_data.subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
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
    Returns list ordered by created_at DESC.
    """
    documents = db.query(models.MaterialDocument).filter(
        models.MaterialDocument.subject_id == subject_id
    ).order_by(models.MaterialDocument.created_at.desc()).all()
    
    return documents


@router.post("/chunks", response_model=schemas.MaterialChunkResponse)
async def create_chunk(
    chunk_data: schemas.MaterialChunkCreate,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new material chunk.
    Validates that the MaterialDocument exists.
    """
    # Validate that MaterialDocument exists
    document = db.query(models.MaterialDocument).filter(
        models.MaterialDocument.id == chunk_data.document_id
    ).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material document not found"
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
    Returns list ordered by created_at ASC.
    """
    chunks = db.query(models.MaterialChunk).filter(
        models.MaterialChunk.document_id == document_id
    ).order_by(models.MaterialChunk.created_at.asc()).all()
    
    return chunks

