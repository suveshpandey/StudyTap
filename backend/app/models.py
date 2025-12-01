# -----------------------------------------------------------------------------
# File: models.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: SQLAlchemy database models for User, Course, Subject, Chat, ChatMessage, MaterialDocument, and MaterialChunk
# -----------------------------------------------------------------------------

from sqlalchemy import Column, Integer, String, ForeignKey, Text, Enum, TIMESTAMP, SmallInteger, DateTime
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"


class SenderType(str, enum.Enum):
    USER = "USER"
    BOT = "BOT"


class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    code = Column(String(50), nullable=True, unique=True)  # e.g. short code
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # relationships
    users = relationship("User", back_populates="university")
    courses = relationship("Course", back_populates="university", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    university = relationship("University", back_populates="users")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=True)

    subjects = relationship("Subject", back_populates="course", cascade="all, delete-orphan")
    university = relationship("University", back_populates="courses")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    name = Column(String(150), nullable=False)
    semester = Column(SmallInteger, nullable=True)

    course = relationship("Course", back_populates="subjects")
    chats = relationship("Chat", back_populates="subject", cascade="all, delete-orphan")
    materials = relationship(
        "MaterialDocument",
        back_populates="subject",
        cascade="all, delete-orphan",
    )


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    title = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="chats")
    subject = relationship("Subject", back_populates="chats")
    messages = relationship("ChatMessage", back_populates="chat", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    sender = Column(String(10), nullable=False)  # 'USER' or 'BOT'
    message = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    chat = relationship("Chat", back_populates="messages")


class MaterialDocument(Base):
    __tablename__ = "materials_documents"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    s3_key = Column(String(512), nullable=True)
    source_type = Column(
        Enum("manual", "pdf", name="material_source_type"),
        nullable=False,
        default="manual",
    )
    created_at = Column(DateTime, server_default=func.now())

    subject = relationship("Subject", back_populates="materials")
    chunks = relationship(
        "MaterialChunk",
        back_populates="document",
        cascade="all, delete-orphan",
    )


class MaterialChunk(Base):
    __tablename__ = "materials_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("materials_documents.id"), nullable=False)
    page_number = Column(Integer, nullable=True)
    heading = Column(String(255), nullable=True)
    keywords = Column(String(255), nullable=False)  # comma-separated keywords
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    document = relationship("MaterialDocument", back_populates="chunks")

