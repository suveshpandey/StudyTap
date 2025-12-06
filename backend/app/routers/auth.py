# -----------------------------------------------------------------------------
# File: auth.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Authentication router for user signup and login endpoints
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from app.database import get_db
from app import models, schemas
from app.auth import verify_password, get_password_hash, create_access_token
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()


@router.post("/signup", response_model=schemas.TokenResponse)
def signup(user_data: schemas.UserSignup, db: Session = Depends(get_db)):
    """
    Master admin signup endpoint.
    Only allows signup if no master admin exists in the database.
    Requires master_admin_key from environment variables.
    """
    # Check if master admin already exists
    existing_master = db.query(models.MasterAdmin).first()
    if existing_master:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Master admin already exists. Signup is no longer available.",
        )
    
    # Validate master admin key
    master_key = os.getenv("MASTER_ADMIN_SECRET_KEY")
    if not master_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Master admin key not configured",
        )
    
    if not user_data.master_admin_key or user_data.master_admin_key != master_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid master admin key",
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create MasterAdmin with name, email, hashed password, and default fields
    master_admin = models.MasterAdmin(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        is_active=True,
    )
    db.add(master_admin)
    db.commit()
    db.refresh(master_admin)
    
    access_token = create_access_token(data={"sub": str(master_admin.id), "role": "master_admin"})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": schemas.UserResponse(
            id=master_admin.id,
            name=master_admin.name,
            email=master_admin.email,
            role="master_admin",
            university_id=None
        )
    }


@router.post("/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Login endpoint for all user types: Master Admin, University Admin, and Student.
    Checks role tables in order and verifies hashed passwords.
    """
    # Check role tables in order: master_admin, university_admin, student
    master_admin = db.query(models.MasterAdmin).filter(
        models.MasterAdmin.email == credentials.email
    ).first()
    
    if master_admin:
        # Verify hashed password
        if not verify_password(credentials.password, master_admin.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not master_admin.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )
        
        access_token = create_access_token(data={"sub": str(master_admin.id), "role": "master_admin"})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": schemas.UserResponse(
                id=master_admin.id,
                name=master_admin.name,
                email=master_admin.email,
                role="master_admin",
                university_id=None
            )
        }
    
    # Load university_admin with university relationship
    university_admin = db.query(models.UniversityAdmin).options(
        joinedload(models.UniversityAdmin.university)
    ).filter(
        models.UniversityAdmin.email == credentials.email
    ).first()
    
    if university_admin:
        # Verify hashed password
        if not verify_password(credentials.password, university_admin.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not university_admin.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )
        if not university_admin.university or not university_admin.university.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your university has been deactivated. Please contact your master administrator.",
            )
        
        access_token = create_access_token(data={"sub": str(university_admin.id), "role": "university_admin"})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": schemas.UserResponse(
                id=university_admin.id,
                name=university_admin.name,
                email=university_admin.email,
                role="university_admin",
                university_id=university_admin.university_id
            )
        }
    
    # Load student with university relationship
    student = db.query(models.Student).options(
        joinedload(models.Student.university)
    ).filter(
        models.Student.email == credentials.email
    ).first()
    
    if student:
        # Check if password_hash is valid (not None, not empty, and looks like a bcrypt hash)
        if not student.password_hash or len(student.password_hash) < 50 or not student.password_hash.startswith('$2'):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account password needs to be reset. Please contact your university administrator.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify hashed password
        try:
            if not verify_password(credentials.password, student.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except HTTPException:
            # Re-raise HTTPExceptions (like incorrect password)
            raise
        except Exception as e:
            # If password verification fails due to invalid hash format (e.g., UnknownHashError)
            # This happens when password_hash is not a valid bcrypt hash
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account password needs to be reset. Please contact your university administrator.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not student.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )
        if not student.university or not student.university.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your university has been deactivated. Please contact your university administrator.",
            )
        
        access_token = create_access_token(data={"sub": str(student.id), "role": "student"})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": schemas.UserResponse(
                id=student.id,
                name=student.name,
                email=student.email,
                role="student",
                university_id=student.university_id
            )
        }
    
    # If no user found in any role table
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )
