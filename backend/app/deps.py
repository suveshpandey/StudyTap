# -----------------------------------------------------------------------------
# File: deps.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: FastAPI dependencies for authentication using role tables directly
# -----------------------------------------------------------------------------

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Union
from app.database import get_db
from app import models
from app.auth import decode_access_token

security = HTTPBearer()


# Union type for role table models
RoleModel = Union[models.MasterAdmin, models.UniversityAdmin, models.Student]


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> RoleModel:
    """
    Get the current authenticated user from role tables based on JWT token.
    Token should contain: sub (role table ID) and role (role name).
    Returns the appropriate role model instance.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        
        if payload is None:
            raise credentials_exception
        
        role_id_str = payload.get("sub")
        role_name = payload.get("role")
        
        if role_id_str is None or role_name is None:
            raise credentials_exception
        
        # Convert string back to int
        try:
            role_id = int(role_id_str)
        except (ValueError, TypeError):
            raise credentials_exception
        
        # Load from appropriate role table
        if role_name == "master_admin":
            from sqlalchemy.orm import joinedload
            admin = db.query(models.MasterAdmin).filter(models.MasterAdmin.id == role_id).first()
            if admin is None or not admin.is_active:
                raise credentials_exception
            return admin
        elif role_name == "university_admin":
            from sqlalchemy.orm import joinedload
            admin = db.query(models.UniversityAdmin).options(
                joinedload(models.UniversityAdmin.university)
            ).filter(models.UniversityAdmin.id == role_id).first()
            if admin is None or not admin.is_active:
                raise credentials_exception
            if not admin.university or not admin.university.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your university has been deactivated. Please contact your master administrator.",
                )
            return admin
        elif role_name == "student":
            from sqlalchemy.orm import joinedload
            student = db.query(models.Student).options(
                joinedload(models.Student.university)
            ).filter(models.Student.id == role_id).first()
            if student is None or not student.is_active:
                raise credentials_exception
            if not student.university or not student.university.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your university has been deactivated. Please contact your university administrator.",
                )
            return student
        else:
            raise credentials_exception
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Authentication error: {type(e).__name__}: {e}")
        raise credentials_exception


def get_current_master_admin(
    current_user: RoleModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> models.MasterAdmin:
    """Dependency to ensure the current user is a master admin and is active."""
    if not isinstance(current_user, models.MasterAdmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Master admin access required",
        )
    
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive account",
        )
    
    return current_user


def get_current_university_admin(
    current_user: RoleModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> models.UniversityAdmin:
    """Dependency to ensure the current user is a university admin, is active, and their university is active."""
    if not isinstance(current_user, models.UniversityAdmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="University admin access required",
        )
    
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive account",
        )
    
    if not current_user.university or not current_user.university.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your university has been deactivated. Please contact your master administrator.",
        )
    
    return current_user


def get_current_student(
    current_user: RoleModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> models.Student:
    """Dependency to ensure the current user is a student, is active, and their university is active."""
    if not isinstance(current_user, models.Student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )
    
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive account",
        )
    
    if not current_user.university or not current_user.university.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your university has been deactivated. Please contact your university administrator.",
        )
    
    return current_user
