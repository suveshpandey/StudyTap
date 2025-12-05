# StudyTap - University AI Assistant

A full-stack application for a university AI assistant platform that helps students get exam-oriented answers to their questions using Google's Gemini API. The platform includes separate portals for students and administrators.

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MySQL** - Relational database
- **SQLAlchemy** - ORM for database operations
- **JWT** - Authentication using python-jose
- **Gemini API** - AI-powered responsesa
- **Uvicorn** - ASGI server

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Project Structure

```
university_ai_assistant/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py             # FastAPI app entrypoint
│   │   ├── database.py         # Database configuration
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── auth.py             # JWT and password utilities
│   │   ├── deps.py             # Dependencies (authentication, etc.)
│   │   ├── gemini_client.py    # Gemini API integration
│   │   └── routers/            # API route handlers
│   │       ├── auth.py         # Authentication routes
│   │       ├── courses.py      # Course/subject routes
│   │       ├── chat.py         # Chat routes
│   │       ├── materials.py    # Study materials routes
│   │       └── master_*.py     # Master admin routes
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (not in git)
│   ├── .env.example            # Environment variables template
│   ├── .gitignore              # Git ignore rules
│   └── README.md               # Backend setup instructions
│
├── frontend-admin/             # Admin portal (React)
│   ├── src/
│   │   ├── api/                # API client configuration
│   │   ├── components/         # React components
│   │   ├── pages/              # Admin pages
│   │   ├── hooks/              # Custom React hooks
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   ├── .env                    # Environment variables (not in git)
│   ├── .env.example            # Environment variables template
│   ├── .gitignore              # Git ignore rules
│   └── README.md               # Admin frontend setup
│
├── frontend-student/           # Student portal (React)
│   ├── src/
│   │   ├── api/                # API client configuration
│   │   ├── components/         # React components
│   │   ├── pages/              # Student pages
│   │   ├── hooks/              # Custom React hooks
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   ├── .env                    # Environment variables (not in git)
│   ├── .env.example            # Environment variables template
│   ├── .gitignore              # Git ignore rules
│   └── README.md               # Student frontend setup
│
├── .gitignore                  # Root git ignore rules
├── ENVIRONMENT_SETUP.md        # Detailed environment setup guide
└── README.md                   # This file
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+ and npm
- MySQL 5.7+ or 8.0+
- Google Gemini API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:

On Windows:
```bash
venv\Scripts\activate
```

On Linux/Mac:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Set up MySQL database:
```sql
CREATE DATABASE university_ai_assistant;
```

6. Configure environment variables:

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and update:
- `DATABASE_URL` with your MySQL credentials (format: `mysql+mysqlconnector://USER:PASSWORD@localhost:3306/university_ai_assistant`)
- `JWT_SECRET_KEY` with a secure secret key
- `GEMINI_API_KEY` with your Google Gemini API key

7. (Optional) Seed the database with sample courses and subjects:
```bash
python -m app.seed
```

8. Run the backend server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation (Swagger UI) at `http://localhost:8000/docs`

### Frontend Setup

The application has two separate frontend applications:
- **frontend-admin**: For Master Admins and University Admins
- **frontend-student**: For Students

#### Admin Portal Setup

1. Navigate to the admin frontend directory:
```bash
cd frontend-admin
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set `VITE_API_BASE_URL=http://localhost:8000` (or your backend URL)

4. Run the development server:
```bash
npm run dev
```

The admin portal will be available at `http://localhost:5173`

#### Student Portal Setup

1. Navigate to the student frontend directory:
```bash
cd frontend-student
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set `VITE_API_BASE_URL=http://localhost:8000` (or your backend URL)

4. Run the development server:
```bash
npm run dev
```

The student portal will be available at `http://localhost:5174`

**Note:** See `ENVIRONMENT_SETUP.md` for detailed environment configuration instructions.

## Application Flow

1. **User Registration/Login**
   - Users can sign up with name, email, and password
   - Existing users can log in
   - JWT tokens are used for authentication

2. **Course & Subject Selection**
   - Authenticated users select a course from the available courses
   - After selecting a course, users can choose a subject
   - Clicking "Start Chat" creates a new chat session

3. **Chat Interface**
   - Users can ask questions related to the selected subject
   - Questions are sent to the backend, which calls the Gemini API
   - AI-generated answers are displayed in the chat interface
   - Chat history is persisted in the database

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

### Courses & Subjects
- `GET /courses` - List all courses (requires auth)
- `GET /courses/subjects?course_id={id}` - List subjects for a course (requires auth)

### Chat
- `POST /chat/start` - Start a new chat session (requires auth)
- `GET /chat` - List user's chats (requires auth)
- `GET /chat/{chat_id}/messages` - Get messages for a chat (requires auth)
- `POST /chat/{chat_id}/message` - Send a message in a chat (requires auth)

## Database Schema

- **users** - User accounts with authentication
- **courses** - Course catalog
- **subjects** - Subjects within courses
- **chats** - Chat sessions linked to users and subjects
- **chat_messages** - Messages within chats (USER or BOT)

## Features

### Student Portal
- Subject-wise AI chat for exam-oriented Q&A
- Study materials access
- Profile management
- Chat history

### Admin Portal
- **Master Admin**: 
  - Manage universities
  - Create university admins
  - View all students across universities
  - Delete users and universities
- **University Admin**:
  - Manage academic structure (courses, branches, semesters, subjects)
  - Upload study materials
  - Bulk upload students via CSV
  - Send automated credential emails

## Environment Configuration

All environment variables are stored in separate `.env` files for each application:
- `backend/.env` - Backend configuration (database, JWT, Gemini API, email)
- `frontend-admin/.env` - Admin portal configuration
- `frontend-student/.env` - Student portal configuration

See `ENVIRONMENT_SETUP.md` for detailed setup instructions and all available environment variables.

**Important:** Never commit `.env` files to version control. Use `.env.example` as a template.

## License

This project is for educational purposes.


