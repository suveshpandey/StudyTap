# -----------------------------------------------------------------------------
# File: university_details.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Router for university admin to view their university details and statistics
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.deps import get_current_university_admin
from typing import Optional

router = APIRouter()


class UniversityDetailsResponse(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    is_active: bool
    created_at: datetime
    # Statistics
    total_students: int
    total_branches: int
    total_semesters: int
    total_subjects: int
    active_students: int
    inactive_students: int

    class Config:
        from_attributes = True


@router.get("/university/details", response_model=UniversityDetailsResponse)
def get_university_details(
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about the university admin's university,
    including statistics about students, branches, semesters, and subjects.
    """
    university_id = current_admin.university_id
    
    if university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    # Get university
    university = db.query(models.University).filter(
        models.University.id == university_id
    ).first()
    
    if not university:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found",
        )
    
    # Get statistics
    total_students = db.query(func.count(models.Student.id)).filter(
        models.Student.university_id == university_id
    ).scalar() or 0
    
    active_students = db.query(func.count(models.Student.id)).filter(
        models.Student.university_id == university_id,
        models.Student.is_active == True
    ).scalar() or 0
    
    inactive_students = total_students - active_students
    
    total_branches = db.query(func.count(models.Branch.id)).filter(
        models.Branch.university_id == university_id
    ).scalar() or 0
    
    # Get total semesters across all branches
    total_semesters = db.query(func.count(models.Semester.id)).join(
        models.Branch
    ).filter(
        models.Branch.university_id == university_id
    ).scalar() or 0
    
    # Get total subjects across all semesters
    total_subjects = db.query(func.count(models.Subject.id)).join(
        models.Semester
    ).join(
        models.Branch
    ).filter(
        models.Branch.university_id == university_id
    ).scalar() or 0
    
    return {
        "id": university.id,
        "name": university.name,
        "code": university.code,
        "city": university.city,
        "state": university.state,
        "country": university.country,
        "is_active": university.is_active,
        "created_at": university.created_at,
        "total_students": total_students,
        "total_branches": total_branches,
        "total_semesters": total_semesters,
        "total_subjects": total_subjects,
        "active_students": active_students,
        "inactive_students": inactive_students,
    }

