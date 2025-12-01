# -----------------------------------------------------------------------------
# File: admin_academics.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Admin router for managing courses and subjects (CRUD operations)
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.deps import get_current_admin

router = APIRouter()


# Course Management Endpoints

@router.get("/courses", response_model=List[schemas.CourseResponse])
async def get_all_courses(
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all courses (admin only).
    Returns all courses ordered by name.
    """
    courses = db.query(models.Course).order_by(models.Course.name).all()
    return courses


@router.post("/courses", response_model=schemas.CourseResponse)
async def create_course(
    course_data: schemas.CourseCreate,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new course (admin only).
    """
    # Check if course with same name already exists
    existing_course = db.query(models.Course).filter(
        models.Course.name == course_data.name
    ).first()
    
    if existing_course:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course with this name already exists"
        )
    
    # Create new course
    new_course = models.Course(name=course_data.name)
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return new_course


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a course (admin only).
    If there are subjects under this course, prevent deletion with 400 error.
    """
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if there are subjects under this course
    subjects_count = db.query(models.Subject).filter(
        models.Subject.course_id == course_id
    ).count()
    
    if subjects_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete course. There are {subjects_count} subject(s) associated with this course. Please delete all subjects first."
        )
    
    db.delete(course)
    db.commit()
    
    return None


# Subject Management Endpoints

@router.get("/subjects", response_model=List[schemas.SubjectResponse])
async def get_all_subjects(
    course_id: Optional[int] = Query(None, description="Optional course ID to filter by"),
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all subjects (admin only).
    If course_id is provided, filter by course_id; otherwise return all.
    """
    query = db.query(models.Subject)
    
    if course_id is not None:
        query = query.filter(models.Subject.course_id == course_id)
    
    subjects = query.order_by(models.Subject.course_id, models.Subject.name).all()
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


