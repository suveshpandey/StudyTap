# -----------------------------------------------------------------------------
# File: courses.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Public course/subject endpoints for students to browse branches, semesters, and subjects
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Union
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter()

# Type alias for role models
RoleModel = Union[models.MasterAdmin, models.UniversityAdmin, models.Student]


@router.get("/universities", response_model=List[schemas.UniversityResponse])
async def get_universities(db: Session = Depends(get_db)):
    """
    Public endpoint to get all universities (for signup page).
    No authentication required.
    """
    universities = db.query(models.University).order_by(models.University.name).all()
    return universities


@router.get("/branches", response_model=List[schemas.BranchResponse])
async def get_branches(
    current_user: RoleModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get branches for the current user.
    - For students: Only returns their assigned branch
    - For other roles: Returns all branches in their university
    """
    # Get university_id based on role
    university_id = None
    if isinstance(current_user, models.Student):
        university_id = current_user.university_id
        # For students, only return their branch
        if current_user.branch_id:
            branch = db.query(models.Branch).filter(
                models.Branch.id == current_user.branch_id
            ).first()
            if branch:
                return [branch]
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Your assigned branch was not found. Please contact your administrator."
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are not assigned to any branch. Please contact your administrator."
            )
    elif isinstance(current_user, models.UniversityAdmin):
        university_id = current_user.university_id
    elif isinstance(current_user, models.MasterAdmin):
        # Master admin doesn't have a university_id, so they can't access branches
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Master admin cannot access branches. Please use the admin panel."
        )
    
    if university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not associated with any university. Please contact your administrator."
        )
    
    # For non-students, return all branches in their university
    branches = (
        db.query(models.Branch)
        .filter(models.Branch.university_id == university_id)
        .order_by(models.Branch.name)
        .all()
    )
    return branches


@router.get("/semesters", response_model=List[schemas.SemesterResponse])
async def get_semesters(
    branch_id: int = Query(..., description="Branch ID"),
    current_user: RoleModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all semesters for a specific branch.
    For students: Ensures the branch_id matches their assigned branch.
    For other roles: Ensures the branch belongs to the user's university.
    """
    # Get university_id based on role
    university_id = None
    if isinstance(current_user, models.Student):
        university_id = current_user.university_id
        # Verify student is accessing their own branch
        if not current_user.branch_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are not assigned to any branch. Please contact your administrator."
            )
        if current_user.branch_id != branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access semesters for your assigned branch."
            )
    elif isinstance(current_user, models.UniversityAdmin):
        university_id = current_user.university_id
    elif isinstance(current_user, models.MasterAdmin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Master admin cannot access semesters. Please use the admin panel."
        )
    
    if university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not associated with any university. Please contact your administrator."
        )
    
    # First, load the branch and ensure it belongs to user's university
    branch = (
        db.query(models.Branch)
        .filter(
            models.Branch.id == branch_id,
            models.Branch.university_id == university_id
        )
        .first()
    )
    
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Branch not found or does not belong to your university"
        )
    
    semesters = (
        db.query(models.Semester)
        .filter(models.Semester.branch_id == branch_id)
        .order_by(models.Semester.semester_number)
        .all()
    )
    return semesters


@router.get("/subjects", response_model=List[schemas.SubjectResponse])
async def get_subjects(
    semester_id: int = Query(..., description="Semester ID"),
    current_user: RoleModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all subjects for a specific semester.
    Ensures the semester belongs to a branch in the user's university.
    For students: Also ensures the branch matches their assigned branch.
    """
    # Get university_id based on role
    university_id = None
    if isinstance(current_user, models.Student):
        university_id = current_user.university_id
    elif isinstance(current_user, models.UniversityAdmin):
        university_id = current_user.university_id
    elif isinstance(current_user, models.MasterAdmin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Master admin cannot access subjects. Please use the admin panel."
        )
    
    if university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not associated with any university. Please contact your administrator."
        )
    
    # First, load the semester and ensure it belongs to user's university
    semester = (
        db.query(models.Semester)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(
            models.Semester.id == semester_id,
            models.Branch.university_id == university_id
        )
        .first()
    )
    
    if not semester:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Semester not found or does not belong to your university"
        )
    
    # For students, also verify the branch matches their assigned branch
    if isinstance(current_user, models.Student):
        if current_user.branch_id and semester.branch_id != current_user.branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access subjects for your assigned branch."
            )
    
    subjects = (
        db.query(models.Subject)
        .filter(models.Subject.semester_id == semester_id)
        .order_by(models.Subject.name)
        .all()
    )
    return subjects
