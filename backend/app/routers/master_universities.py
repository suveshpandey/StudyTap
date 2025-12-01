# -----------------------------------------------------------------------------
# File: master_universities.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Master admin router for managing universities and assigning university admins
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.deps import get_current_master_admin

router = APIRouter()


# List all universities (master admin only)
@router.get("/universities", response_model=List[schemas.UniversityResponse])
def list_universities(
    current_user: models.User = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    universities = db.query(models.University).order_by(models.University.name.asc()).all()
    return universities


# Create a university
@router.post("/universities", response_model=schemas.UniversityResponse)
def create_university(
    uni_data: schemas.UniversityCreate,
    current_user: models.User = Depends(get_current_master_admin),
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
    )
    db.add(uni)
    db.commit()
    db.refresh(uni)
    return uni


# Delete a university
@router.delete("/universities/{university_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_university(
    university_id: int,
    current_user: models.User = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    uni = db.query(models.University).filter(models.University.id == university_id).first()
    if not uni:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found",
        )

    # If there are users linked, you can either prevent deletion or allow cascade.
    # For now, prevent deletion if any users belong to this university.
    has_users = db.query(models.User).filter(models.User.university_id == university_id).first()
    if has_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete university that still has users assigned",
        )

    db.delete(uni)
    db.commit()
    return


# Assign an existing user as university admin
@router.post("/universities/{university_id}/assign-admin", response_model=schemas.UserResponse)
def assign_university_admin(
    university_id: int,
    user_id: int = Query(..., description="ID of the user to assign as university admin"),
    current_user: models.User = Depends(get_current_master_admin),
    db: Session = Depends(get_db),
):
    uni = db.query(models.University).filter(models.University.id == university_id).first()
    if not uni:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found",
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Promote this user to university_admin for that university
    user.role = "university_admin"
    user.university_id = university_id

    db.commit()
    db.refresh(user)

    return schemas.UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        university_id=user.university_id
    )

