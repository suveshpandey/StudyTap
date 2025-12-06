# -----------------------------------------------------------------------------
# File: student_profile.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Student profile management router
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.deps import get_current_student
from app.auth import verify_password, get_password_hash

router = APIRouter()


@router.get("/profile", response_model=schemas.StudentResponse)
def get_student_profile(
    current_user: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Get the current student's profile information."""
    return current_user


@router.put("/profile", response_model=schemas.StudentResponse)
def update_student_profile(
    profile_data: schemas.StudentProfileUpdate,
    current_user: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Update the current student's profile (name and/or email)."""
    student = current_user
    
    # Update name if provided
    if profile_data.name is not None:
        student.name = profile_data.name
    
    # Update email if provided
    if profile_data.email is not None:
        # Check if email is already taken by another student, admin, or master admin
        existing_student = db.query(models.Student).filter(
            models.Student.email == profile_data.email,
            models.Student.id != student.id
        ).first()
        existing_admin = db.query(models.UniversityAdmin).filter(
            models.UniversityAdmin.email == profile_data.email
        ).first()
        existing_master = db.query(models.MasterAdmin).filter(
            models.MasterAdmin.email == profile_data.email
        ).first()
        
        if existing_student or existing_admin or existing_master:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )
        
        student.email = profile_data.email
    
    db.commit()
    db.refresh(student)
    
    return student


@router.post("/change-password")
def change_student_password(
    password_data: schemas.StudentPasswordChange,
    current_user: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Change the current student's password."""
    student = current_user
    
    # Verify current password (hashed only)
    if not verify_password(password_data.current_password, student.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password",
        )
    
    # Hash the new password before storing
    new_password_hash = get_password_hash(password_data.new_password)
    student.password_hash = new_password_hash
    
    db.commit()
    
    return {"message": "Password changed successfully"}
