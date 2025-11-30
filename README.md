# University AI Assistant

A full-stack MVP for a university AI assistant application that helps students get exam-oriented answers to their questions using Google's Gemini API.

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
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py       # FastAPI app entrypoint
│   │   ├── database.py   # Database configuration
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── auth.py       # JWT and password utilities
│   │   ├── deps.py       # Dependencies (get_current_user, etc.)
│   │   ├── gemini_client.py  # Gemini API integration
│   │   ├── seed.py       # Database seeding script
│   │   └── routers/      # API route handlers
│   │       ├── auth.py   # Authentication routes
│   │       ├── courses.py # Course/subject routes
│   │       └── chat.py    # Chat routes
│   ├── requirements.txt  # Python dependencies
│   ├── .env.example      # Environment variables template
│   └── README.md         # Backend setup instructions
│
├── frontend/             # React frontend
│   ├── src/
│   │   ├── api/          # API client configuration
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   ├── .env.example      # Environment variables template
│   └── README.md         # Frontend setup instructions
│
└── README.md             # This file
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

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `VITE_API_BASE_URL=http://localhost:8000` (or your backend URL)

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

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

## Future Enhancements

- PDF document upload and RAG (Retrieval Augmented Generation) integration
- Source citations in chat responses
- Chat history management (rename, delete)
- Multiple chat sessions per subject
- Admin panel for course/subject management

## License

This project is for educational purposes.


