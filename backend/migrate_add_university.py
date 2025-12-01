# -----------------------------------------------------------------------------
# File: migrate_add_university.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Migration script to add university_id column to users table and create universities table
# -----------------------------------------------------------------------------

"""
Migration script to add university support to the database.

This script:
1. Creates the universities table if it doesn't exist
2. Adds university_id column to users table if it doesn't exist

Run this script once to update your database schema.
"""

from sqlalchemy import text
from app.database import engine, SessionLocal
from app import models

def migrate():
    """Run the migration to add university support."""
    print("Starting migration: Adding university support...")
    
    # Create all tables (this will create universities table if it doesn't exist)
    models.Base.metadata.create_all(bind=engine)
    print("[OK] Ensured all tables exist")
    
    # Now add university_id column to users table if it doesn't exist
    with engine.connect() as conn:
        try:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT COUNT(*) as count
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'users'
                AND COLUMN_NAME = 'university_id'
            """))
            
            column_exists = result.fetchone()[0] > 0
            
            if not column_exists:
                print("Adding university_id column to users table...")
                # Add the column
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN university_id INT NULL,
                    ADD CONSTRAINT fk_users_university
                        FOREIGN KEY (university_id) REFERENCES universities(id)
                        ON DELETE SET NULL
                """))
                conn.commit()
                print("[OK] Added university_id column to users table")
            else:
                print("[OK] university_id column already exists in users table")
                
        except Exception as e:
            print(f"Error during migration: {e}")
            print("You may need to run this manually in your MySQL client:")
            print("""
ALTER TABLE users
ADD COLUMN university_id INT NULL,
ADD CONSTRAINT fk_users_university
    FOREIGN KEY (university_id) REFERENCES universities(id)
    ON DELETE SET NULL;
            """)
            raise
    
    print("\nMigration completed successfully!")
    print("Your database now supports universities and university_id in users table.")

if __name__ == "__main__":
    migrate()

