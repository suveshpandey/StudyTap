# -----------------------------------------------------------------------------
# File: migrate_add_course_university.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Migration script to add university_id column to courses table
# -----------------------------------------------------------------------------

"""
Migration script to add university_id to courses table.

This script:
1. Adds university_id column to courses table if it doesn't exist
2. Adds foreign key constraint

Run this script once to update your database schema.
"""

from sqlalchemy import text
from app.database import engine
from app import models

def migrate():
    """Run the migration to add university_id to courses."""
    print("Starting migration: Adding university_id to courses table...")
    
    # Create all tables (this will create any missing tables)
    models.Base.metadata.create_all(bind=engine)
    print("[OK] Ensured all tables exist")
    
    # Now add university_id column to courses table if it doesn't exist
    with engine.connect() as conn:
        try:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT COUNT(*) as count
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'courses'
                AND COLUMN_NAME = 'university_id'
            """))
            
            column_exists = result.fetchone()[0] > 0
            
            if not column_exists:
                print("Adding university_id column to courses table...")
                # Add the column
                conn.execute(text("""
                    ALTER TABLE courses
                    ADD COLUMN university_id INT NULL,
                    ADD CONSTRAINT fk_courses_university
                        FOREIGN KEY (university_id) REFERENCES universities(id)
                        ON DELETE SET NULL
                """))
                conn.commit()
                print("[OK] Added university_id column to courses table")
            else:
                print("[OK] university_id column already exists in courses table")
                
        except Exception as e:
            print(f"Error during migration: {e}")
            print("You may need to run this manually in your MySQL client:")
            print("""
ALTER TABLE courses
ADD COLUMN university_id INT NULL,
ADD CONSTRAINT fk_courses_university
    FOREIGN KEY (university_id) REFERENCES universities(id)
    ON DELETE SET NULL;
            """)
            raise
    
    print("\nMigration completed successfully!")
    print("Your database now supports university_id in courses table.")

if __name__ == "__main__":
    migrate()

