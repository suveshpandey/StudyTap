from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, courses, chat, materials, admin_academics
from app.database import engine
from app import models


def create_tables():
    """Create database tables if they don't exist."""
    models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="University AI Assistant API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(courses.router, prefix="/courses", tags=["courses"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(materials.router, prefix="/materials", tags=["materials"])
app.include_router(admin_academics.router, prefix="/admin", tags=["admin-academics"])


@app.get("/")
async def root():
    return {"message": "University AI Assistant API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Create database tables on startup."""
    try:
        create_tables()
    except Exception as e:
        print(f"Warning: Could not create database tables: {e}")
        print("Make sure MySQL is running and DATABASE_URL is correctly configured in .env")

