# -----------------------------------------------------------------------------
# File: university_admin_profile.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: University admin profile management router
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.deps import get_current_university_admin
from app.auth import verify_password, get_password_hash
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter()


class UniversityAdminProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UniversityAdminPasswordChange(BaseModel):
    current_password: str
    new_password: str


class UniversityAdminProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    university_id: int
    is_active: bool

    class Config:
        from_attributes = True


@router.get("/profile", response_model=UniversityAdminProfileResponse)
def get_university_admin_profile(
    current_user: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """Get the current university admin's profile information."""
    return current_user


@router.put("/profile", response_model=UniversityAdminProfileResponse)
def update_university_admin_profile(
    profile_data: UniversityAdminProfileUpdate,
    current_user: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """Update the current university admin's profile (name and/or email)."""
    admin = current_user
    
    # Update name if provided
    if profile_data.name is not None:
        admin.name = profile_data.name
    
    # Update email if provided
    if profile_data.email is not None:
        # Check if email is already taken by another admin, student, or master admin
        existing_student = db.query(models.Student).filter(
            models.Student.email == profile_data.email
        ).first()
        existing_admin = db.query(models.UniversityAdmin).filter(
            models.UniversityAdmin.email == profile_data.email,
            models.UniversityAdmin.id != admin.id
        ).first()
        existing_master = db.query(models.MasterAdmin).filter(
            models.MasterAdmin.email == profile_data.email
        ).first()
        
        if existing_student or existing_admin or existing_master:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )
        
        admin.email = profile_data.email
    
    db.commit()
    db.refresh(admin)
    
    return admin


@router.post("/change-password")
def change_university_admin_password(
    password_data: UniversityAdminPasswordChange,
    current_user: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """Change the current university admin's password."""
    admin = current_user
    
    # Verify current password (hashed only)
    if not verify_password(password_data.current_password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password",
        )
    
    # Hash the new password before storing
    new_password_hash = get_password_hash(password_data.new_password)
    admin.password_hash = new_password_hash
    
    db.commit()
    
    return {"message": "Password changed successfully"}



