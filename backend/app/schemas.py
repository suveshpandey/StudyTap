from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


# Auth schemas
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str


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


class SubjectResponse(BaseModel):
    id: int
    course_id: int
    name: str
    semester: Optional[int] = None

    class Config:
        from_attributes = True


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

