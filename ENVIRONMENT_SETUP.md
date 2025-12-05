# Environment Configuration Guide

This document explains how to set up environment variables for the StudyTap application.

## Overview

The project is split into three main folders:
- **backend/** - FastAPI backend server
- **frontend-admin/** - Admin portal (React + Vite)
- **frontend-student/** - Student portal (React + Vite)

Each folder has its own `.env` file for environment-specific configuration.

## Backend Configuration

### Location
`backend/.env`

### Required Variables

```env
# Database Configuration
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/university_ai_assistant

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-flash
```

### Optional Variables (Email Functionality)

```env
# Email Configuration for sending student credentials
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
MAIL_FROM_NAME=StudyTap
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
MAIL_USE_CREDENTIALS=True
```

### Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Update the following:
   - **DATABASE_URL**: Update with your MySQL credentials
   - **JWT_SECRET_KEY**: Generate a secure random key (use `openssl rand -hex 32`)
   - **GEMINI_API_KEY**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **Email variables**: Optional, only needed for sending student credentials

3. For Gmail email setup:
   - Enable 2-Factor Authentication
   - Generate an App Password: Google Account → Security → 2-Step Verification → App passwords
   - Use the 16-character app password as `MAIL_PASSWORD`

## Frontend-Admin Configuration

### Location
`frontend-admin/.env`

### Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# App Configuration
VITE_APP_NAME=StudyTap Admin
```

### Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cd frontend-admin
   cp .env.example .env
   ```

2. Update `VITE_API_BASE_URL` if your backend runs on a different host/port

**Note:** In Vite, all environment variables must be prefixed with `VITE_` to be exposed to the client.

## Frontend-Student Configuration

### Location
`frontend-student/.env`

### Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# App Configuration
VITE_APP_NAME=StudyTap Student
```

### Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cd frontend-student
   cp .env.example .env
   ```

2. Update `VITE_API_BASE_URL` if your backend runs on a different host/port

## Production Deployment

### Security Best Practices

1. **Never commit `.env` files** to version control
2. **Generate strong secrets** for production:
   ```bash
   # Generate a secure JWT secret
   openssl rand -hex 32
   ```
3. **Use environment-specific values**:
   - Development: `http://localhost:8000`
   - Production: `https://api.yourdomain.com`

### Backend Production Variables

```env
DATABASE_URL=mysql+pymysql://user:pass@production-host:3306/db_name
JWT_SECRET_KEY=<long-random-hex-string>
GEMINI_API_KEY=<your-production-key>
```

### Frontend Production Variables

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Verifying Configuration

### Backend
```bash
cd backend
python -c "from app.database import test_connection; print('✓ DB Connected' if test_connection() else '✗ DB Connection Failed')"
```

### Frontend
The apps will automatically use the environment variables. Check the browser console for any API connection errors.

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `mysql -u root -p`
- Check DATABASE_URL format: `mysql+pymysql://user:password@host:port/database`
- Ensure database exists: `CREATE DATABASE university_ai_assistant;`

### API Connection Issues
- Verify backend is running on the port specified in `VITE_API_BASE_URL`
- Check CORS settings in `backend/app/main.py`
- Clear browser cache and restart the dev server

### Email Issues
- Verify SMTP credentials
- For Gmail, ensure App Password is used (not regular password)
- Check firewall allows outbound connections on port 587

## Environment Variables Reference

| Variable | Location | Required | Description |
|----------|----------|----------|-------------|
| DATABASE_URL | Backend | Yes | MySQL connection string |
| JWT_SECRET_KEY | Backend | Yes | Secret key for JWT tokens |
| JWT_ALGORITHM | Backend | No | JWT algorithm (default: HS256) |
| ACCESS_TOKEN_EXPIRE_MINUTES | Backend | No | Token expiry (default: 60) |
| GEMINI_API_KEY | Backend | Yes | Google Gemini API key |
| GEMINI_MODEL | Backend | No | Gemini model (default: gemini-1.5-flash) |
| MAIL_* | Backend | No | Email configuration (optional) |
| VITE_API_BASE_URL | Frontend | Yes | Backend API URL |
| VITE_APP_NAME | Frontend | No | Application name |

## Quick Start

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your values
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# Frontend Admin
cd frontend-admin
cp .env.example .env
# Edit .env if needed
npm install
npm run dev

# Frontend Student
cd frontend-student
cp .env.example .env
# Edit .env if needed
npm install
npm run dev
```

