# -----------------------------------------------------------------------------
# File: admin_academics.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Admin router for managing branches, semesters, and subjects (CRUD operations)
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.deps import get_current_university_admin

router = APIRouter()


# ============================================================================
# BRANCH MANAGEMENT
# ============================================================================

@router.get("/branches", response_model=List[schemas.BranchResponse])
async def get_all_branches(
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Get all branches for the university admin's university.
    Returns branches ordered by name, filtered by university_id.
    """
    if current_admin.university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    branches = (
        db.query(models.Branch)
        .filter(models.Branch.university_id == current_admin.university_id)
        .order_by(models.Branch.name)
        .all()
    )
    return branches


@router.post("/branches", response_model=schemas.BranchResponse)
async def create_branch(
    branch_data: schemas.BranchCreate,
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new branch for the university admin's university.
    """
    if current_admin.university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    # Check if branch with same name already exists in this university
    existing_branch = db.query(models.Branch).filter(
        models.Branch.name == branch_data.name,
        models.Branch.university_id == current_admin.university_id
    ).first()
    
    if existing_branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Branch with this name already exists in your university"
        )
    
    # Create new branch with university_id from current admin
    new_branch = models.Branch(
        name=branch_data.name,
        university_id=current_admin.university_id,
    )
    db.add(new_branch)
    db.commit()
    db.refresh(new_branch)
    
    return new_branch


@router.delete("/branches/{branch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_branch(
    branch_id: int,
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a branch (university admin only).
    Only allows deletion if branch belongs to admin's university.
    If there are semesters under this branch, prevent deletion with 400 error.
    """
    branch = (
        db.query(models.Branch)
        .filter(
            models.Branch.id == branch_id,
            models.Branch.university_id == current_admin.university_id
        )
        .first()
    )
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found for your university"
        )
    
    # Check if there are semesters under this branch
    semesters_count = db.query(models.Semester).filter(
        models.Semester.branch_id == branch_id
    ).count()
    
    if semesters_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete branch. There are {semesters_count} semester(s) associated with this branch. Please delete all semesters first."
        )
    
    db.delete(branch)
    db.commit()
    
    return None


# ============================================================================
# SEMESTER MANAGEMENT
# ============================================================================

@router.get("/semesters", response_model=List[schemas.SemesterResponse])
async def get_all_semesters(
    branch_id: Optional[int] = Query(None, description="Optional branch ID to filter by"),
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Get all semesters for branches in the university admin's university.
    If branch_id is provided, ensure it belongs to admin's university and filter by branch_id.
    """
    if current_admin.university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    # Base query: join Semester with Branch and filter by university_id
    query = (
        db.query(models.Semester)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(models.Branch.university_id == current_admin.university_id)
    )
    
    if branch_id is not None:
        # Ensure the branch_id belongs to admin's university
        branch = (
            db.query(models.Branch)
            .filter(
                models.Branch.id == branch_id,
                models.Branch.university_id == current_admin.university_id
            )
            .first()
        )
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branch not found for your university"
            )
        query = query.filter(models.Semester.branch_id == branch_id)
    
    semesters = query.order_by(models.Semester.branch_id, models.Semester.semester_number).all()
    return semesters


