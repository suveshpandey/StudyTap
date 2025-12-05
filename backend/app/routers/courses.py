from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[schemas.CourseResponse])
async def get_courses(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    courses = db.query(models.Course).all()
    return courses


@router.get("/subjects", response_model=List[schemas.SubjectResponse])
async def get_subjects(
    course_id: int = Query(..., description="Course ID"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subjects = db.query(models.Subject).filter(models.Subject.course_id == course_id).all()
    return subjects


