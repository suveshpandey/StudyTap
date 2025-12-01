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
    role: Optional[str] = "student"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Course schemas
class CourseResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class CourseCreate(BaseModel):
    name: str


class SubjectResponse(BaseModel):
    id: int
    course_id: int
    name: str
    semester: Optional[int] = None

    class Config:
        from_attributes = True


class SubjectCreate(BaseModel):
    course_id: int
    name: str
    semester: Optional[int] = None


# Chat schemas
class ChatCreate(BaseModel):
    subject_id: int
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
class MaterialChunkCreate(BaseModel):
    document_id: int
    page_number: Optional[int] = None
    heading: Optional[str] = None
    keywords: str
    text: str


class MaterialChunkResponse(BaseModel):
    id: int
    document_id: int
    page_number: Optional[int] = None
    heading: Optional[str] = None
    keywords: str
    text: str
    created_at: datetime

    class Config:
        from_attributes = True


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