@router.post("/semesters", response_model=schemas.SemesterResponse)
async def create_semester(
    semester_data: schemas.SemesterCreate,
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new semester (university admin only).
    Requires branch_id, semester_number, and name.
    Validates that branch belongs to admin's university.
    """
    if current_admin.university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    # Validate that the branch exists AND belongs to current_admin.university_id
    branch = (
        db.query(models.Branch)
        .filter(
            models.Branch.id == semester_data.branch_id,
            models.Branch.university_id == current_admin.university_id,
        )
        .first()
    )
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found for your university.",
        )
    
    # Check if semester with same number already exists in this branch
    existing_semester = db.query(models.Semester).filter(
        models.Semester.branch_id == semester_data.branch_id,
        models.Semester.semester_number == semester_data.semester_number
    ).first()
    
    if existing_semester:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Semester {semester_data.semester_number} already exists in this branch"
        )
    
    # Create new semester
    new_semester = models.Semester(
        branch_id=semester_data.branch_id,
        semester_number=semester_data.semester_number,
        name=semester_data.name
    )
    db.add(new_semester)
    db.commit()
    db.refresh(new_semester)
    
    return new_semester


@router.delete("/semesters/{semester_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_semester(
    semester_id: int,
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a semester (university admin only).
    Only allows deletion if semester belongs to a branch in admin's university.
    If there are subjects under this semester, prevent deletion with 400 error.
    """
    semester = (
        db.query(models.Semester)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(
            models.Semester.id == semester_id,
            models.Branch.university_id == current_admin.university_id
        )
        .first()
    )
    if not semester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semester not found for your university"
        )
    
    # Check if there are subjects under this semester
    subjects_count = db.query(models.Subject).filter(
        models.Subject.semester_id == semester_id
    ).count()
    
    if subjects_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete semester. There are {subjects_count} subject(s) associated with this semester. Please delete all subjects first."
        )
    
    db.delete(semester)
    db.commit()
    
    return None


# ============================================================================
# SUBJECT MANAGEMENT
# ============================================================================

@router.get("/subjects", response_model=List[schemas.SubjectResponse])
async def get_all_subjects(
    semester_id: Optional[int] = Query(None, description="Optional semester ID to filter by"),
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Get all subjects for semesters in the university admin's university.
    If semester_id is provided, ensure it belongs to admin's university and filter by semester_id.
    """
    if current_admin.university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    # Base query: join Subject with Semester and Branch, filter by university_id
    query = (
        db.query(models.Subject)
        .join(models.Semester, models.Subject.semester_id == models.Semester.id)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(models.Branch.university_id == current_admin.university_id)
    )
    
    if semester_id is not None:
        # Ensure the semester_id belongs to admin's university
        semester = (
            db.query(models.Semester)
            .join(models.Branch, models.Semester.branch_id == models.Branch.id)
            .filter(
                models.Semester.id == semester_id,
                models.Branch.university_id == current_admin.university_id
            )
            .first()
        )
        if not semester:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Semester not found for your university"
            )
        query = query.filter(models.Subject.semester_id == semester_id)
    
    subjects = query.order_by(models.Subject.semester_id, models.Subject.name).all()
    return subjects


@router.post("/subjects", response_model=schemas.SubjectResponse)
async def create_subject(
    subject_data: schemas.SubjectCreate,
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new subject (university admin only).
    Requires semester_id and name.
    Validates that semester belongs to admin's university.
    """
    if current_admin.university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    # Validate that the semester exists AND belongs to current_admin.university_id
    semester = (
        db.query(models.Semester)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(
            models.Semester.id == subject_data.semester_id,
            models.Branch.university_id == current_admin.university_id,
        )
        .first()
    )
    if not semester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semester not found for your university.",
        )
    
    # Check if subject with same name already exists in this semester
    existing_subject = db.query(models.Subject).filter(
        models.Subject.semester_id == subject_data.semester_id,
        models.Subject.name == subject_data.name
    ).first()
    
    if existing_subject:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject with this name already exists in this semester"
        )
    
    # Create new subject
    new_subject = models.Subject(
        semester_id=subject_data.semester_id,
        name=subject_data.name
    )
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
    return new_subject


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: int,
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a subject (university admin only).
    Only allows deletion if subject belongs to a semester in admin's university.
    This will cascade delete related chats and materials.
    """
    subject = (
        db.query(models.Subject)
        .join(models.Semester, models.Subject.semester_id == models.Semester.id)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(
            models.Subject.id == subject_id,
            models.Branch.university_id == current_admin.university_id
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
