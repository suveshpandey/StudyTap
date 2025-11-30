"""
Simple script to test MySQL database connection.
Run this to verify your DATABASE_URL is correct before starting the server.
"""
import os
from dotenv import load_dotenv
from app.database import test_connection, DATABASE_URL

load_dotenv()

if __name__ == "__main__":
    print("Testing database connection...")
    print(f"Using DATABASE_URL: {DATABASE_URL.split('@')[0]}@...")  # Don't print full password
    
    if test_connection():
        print("[OK] Database connection successful!")
    else:
        print("[ERROR] Database connection failed!")
        print("\nTroubleshooting steps:")
        print("1. Make sure MySQL is running")
        print("2. Check your DATABASE_URL in .env file")
        print("3. Verify the database 'university_ai_assistant' exists")
        print("4. Check your MySQL username and password")
        print("\nExample DATABASE_URL formats:")
        print("  - With password: mysql+pymysql://root:yourpassword@localhost:3306/university_ai_assistant")
        print("  - Without password: mysql+pymysql://root@localhost:3306/university_ai_assistant")

