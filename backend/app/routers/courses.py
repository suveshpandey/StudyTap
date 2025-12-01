# -----------------------------------------------------------------------------
# File: courses.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Student-facing read-only router for courses and subjects
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter()


@router.get("/universities", response_model=List[schemas.UniversityResponse])
async def get_universities(
    db: Session = Depends(get_db)
):
    """
    Public endpoint to get all universities (for signup dropdown).
    No authentication required.
    """
    universities = db.query(models.University).order_by(models.University.name.asc()).all()
    return universities


@router.get("", response_model=List[schemas.CourseResponse])
async def get_courses(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all courses for the user's university (student/university_admin/master_admin).
    Returns courses ordered by name, filtered by user's university_id.
    """
    if current_user.university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not assigned to any university. Please contact your administrator."
        )
    
    courses = (
        db.query(models.Course)
        .filter(models.Course.university_id == current_user.university_id)
        .order_by(models.Course.name)
        .all()
    )
    return courses


@router.get("/subjects", response_model=List[schemas.SubjectResponse])
async def get_subjects(
    course_id: int = Query(..., description="Course ID"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all subjects for a specific course.
    Ensures the course belongs to the user's university.
    """
    # First, load the course and ensure it belongs to user's university
    course = (
        db.query(models.Course)
        .filter(
            models.Course.id == course_id,
            models.Course.university_id == current_user.university_id
        )
        .first()
    )
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Course not found or does not belong to your university"
        )
    
    subjects = db.query(models.Subject).filter(models.Subject.course_id == course_id).all()
    return subjects


