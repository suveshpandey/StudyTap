# -----------------------------------------------------------------------------
# File: seed.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Database seeding script to populate initial courses and subjects
# -----------------------------------------------------------------------------

"""
Database seeding script to populate initial courses and subjects.
Run this after the database is created.
"""
from app.database import SessionLocal, engine
from app import models

# Create tables
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Check if courses already exist
    existing_courses = db.query(models.Course).count()
    if existing_courses > 0:
        print("Courses already exist. Skipping seed.")
        exit(0)
    
    # Create courses
    course1 = models.Course(name="B.Tech Computer Science")
    course2 = models.Course(name="B.Tech Electrical & Electronics")
    
    db.add(course1)
    db.add(course2)
    db.commit()
    db.refresh(course1)
    db.refresh(course2)
    
    # Create subjects for Computer Science
    cs_subjects = [
        models.Subject(course_id=course1.id, name="Database Management Systems", semester=4),
        models.Subject(course_id=course1.id, name="Operating Systems", semester=5),
        models.Subject(course_id=course1.id, name="Data Structures", semester=2),
        models.Subject(course_id=course1.id, name="Algorithms", semester=3),
    ]
    
    # Create subjects for Electrical & Electronics
    ee_subjects = [
        models.Subject(course_id=course2.id, name="Circuit Theory", semester=2),
        models.Subject(course_id=course2.id, name="Electrical Machines", semester=4),
        models.Subject(course_id=course2.id, name="Power Systems", semester=5),
        models.Subject(course_id=course2.id, name="Control Systems", semester=6),
    ]
    
    for subject in cs_subjects + ee_subjects:
        db.add(subject)
    
    db.commit()
    print("Successfully seeded database with courses and subjects!")
    
except Exception as e:
    print(f"Error seeding database: {e}")
    db.rollback()
finally:
    db.close()


