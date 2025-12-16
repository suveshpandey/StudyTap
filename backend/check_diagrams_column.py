# -----------------------------------------------------------------------------
# File: check_diagrams_column.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Check if diagrams column exists in chat_messages table
# -----------------------------------------------------------------------------

"""
Quick script to check if the diagrams column exists in the chat_messages table.

Usage:
    python check_diagrams_column.py
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/university_ai_assistant")

def check_column():
    """Check if diagrams column exists in chat_messages table."""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Check if column exists
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
                print("✓ Diagrams column EXISTS in chat_messages table")
                
                # Get column details
                details_query = text("""
                    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'chat_messages'
                    AND COLUMN_NAME = 'diagrams'
                """)
                
                details = conn.execute(details_query).fetchone()
                if details:
                    print(f"  Column Type: {details[1]}")
                    print(f"  Nullable: {details[2]}")
                
                return True
            else:
                print("✗ Diagrams column DOES NOT EXIST in chat_messages table")
                print("\nPlease run the migration:")
                print("  python migrations/add_diagrams_to_chat_messages.py")
                return False
                
    except Exception as e:
        print(f"Error checking column: {e}")
        print("Please ensure MySQL is running and DATABASE_URL is correctly configured.")
        return False
    finally:
        engine.dispose()

if __name__ == "__main__":
    print("Checking if diagrams column exists in chat_messages table...")
    print("-" * 60)
    exists = check_column()
    print("-" * 60)
    if exists:
        print("Database is ready for diagram storage.")
    else:
        print("Database migration required.")
        sys.exit(1)

