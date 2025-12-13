# University AI Assistant - Backend API

FastAPI backend for the University AI Assistant application, providing RESTful APIs for authentication, course management, chat functionality, and AI-powered responses using Google Gemini and AWS Kendra.

## About

This backend service powers the University AI Assistant platform, enabling:
- Multi-role authentication (Master Admin, University Admin, Students)
- University, branch, semester, and subject management
- AI-powered chat system with RAG (Retrieval-Augmented Generation)
- AWS S3 integration for document storage
- AWS Kendra integration for intelligent document search
- Google Gemini API for generating contextual responses

## Tech Stack

- **FastAPI** (0.104.1) - Modern Python web framework with automatic API documentation
- **SQLAlchemy** (>=2.0.23) - ORM for database operations
- **MySQL** - Relational database (via PyMySQL)
- **JWT** (python-jose) - Token-based authentication
- **Google Gemini API** - AI-powered response generation
- **AWS S3** (boto3) - Document storage
- **AWS Kendra** (boto3) - Intelligent document search and retrieval
- **Uvicorn** - ASGI server for production deployment
- **Pydantic** (>=2.5.0) - Data validation and serialization
- **Python-dotenv** - Environment variable management

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── database.py          # Database configuration and session management
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic schemas for request/response validation
│   ├── auth.py              # JWT and password hashing utilities
│   ├── deps.py              # Dependency injection (get_current_user, etc.)
│   ├── gemini_client.py     # Google Gemini API integration
│   ├── kendra_client.py     # AWS Kendra integration for RAG
│   ├── s3_config.py         # AWS S3 configuration and utilities
│   ├── email_config.py      # Email service configuration
│   ├── email_service.py     # Email sending utilities
│   ├── seed.py              # Database seeding script
│   └── routers/             # API route handlers
│       ├── __init__.py
│       ├── auth.py           # Authentication endpoints
│       ├── courses.py        # Course, branch, semester, subject endpoints
│       ├── chat.py           # Chat and messaging endpoints
│       ├── materials.py      # Material document management
│       ├── admin_academics.py    # University admin academic management
│       ├── admin_students.py     # University admin student management
│       ├── master_universities.py # Master admin university management
│       ├── student_profile.py     # Student profile management
│       ├── university_admin_profile.py  # University admin profile
│       ├── master_admin_profile.py     # Master admin profile
│       └── university_details.py       # University details management
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
├── AWS_S3_SETUP.md         # AWS S3 setup guide
├── KENDRA_SETUP.md         # AWS Kendra setup guide
├── EMAIL_SETUP.md          # Email service setup guide
└── README.md               # This file
```

## Prerequisites

- **Python 3.8+** (Python 3.9+ recommended)
- **MySQL 5.7+** or **MySQL 8.0+**
- **Google Gemini API Key** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **AWS Account** (for S3 and Kendra):
  - AWS Access Key ID
  - AWS Secret Access Key
  - S3 Bucket for document storage
  - Kendra Index ID (optional, for RAG functionality)
- **Email Service** (optional, for sending credentials):
  - SMTP server credentials

## Installation & Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up MySQL Database

Create a new database:

```sql
CREATE DATABASE university_ai_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/university_ai_assistant

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# AWS S3 Configuration (for document storage)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# AWS Kendra Configuration (optional, for RAG)
KENDRA_INDEX_ID=your-kendra-index-id
KENDRA_DISABLE_FILTERING=false

# Email Configuration (optional)
EMAIL_ENABLED=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=University AI Assistant
EMAIL_FROM_ADDRESS=your-email@gmail.com
```

### 6. (Optional) Seed Database

Populate the database with initial data:

```bash
python -m app.seed
```

### 7. Run the Development Server

```bash
uvicorn app.main:app --reload
```

The API will be available at:
- **API Base URL**: `http://localhost:8000`
- **API Documentation (Swagger)**: `http://localhost:8000/docs`
- **Alternative Docs (ReDoc)**: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration (supports master_admin with secret key)
- `POST /auth/login` - User login (returns JWT token)

### Courses & Academic Structure
- `GET /courses/universities` - List all universities (public)
- `GET /courses/branches` - Get branches (role-based: students get their branch, admins get all)
- `GET /courses/semesters?branch_id={id}` - Get semesters for a branch
- `GET /courses/subjects?semester_id={id}` - Get subjects for a semester

### Chat
- `POST /chat/start` - Start a new chat session (subject-specific or branch-wide)
- `GET /chat` - List user's chats
- `GET /chat/{chat_id}/messages` - Get messages for a chat
- `POST /chat/{chat_id}/message` - Send a message and get AI response

### Materials (University Admin)
- `POST /materials/documents/upload` - Upload PDF document to S3
- `GET /materials/documents` - List material documents

