# -----------------------------------------------------------------------------
# File: master_universities.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Master admin router for managing universities, university admins, and students
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import random
import string
from app.database import get_db
from app import models, schemas
from app.deps import get_current_master_admin
from app.auth import get_password_hash

router = APIRouter()


# ============================================================================
# UNIVERSITY MANAGEMENT
# ============================================================================

# List all universities (master admin only)
@router.get("/universities", response_model=List[schemas.UniversityResponse])
def list_universities(
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    universities = db.query(models.University).order_by(models.University.name.asc()).all()
    return universities


# Create a university
@router.post("/universities", response_model=schemas.UniversityResponse)
def create_university(
    uni_data: schemas.UniversityCreate,
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    # simple unique-name check
    existing = db.query(models.University).filter(models.University.name == uni_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University with this name already exists",
        )

    uni = models.University(
        name=uni_data.name,
        code=uni_data.code,
        city=uni_data.city,
        state=uni_data.state,
        country=uni_data.country,
        is_active=True,  # Explicitly set, though DB default is already True
    )
    db.add(uni)
    db.commit()
    db.refresh(uni)
    return uni


# Activate a university
@router.post("/universities/{university_id}/activate", response_model=schemas.UniversityResponse)
def activate_university(
    university_id: int,
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    uni = db.query(models.University).filter(models.University.id == university_id).first()
    if not uni:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found",
        )
    
    uni.is_active = True
    db.commit()
    db.refresh(uni)
    return uni


# Deactivate a university
@router.post("/universities/{university_id}/deactivate", response_model=schemas.UniversityResponse)
def deactivate_university(
    university_id: int,
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    uni = db.query(models.University).filter(models.University.id == university_id).first()
    if not uni:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found",
        )
    
    uni.is_active = False
    db.commit()
    db.refresh(uni)
    return uni


# Delete a university
@router.delete("/universities/{university_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_university(
    university_id: int,
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    uni = db.query(models.University).filter(models.University.id == university_id).first()
    if not uni:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found",
        )

    # Delete all students of this university first
    students = db.query(models.Student).filter(models.Student.university_id == university_id).all()
    for student in students:
        db.delete(student)
    
    # Delete all university admins of this university
    admins = db.query(models.UniversityAdmin).filter(models.UniversityAdmin.university_id == university_id).all()
    for admin in admins:
        db.delete(admin)
    
    # Now delete the university
    db.delete(uni)
    db.commit()
    return


# ============================================================================
# UNIVERSITY ADMIN MANAGEMENT
# ============================================================================

# Create a new university admin
@router.post("/universities/{university_id}/create-admin", response_model=schemas.UniversityAdminCreateResponse)
def create_university_admin(
    university_id: int,
    admin_data: schemas.UserSignup,
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    # Verify university exists
    uni = db.query(models.University).filter(models.University.id == university_id).first()
    if not uni:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found",
        )
    
    # Check if university already has an admin
    existing_university_admin = db.query(models.UniversityAdmin).filter(
        models.UniversityAdmin.university_id == university_id
    ).first()
    
    if existing_university_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This university already has an admin. Only one admin is allowed per university.",
        )
    
    # Check if email already exists in any role table
    existing_student = db.query(models.Student).filter(models.Student.email == admin_data.email).first()
    existing_admin = db.query(models.UniversityAdmin).filter(models.UniversityAdmin.email == admin_data.email).first()
    existing_master = db.query(models.MasterAdmin).filter(models.MasterAdmin.email == admin_data.email).first()
    
    if existing_student or existing_admin or existing_master:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Step 1: Generate random 8-character NUMERIC password
    password = ''.join(random.choices(string.digits, k=8))
    
    # Step 2: Make a copy of the plain password for returning to frontend
    plain_password_copy = password
    
    # Step 3: Hash the original password and save in DB
    hashed_password = get_password_hash(password)
    
    # Verify the password was hashed (bcrypt hashes are 60 characters)
    if len(hashed_password) < 50:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password hashing failed",
        )
    
    # Create UniversityAdmin with HASHED password ONLY
    admin_profile = models.UniversityAdmin(
        name=admin_data.name,
        email=admin_data.email,
        password_hash=hashed_password,  # HASHED password saved in DB
        university_id=university_id,
        is_active=True,
    )
    db.add(admin_profile)
    db.commit()
    db.refresh(admin_profile)
    
    # Step 4: Return the copied plain password to frontend for sharing
    return schemas.UniversityAdminCreateResponse(
        id=admin_profile.id,
        university_id=admin_profile.university_id,
        is_active=admin_profile.is_active,
        plain_password=plain_password_copy,  # Return plain 8-digit password
        email=admin_profile.email,
        name=admin_profile.name,
    )


