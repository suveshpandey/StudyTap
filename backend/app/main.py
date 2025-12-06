# -----------------------------------------------------------------------------
# File: main.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Main FastAPI application entry point with CORS configuration and router registration
# -----------------------------------------------------------------------------

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import auth, courses, chat, materials, admin_academics, admin_students, master_universities, student_profile, university_admin_profile, university_details, master_admin_profile
from app.database import engine, Base
from app import models


def create_tables():
    """Create all database tables on startup."""
    # All models are already imported via 'from app import models'
    # This ensures all model classes are registered with Base.metadata
    Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown."""
    # Startup
    try:
        create_tables()
    except Exception as e:
        print(f"Warning: Could not create database tables: {e}")
        print("Make sure MySQL is running and DATABASE_URL is correctly configured in .env")
    yield
    # Shutdown (if needed in the future)


app = FastAPI(title="StudyTap API", version="1.0.0", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(courses.router, prefix="/courses", tags=["courses"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(materials.router, prefix="/materials", tags=["materials"])
app.include_router(admin_academics.router, prefix="/admin", tags=["admin-academics"])
app.include_router(admin_students.router, prefix="/admin", tags=["admin-students"])
app.include_router(university_details.router, prefix="/admin", tags=["university-details"])
app.include_router(
    master_universities.router,
    prefix="/master",
    tags=["master-universities"],
)
app.include_router(student_profile.router, prefix="/student", tags=["student-profile"])
app.include_router(university_admin_profile.router, prefix="/university-admin", tags=["university-admin-profile"])
app.include_router(master_admin_profile.router, prefix="/master-admin", tags=["master-admin-profile"])


@app.get("/")
async def root():
    return {"message": "StudyTap API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

