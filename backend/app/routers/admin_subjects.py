# -----------------------------------------------------------------------------
# File: admin_subjects.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Admin router for managing subjects (legacy, may be merged with admin_academics)
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.deps import get_current_admin

router = APIRouter()


@router.get("/subjects", response_model=List[schemas.SubjectResponse])
async def get_all_subjects(
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all subjects (admin only).
    Returns all subjects across all courses.
    """
    subjects = db.query(models.Subject).order_by(models.Subject.course_id, models.Subject.name).all()
    return subjects


@router.post("/subjects", response_model=schemas.SubjectResponse)
async def create_subject(
    subject_data: schemas.SubjectCreate,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new subject (admin only).
    Requires course_id and name. Semester is optional.
    """
    # Validate that the course exists
    course = db.query(models.Course).filter(models.Course.id == subject_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if subject with same name already exists in this course
    existing_subject = db.query(models.Subject).filter(
        models.Subject.course_id == subject_data.course_id,
        models.Subject.name == subject_data.name
    ).first()
    
    if existing_subject:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject with this name already exists in this course"
        )
    
    # Create new subject
    new_subject = models.Subject(
        course_id=subject_data.course_id,
        name=subject_data.name,
        semester=subject_data.semester
    )
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
    return new_subject


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: int,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a subject (admin only).
    This will cascade delete related chats and materials.
    """
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    db.delete(subject)
    db.commit()
    
    return None


