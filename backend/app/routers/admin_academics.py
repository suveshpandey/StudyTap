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
from app.deps import get_current_university_admin

router = APIRouter()


# Course Management Endpoints

@router.get("/courses", response_model=List[schemas.CourseResponse])
async def get_all_courses(
    current_admin: models.User = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Get all courses for the university admin's university.
    Returns courses ordered by name, filtered by university_id.
    """
    courses = (
        db.query(models.Course)
        .filter(models.Course.university_id == current_admin.university_id)
        .order_by(models.Course.name)
        .all()
    )
    return courses


@router.post("/courses", response_model=schemas.CourseResponse)
async def create_course(
    course_data: schemas.CourseCreate,
    current_admin: models.User = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new course for the university admin's university.
    """
    if current_admin.university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    # Check if course with same name already exists in this university
    existing_course = db.query(models.Course).filter(
        models.Course.name == course_data.name,
        models.Course.university_id == current_admin.university_id
    ).first()
    
    if existing_course:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course with this name already exists in your university"
        )
    
    # Create new course with university_id from current admin
    new_course = models.Course(
        name=course_data.name,
        university_id=current_admin.university_id,
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return new_course


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    current_admin: models.User = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a course (university admin only).
    Only allows deletion if course belongs to admin's university.
    If there are subjects under this course, prevent deletion with 400 error.
    """
    course = (
        db.query(models.Course)
        .filter(
            models.Course.id == course_id,
            models.Course.university_id == current_admin.university_id
        )
        .first()
    )
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found for your university"
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
    current_admin: models.User = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Get all subjects for courses in the university admin's university.
    If course_id is provided, ensure it belongs to admin's university and filter by course_id.
    """
    # Base query: join Subject with Course and filter by university_id
    query = (
        db.query(models.Subject)
        .join(models.Course, models.Subject.course_id == models.Course.id)
        .filter(models.Course.university_id == current_admin.university_id)
    )
    
    if course_id is not None:
        # Ensure the course_id belongs to admin's university
        course = (
            db.query(models.Course)
            .filter(
                models.Course.id == course_id,
                models.Course.university_id == current_admin.university_id
            )
            .first()
        )
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found for your university"
            )
        query = query.filter(models.Subject.course_id == course_id)
    
    subjects = query.order_by(models.Subject.course_id, models.Subject.name).all()
    return subjects


@router.post("/subjects", response_model=schemas.SubjectResponse)
async def create_subject(
    subject_data: schemas.SubjectCreate,
    current_admin: models.User = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new subject (university admin only).
    Requires course_id and name. Semester is optional.
    Validates that course belongs to admin's university.
    """
    # Validate that the course exists AND belongs to current_admin.university_id
    course = (
        db.query(models.Course)
        .filter(
            models.Course.id == subject_data.course_id,
            models.Course.university_id == current_admin.university_id,
        )
        .first()
    )
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found for your university.",
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
    current_admin: models.User = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a subject (university admin only).
    Only allows deletion if subject belongs to a course in admin's university.
    This will cascade delete related chats and materials.
    """
    subject = (
        db.query(models.Subject)
        .join(models.Course, models.Subject.course_id == models.Course.id)
        .filter(
            models.Subject.id == subject_id,
            models.Course.university_id == current_admin.university_id
        )
        .first()
    )
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found for your university"
        )
    
    db.delete(subject)
    db.commit()
    
    return None