### Master Admin
- `GET /master/universities` - List all universities
- `POST /master/universities` - Create university
- `PUT /master/universities/{id}` - Update university
- `DELETE /master/universities/{id}` - Delete university
- `GET /master/universities/{id}` - Get university details
- `GET /master/admins` - List university admins
- `POST /master/admins` - Create university admin
- `PUT /master/admins/{id}` - Update university admin
- `DELETE /master/admins/{id}` - Delete university admin
- `GET /master/students` - List all students
- `POST /master/students` - Create student
- `PUT /master/students/{id}` - Update student
- `DELETE /master/students/{id}` - Delete student

### University Admin
- `GET /admin/branches` - List branches in university
- `POST /admin/branches` - Create branch
- `DELETE /admin/branches/{id}` - Delete branch
- `GET /admin/semesters?branch_id={id}` - List semesters
- `POST /admin/semesters` - Create semester
- `DELETE /admin/semesters/{id}` - Delete semester
- `GET /admin/subjects?semester_id={id}` - List subjects
- `POST /admin/subjects` - Create subject
- `PUT /admin/subjects/{id}` - Update subject
- `DELETE /admin/subjects/{id}` - Delete subject
- `POST /admin/students/upload-csv` - Bulk upload students via CSV
- `POST /admin/students/upload-excel` - Bulk upload students via Excel
- `GET /admin/students` - List students (with filters)
- `POST /admin/students/{id}/activate` - Activate student
- `POST /admin/students/{id}/deactivate` - Deactivate student

### Profiles
- `GET /student/profile` - Get student profile
- `PUT /student/profile` - Update student profile
- `GET /university-admin/profile` - Get university admin profile
- `PUT /university-admin/profile` - Update university admin profile
- `GET /master-admin/profile` - Get master admin profile
- `PUT /master-admin/profile` - Update master admin profile

## Database Schema

### Core Tables
- **universities** - University information
- **branches** - Academic branches within universities
- **semesters** - Semesters within branches
- **subjects** - Subjects within semesters
- **students** - Student accounts
- **university_admins** - University administrator accounts
- **master_admins** - Master administrator accounts

### Chat Tables
- **chats** - Chat sessions (linked to students, optional subject_id for branch chats)
- **chat_messages** - Messages within chats (USER or BOT)

### Material Tables
- **materials_documents** - PDF documents stored in S3
- **materials_chunks** - Text chunks extracted from documents (legacy, now using Kendra)

## Features

### 1. Multi-Role Authentication
- **Master Admin**: Manages universities, university admins, and students
- **University Admin**: Manages branches, semesters, subjects, students, and materials within their university
- **Student**: Accesses chat functionality and profile management

### 2. RAG (Retrieval-Augmented Generation)
- **AWS Kendra Integration**: Intelligent search across S3 documents
- **Context-Aware Responses**: Gemini generates answers based on retrieved document chunks
- **Source Citations**: Responses include document titles and page numbers
- **Branch-Level & Subject-Level Queries**: Supports both granular and broad searches

### 3. Document Management
- **S3 Storage**: PDF documents stored in organized S3 structure
- **S3 Key Format**: `universities/{university_id}/branches/{branch_id}/subjects/{subject_id}/materials/{uuid}.pdf`
- **Automatic Indexing**: Documents automatically indexed by Kendra

### 4. Chat System
- **Subject-Specific Chats**: Students can chat about specific subjects
- **Branch-Wide Chats**: Students can chat across all materials in their branch
- **Message History**: Persistent chat history
- **Smart Filtering**: Kendra filters results by university and subject/branch

## AWS Setup

### S3 Setup
See `AWS_S3_SETUP.md` for detailed S3 bucket and IAM configuration.

### Kendra Setup
See `KENDRA_SETUP.md` for detailed Kendra index creation and configuration.

### Email Setup
See `EMAIL_SETUP.md` for email service configuration (optional).

## Development

### Running Tests
```bash
# Run with auto-reload for development
uvicorn app.main:app --reload

# Run in production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Database Migrations
The application uses SQLAlchemy's `create_all()` to automatically create tables on startup. For production, consider using Alembic for migrations.

### Environment Variables
All sensitive configuration should be in `.env` file (never commit this file).

## Production Deployment

### Recommended Setup
1. Use a production ASGI server like Gunicorn with Uvicorn workers
2. Set up reverse proxy (Nginx) for SSL/TLS
3. Use environment variables for all secrets
4. Enable database connection pooling
5. Set up proper logging
6. Configure CORS for production domains

### Example Production Command
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check `DATABASE_URL` format
   - Ensure database exists

2. **Kendra Query Errors**
   - Verify AWS credentials
   - Check Kendra index ID
   - Ensure IAM user has `kendra:Query` permission

3. **S3 Upload Errors**
   - Verify AWS credentials
   - Check S3 bucket name
   - Ensure IAM user has S3 permissions

4. **Gemini API Errors**
   - Verify API key is valid
   - Check API quota/limits
   - Ensure internet connectivity

## License

This project is for educational purposes.