# List all university admins (optional filter by university_id)
@router.get("/university-admins", response_model=List[schemas.UniversityAdminResponse])
def list_university_admins(
    university_id: Optional[int] = Query(None, description="Filter by university ID"),
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.UniversityAdmin)
    if university_id is not None:
        query = query.filter(models.UniversityAdmin.university_id == university_id)
    admins = query.all()
    return admins


# Activate a university admin
@router.post("/university-admins/{admin_id}/activate", response_model=schemas.UniversityAdminResponse)
def activate_university_admin(
    admin_id: int,
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    admin = db.query(models.UniversityAdmin).filter(models.UniversityAdmin.id == admin_id).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University admin not found",
        )
    
    admin.is_active = True
    db.commit()
    db.refresh(admin)
    return admin


# Deactivate a university admin
@router.post("/university-admins/{admin_id}/deactivate", response_model=schemas.UniversityAdminResponse)
def deactivate_university_admin(
    admin_id: int,
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    admin = db.query(models.UniversityAdmin).filter(models.UniversityAdmin.id == admin_id).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University admin not found",
        )
    
    admin.is_active = False
    db.commit()
    db.refresh(admin)
    return admin


# Delete a university admin
@router.delete("/university-admins/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_university_admin(
    admin_id: int,
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    admin = db.query(models.UniversityAdmin).filter(models.UniversityAdmin.id == admin_id).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University admin not found",
        )
    
    # Delete the university admin directly
    db.delete(admin)
    db.commit()
    return


# ============================================================================
# STUDENT MANAGEMENT
# ============================================================================

# List all students (optional filter by university_id)
@router.get("/students", response_model=List[schemas.StudentResponse])
def list_students(
    university_id: Optional[int] = Query(None, description="Filter by university ID"),
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.Student)
    if university_id is not None:
        query = query.filter(models.Student.university_id == university_id)
    students = query.all()
    return students


# Activate a student
@router.post("/students/{student_id}/activate", response_model=schemas.StudentResponse)
def activate_student(
    student_id: int,
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    
    student.is_active = True
    db.commit()
    db.refresh(student)
    return student


# Deactivate a student
@router.post("/students/{student_id}/deactivate", response_model=schemas.StudentResponse)
def deactivate_student(
    student_id: int,
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    
    student.is_active = False
    db.commit()
    db.refresh(student)
    return student


# Delete a student
@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    
    # Delete the student (cascade will handle related chats)
    db.delete(student)
    db.commit()
    return


# ============================================================================
# UNIVERSITY ANALYTICS
# ============================================================================

class UniversityAnalyticsResponse(BaseModel):
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
    total_university_admins: int
    active_university_admins: int
    inactive_university_admins: int

    class Config:
        from_attributes = True


@router.get("/universities/{university_id}/analytics", response_model=UniversityAnalyticsResponse)
def get_university_analytics(
    university_id: int,
    current_user: models.MasterAdmin = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    """
    Get detailed analytics and statistics for a specific university.
    Master admin only.
    """
    # Get university
    university = db.query(models.University).filter(models.University.id == university_id).first()
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
    
    # Get university admin statistics
    total_university_admins = db.query(func.count(models.UniversityAdmin.id)).filter(
        models.UniversityAdmin.university_id == university_id
    ).scalar() or 0
    
    active_university_admins = db.query(func.count(models.UniversityAdmin.id)).filter(
        models.UniversityAdmin.university_id == university_id,
        models.UniversityAdmin.is_active == True
    ).scalar() or 0
    
    inactive_university_admins = total_university_admins - active_university_admins
    
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
        "total_university_admins": total_university_admins,
        "active_university_admins": active_university_admins,
        "inactive_university_admins": inactive_university_admins,
    }
