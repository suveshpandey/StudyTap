# -----------------------------------------------------------------------------
# File: models.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: SQLAlchemy database models for University, Branch, Semester, Subject, Chat, ChatMessage, MaterialDocument, MasterAdmin, UniversityAdmin, and Student
# -----------------------------------------------------------------------------

from sqlalchemy import Column, Integer, String, ForeignKey, Text, Enum, TIMESTAMP, SmallInteger, DateTime, Boolean
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    code = Column(String(50), nullable=True, unique=True)  # e.g. short code
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    is_active = Column(Boolean, nullable=False, server_default="1")
    created_at = Column(DateTime, server_default=func.now())

    # relationships
    branches = relationship("Branch", back_populates="university", cascade="all, delete-orphan")
    university_admins = relationship("UniversityAdmin", back_populates="university")
    students = relationship("Student", back_populates="university")


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=False)

    university = relationship("University", back_populates="branches")
    semesters = relationship("Semester", back_populates="branch", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="branch")


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    semester_number = Column(SmallInteger, nullable=False)  # 1, 2, 3, etc.
    name = Column(String(150), nullable=False)  # e.g., "1st Semester", "2nd Semester"

    branch = relationship("Branch", back_populates="semesters")
    subjects = relationship("Subject", back_populates="semester", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    name = Column(String(150), nullable=False)

    semester = relationship("Semester", back_populates="subjects")
    chats = relationship("Chat", back_populates="subject", cascade="all, delete-orphan")
    materials = relationship(
        "MaterialDocument",
        back_populates="subject",
        cascade="all, delete-orphan",
    )


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)  # Nullable for branch-level chats
    title = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    student = relationship("Student", back_populates="chats")
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
    # MaterialChunk relationship removed - using Kendra instead


class MasterAdmin(Base):
    __tablename__ = "master_admins"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, server_default="1")
    created_at = Column(TIMESTAMP, server_default=func.now())


class UniversityAdmin(Base):
    __tablename__ = "university_admins"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=False)
    is_active = Column(Boolean, nullable=False, server_default="1")
    created_at = Column(TIMESTAMP, server_default=func.now())

    university = relationship("University", back_populates="university_admins")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    batch_year = Column(Integer, nullable=True)  # e.g., 2024, 2025, etc.
    is_active = Column(Boolean, nullable=False, server_default="1")
    created_at = Column(TIMESTAMP, server_default=func.now())

    university = relationship("University", back_populates="students")
    branch = relationship("Branch", back_populates="students")
    chats = relationship("Chat", back_populates="student", cascade="all, delete-orphan")

