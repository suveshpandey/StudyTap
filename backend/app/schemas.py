# -----------------------------------------------------------------------------
# File: schemas.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Pydantic schemas for request/response validation for auth, courses, subjects, chat, and materials
# -----------------------------------------------------------------------------

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


# Auth schemas
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    master_admin_key: Optional[str] = None  # Required secret key for master admin signup


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    university_id: Optional[int] = None

    class Config:
        from_attributes = True


class UniversityCreate(BaseModel):
    name: str
    code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


class UniversityResponse(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Branch schemas
class BranchResponse(BaseModel):
    id: int
    name: str
    university_id: int

    class Config:
        from_attributes = True


class BranchCreate(BaseModel):
    name: str


# Semester schemas
class SemesterResponse(BaseModel):
    id: int
    branch_id: int
    semester_number: int
    name: str

    class Config:
        from_attributes = True


class SemesterCreate(BaseModel):
    branch_id: int
    semester_number: int
    name: str


# Subject schemas
class SubjectResponse(BaseModel):
    id: int
    semester_id: int
    name: str

    class Config:
        from_attributes = True


class SubjectCreate(BaseModel):
    semester_id: int
    name: str


# Chat schemas
class ChatCreate(BaseModel):
    subject_id: Optional[int] = None  # Optional for branch-level chats
    title: Optional[str] = None


class ChatOut(BaseModel):
    id: int
    title: Optional[str] = None
    subject_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Keep ChatResponse for backward compatibility
class ChatResponse(BaseModel):
    id: int
    user_id: int
    subject_id: int
    title: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageOut(BaseModel):
    id: int
    sender: str
    message: str
    created_at: datetime
    sources: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True


# Keep ChatMessageResponse for backward compatibility
class ChatMessageResponse(BaseModel):
    id: int
    chat_id: int
    sender: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    question: str


class ChatMessageReply(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = []
    chat_title: Optional[str] = None  # Updated chat title if it was auto-titled


# Materials schemas
# MaterialChunk schemas removed - using Kendra for document search instead

class MaterialDocumentCreate(BaseModel):
    subject_id: int
    title: str


class MaterialDocumentResponse(BaseModel):
    id: int
    subject_id: int
    title: str
    s3_key: Optional[str] = None
    source_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class MasterAdminResponse(BaseModel):
    id: int
    user_id: int
    is_active: bool

    class Config:
        from_attributes = True


class UniversityAdminResponse(BaseModel):
    id: int
    university_id: int
    is_active: bool
    name: str
    email: str

    class Config:
        from_attributes = True


class StudentResponse(BaseModel):
    id: int
    university_id: int
    branch_id: Optional[int] = None
    batch_year: Optional[int] = None
    is_active: bool
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class StudentProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class StudentPasswordChange(BaseModel):
    current_password: str
    new_password: str


class StudentBulkCreateResponse(BaseModel):
    """Response for bulk student creation via CSV."""
    success: int
    errors: List[str]
    students: List[dict]  # List of created students with their passwords


class UniversityAdminCreate(BaseModel):
    """Schema for creating a university admin (password is auto-generated)."""
    name: str
    email: EmailStr


class UniversityAdminCreateResponse(BaseModel):
    """Response for creating a university admin, includes plain password for sharing."""
    id: int
    university_id: int
    is_active: bool
    plain_password: str
    email: str
    name: str

    class Config:
        from_attributes = True

