"""
Helper script to create .env file with proper database configuration.
This will prompt you for your MySQL credentials and create the .env file.
"""
import os
from pathlib import Path

def create_env_file():
    env_path = Path(__file__).parent / ".env"
    
    if env_path.exists():
        response = input(".env file already exists. Overwrite? (y/n): ")
        if response.lower() != 'y':
            print("Cancelled.")
            return
    
    print("\n=== Database Configuration ===")
    print("Enter your MySQL connection details:")
    
    db_user = input("MySQL Username [root]: ").strip() or "root"
    db_password = input("MySQL Password: ").strip()
    db_host = input("MySQL Host [localhost]: ").strip() or "localhost"
    db_port = input("MySQL Port [3306]: ").strip() or "3306"
    db_name = input("Database Name [university_ai_assistant]: ").strip() or "university_ai_assistant"
    
    # Build DATABASE_URL
    if db_password:
        database_url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    else:
        database_url = f"mysql+pymysql://{db_user}@{db_host}:{db_port}/{db_name}"
    
    print("\n=== JWT Configuration ===")
    jwt_secret = input("JWT Secret Key (press Enter for random): ").strip()
    if not jwt_secret:
        import secrets
        jwt_secret = secrets.token_urlsafe(32)
        print(f"Generated random JWT secret: {jwt_secret[:20]}...")
    
    print("\n=== Gemini API Configuration ===")
    gemini_key = input("Gemini API Key (can be added later): ").strip()
    
    # Write .env file
    env_content = f"""DATABASE_URL={database_url}
JWT_SECRET_KEY={jwt_secret}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY={gemini_key}
"""
    
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print(f"\n✓ Created .env file at {env_path}")
    print("\nNext steps:")
    print("1. Make sure MySQL is running")
    print(f"2. Create the database: CREATE DATABASE {db_name};")
    print("3. Test connection: python test_db_connection.py")
    print("4. Start server: uvicorn app.main:app --reload")

if __name__ == "__main__":
    create_env_file()


