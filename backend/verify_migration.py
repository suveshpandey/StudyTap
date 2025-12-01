# -----------------------------------------------------------------------------
# File: verify_migration.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Verify that the university migration was applied successfully
# -----------------------------------------------------------------------------

from app.database import engine
from sqlalchemy import text

print("Verifying database migration...")

with engine.connect() as conn:
    # Check users table columns
    result = conn.execute(text("DESCRIBE users"))
    cols = [row[0] for row in result]
    print("\nUsers table columns:")
    for col in cols:
        print(f"  - {col}")
    
    has_university_id = 'university_id' in cols
    print(f"\nHas university_id column: {has_university_id}")
    
    # Check if universities table exists
    result = conn.execute(text("SHOW TABLES LIKE 'universities'"))
    tables = [row[0] for row in result]
    has_universities_table = len(tables) > 0
    print(f"Universities table exists: {has_universities_table}")
    
    if has_university_id and has_universities_table:
        print("\n[SUCCESS] Migration verified! Database is ready.")
    else:
        print("\n[ERROR] Migration incomplete. Please run migrate_add_university.py")

