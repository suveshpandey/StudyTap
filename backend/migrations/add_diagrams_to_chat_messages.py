# -----------------------------------------------------------------------------
# File: add_diagrams_to_chat_messages.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Migration script to add diagrams column to chat_messages table
# -----------------------------------------------------------------------------

"""
Migration script to add diagrams column to chat_messages table.

Run this script to add the diagrams column to existing chat_messages table.
The diagrams column will store JSON data containing diagram URLs and metadata.

Usage:
    python migrations/add_diagrams_to_chat_messages.py
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/university_ai_assistant")

def run_migration():
    """Add diagrams column to chat_messages table if it doesn't exist."""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Check if column already exists
            check_query = text("""
                SELECT COUNT(*) as count
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'chat_messages'
                AND COLUMN_NAME = 'diagrams'
            """)
            
            result = conn.execute(check_query)
            count = result.fetchone()[0]
            
            if count > 0:
                print("Column 'diagrams' already exists in chat_messages table. Skipping migration.")
                return
            
            # Add diagrams column
            alter_query = text("""
                ALTER TABLE chat_messages
                ADD COLUMN diagrams JSON NULL
                AFTER sources
            """)
            
            conn.execute(alter_query)
            conn.commit()
            
            print("Successfully added 'diagrams' column to chat_messages table.")
            
    except Exception as e:
        print(f"Error running migration: {e}")
        print("Please ensure MySQL is running and DATABASE_URL is correctly configured.")
        sys.exit(1)
    finally:
        engine.dispose()

if __name__ == "__main__":
    print("Running migration: add_diagrams_to_chat_messages")
    run_migration()
    print("Migration completed.")

