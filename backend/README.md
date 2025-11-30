# Backend - University AI Assistant

FastAPI backend with MySQL database and Gemini API integration.

## Prerequisites

- Python 3.8+
- MySQL 5.7+ or 8.0+
- MySQL database created: `university_ai_assistant`

## Setup

1. **Create a virtual environment:**

```bash
python -m venv venv
```

2. **Activate the virtual environment:**

On Windows:
```bash
venv\Scripts\activate
```

On Linux/Mac:
```bash
source venv/bin/activate
```

3. **Install dependencies:**

```bash
pip install -r requirements.txt
```

4. **Set up MySQL database:**

Create a MySQL database:
```sql
CREATE DATABASE university_ai_assistant;
```

5. **Configure environment variables:**

**Option 1: Use the setup script (Recommended)**
```bash
python setup_env.py
```
This will guide you through creating the `.env` file with your MySQL credentials.

**Option 2: Manual setup**
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and update:
- `DATABASE_URL` with your MySQL credentials (format: `mysql+pymysql://USER:PASSWORD@localhost:3306/university_ai_assistant`)
  - Replace `USER` with your MySQL username (e.g., `root`)
  - Replace `PASSWORD` with your MySQL password
  - If MySQL has no password, use: `mysql+pymysql://root@localhost:3306/university_ai_assistant`
- `JWT_SECRET_KEY` with a secure secret key
- `GEMINI_API_KEY` with your Google Gemini API key

**Important**: 
- Make sure MySQL is running
- Create the database: `CREATE DATABASE university_ai_assistant;`
- Test your connection: `python test_db_connection.py`

6. **Run the application:**

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI) will be available at `http://localhost:8000/docs`

## Database Schema

The database schema is automatically created by SQLAlchemy when the application starts. The following tables are created:

- `users` - User accounts
- `courses` - Course catalog
- `subjects` - Subjects within courses
- `chats` - Chat sessions
- `chat_messages` - Messages within chats

## API Endpoints

- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /courses` - List all courses (requires auth)
- `GET /courses/subjects?course_id={id}` - List subjects for a course (requires auth)
- `POST /chat/start` - Start a new chat session (requires auth)
- `GET /chat` - List user's chats (requires auth)
- `GET /chat/{chat_id}/messages` - Get messages for a chat (requires auth)
- `POST /chat/{chat_id}/message` - Send a message in a chat (requires auth)

