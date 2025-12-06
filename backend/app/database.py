# -----------------------------------------------------------------------------
# File: database.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Database connection configuration and session management using SQLAlchemy
# -----------------------------------------------------------------------------

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
import os
from dotenv import load_dotenv

load_dotenv()

# Get DATABASE_URL from environment, with a default that uses PyMySQL
# Format: mysql+pymysql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/university_ai_assistant")

# Create engine with connection pool settings
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=300,    # Recycle connections after 5 minutes
    echo=False           # Set to True for SQL query logging (useful for debugging)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Database dependency for FastAPI routes.
    Creates a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
def test_connection():
    """
    Test database connection. Useful for debugging.
    """
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except OperationalError as e:
        print(f"Database connection failed: {e}")
        print(f"Current DATABASE_URL: {DATABASE_URL.split('@')[0]}@...")  # Don't print full password
        return False


