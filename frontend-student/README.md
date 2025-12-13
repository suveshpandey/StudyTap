# University AI Assistant - Student Frontend

React-based student interface for the University AI Assistant platform. Students can interact with an AI-powered chat system to get exam-oriented answers from their course materials.

## About

This is the student-facing frontend for the University AI Assistant platform. It provides:

- **AI-Powered Chat**: Students can ask questions and receive contextual answers based on their course materials
- **Branch-Wide Chat**: Access all materials from their branch without selecting a specific subject
- **Subject-Specific Chat**: Focus on materials from a specific subject
- **Chat History**: View and continue previous chat sessions
- **Profile Management**: Update personal information and change password

## Tech Stack

- **React 19.2.0** - Modern UI library
- **TypeScript 5.9.3** - Type safety and better developer experience
- **Vite 7.2.4** - Fast build tool and dev server
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **Framer Motion 12.23.24** - Animation library for smooth UI transitions
- **React Router 7.9.6** - Client-side routing
- **Axios 1.13.2** - HTTP client for API calls
- **Lucide React 0.555.0** - Icon library
- **React Markdown 10.1.0** - Markdown rendering for chat messages
- **Rehype Highlight 7.0.2** - Code syntax highlighting

## Project Structure

```
frontend-student/
├── src/
│   ├── api/
│   │   └── client.ts          # API client with axios configuration
│   ├── components/
│   │   ├── Navbar.tsx         # Global navigation bar
│   │   ├── ChatInput.tsx      # Chat input component
│   │   └── ChatMessageBubble.tsx  # Chat message display component
│   ├── hooks/
│   │   └── useAuth.tsx        # Authentication hook and context
│   ├── pages/
│   │   ├── LandingPage.tsx    # Landing/home page
│   │   ├── LoginPage.tsx      # Login page
│   │   ├── SelectSubjectPage.tsx  # Dashboard: Select subject or start branch chat
│   │   ├── ChatPage.tsx       # Main chat interface
│   │   ├── ChatListPage.tsx   # List of previous chats
│   │   └── StudentProfilePage.tsx # Profile management
│   ├── App.tsx                # Main app component with routing
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## Prerequisites

- **Node.js 16+** (Node.js 18+ recommended)
- **npm** or **yarn** package manager
- **Backend API** running (see backend README.md)

## Installation & Setup

### 1. Navigate to Frontend Student Directory

```bash
cd frontend-student
```

### 2. Install Dependencies

```bash
npm install
```

or with yarn:

```bash
yarn install
```

### 3. Configure Environment Variables

Create a `.env` file in the `frontend-student` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

**Note**: The `VITE_` prefix is required for Vite to expose the variable to the frontend code.

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5174`

**Note**: The student frontend runs on port 5174 by default (admin frontend uses 5173).

### 5. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### 6. Preview Production Build

```bash
npm run preview
```

## Features

### 1. Dashboard (Select Subject Page)

- **Branch Chat**: Prominent button to start chatting with all materials from the student's branch
  - No subject selection required
  - Access to all materials across all subjects in the branch
  - Quick access for general questions

- **Subject-Specific Chat**: Select semester and subject for focused chat
  - Choose from available semesters
  - Select a specific subject
  - Get answers from materials specific to that subject

### 2. Chat Interface

- **Real-time Chat**: Interactive chat interface with AI assistant
- **Message History**: View conversation history
- **Source Citations**: See which documents and pages were used for answers
- **Markdown Support**: Rich text rendering for code blocks and formatting
- **Sidebar Toggle**: Collapsible sidebar for better mobile experience
- **Message Types**:
  - **USER**: Student questions
  - **BOT**: AI-generated responses with sources

### 3. Chat Management

- **Chat List**: View all previous chat sessions
- **Chat Titles**: Automatically generated from first question
- **Continue Chats**: Resume previous conversations
- **Subject/Branch Labels**: See which subject or branch each chat belongs to

### 4. Profile Management

- **View Profile**: See personal information
- **Update Profile**: Change name and email
- **Change Password**: Update account password
- **Logout**: Secure logout functionality

## User Flow

### Starting a Chat

1. **Branch Chat (Quick Start)**:
   - Student lands on dashboard
   - Clicks "Start Branch Chat" button
   - Immediately starts chatting with access to all branch materials

2. **Subject-Specific Chat**:
   - Student selects a semester from the list
   - Selects a subject from that semester
   - Clicks "Start Subject Chat" button
   - Starts chatting with materials from that specific subject

### Chatting

1. Student types a question in the chat input
2. Question is sent to backend API
3. Backend queries AWS Kendra for relevant document chunks
4. Backend sends question + context to Google Gemini
5. AI generates contextual answer
6. Response displayed with source citations (document titles and page numbers)

## Routing

### Public Routes
- `/` - Landing page
- `/login` - Login page

### Protected Routes (Student Only)
- `/dashboard` - Subject selection and branch chat dashboard
- `/chat/:chatId` - Chat interface for a specific chat
- `/chats` - List of all chat sessions
- `/profile` - Profile management

## Authentication

- Uses JWT tokens stored in localStorage
- Automatic token refresh on API calls
- Protected routes require authentication
- Automatic redirect to login on 401 errors
- Role-based access (students only)

## API Integration

All API calls are made through the centralized API client (`src/api/client.ts`):

- Automatic JWT token injection
- Error handling and 401 redirects
- Type-safe API responses
- Centralized base URL configuration

### Key API Functions

- `startChat(subjectId?, title?)` - Start new chat (subject-specific or branch-wide)
- `getChats()` - Get all student's chats
- `getChatMessages(chatId)` - Get messages for a chat
- `sendChatMessage(chatId, question)` - Send message and get AI response
- `getBranches()` - Get student's branch
- `getSemesters(branchId)` - Get semesters for branch
- `getSubjects(semesterId)` - Get subjects for semester

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Responsive Design**: Mobile-friendly layouts
- **Modern UI**: Clean, student-friendly interface
- **Gradient Backgrounds**: Visually appealing design

## Chat Features

### Branch Chat vs Subject Chat

**Branch Chat**:
- Access to all materials in student's branch
- No subject selection needed
- Best for general questions or cross-subject queries
- Faster to start

**Subject Chat**:
- Focused on specific subject materials
- More precise answers for subject-specific questions
- Better for exam preparation in specific subjects

### Source Citations

Each AI response includes:
- **Document Titles**: Actual PDF names (not UUIDs)
- **Page Numbers**: Page where information was found
- **Relevance**: How relevant the source is to the question

### Smart Responses

- **Context-Aware**: Answers based on actual course materials
- **Exam-Oriented**: Focused on exam-relevant information
- **Source Transparency**: Always shows where information came from
- **Fallback Handling**: Graceful handling when information isn't available

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload (port 5174)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Structure

- **Components**: Reusable UI components (Navbar, ChatInput, ChatMessageBubble)
- **Pages**: Full page components for routes
- **Hooks**: Custom React hooks (authentication)
- **API**: Centralized API client and types

## Production Deployment

### Build Process

1. Set production API URL in `.env`:
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Deploy the `dist/` directory to your hosting service:
   - **Netlify**: Drag and drop `dist/` folder
   - **Vercel**: Connect repository, auto-detects Vite
   - **AWS S3 + CloudFront**: Upload `dist/` to S3 bucket
   - **Nginx**: Serve `dist/` directory

### Environment Variables

Ensure production environment variables are set:
- `VITE_API_BASE_URL` - Backend API URL

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify backend is running
   - Check `VITE_API_BASE_URL` in `.env`
   - Check CORS configuration in backend

2. **Authentication Issues**
   - Clear localStorage and try logging in again
   - Verify JWT token is being sent in requests
   - Check backend authentication endpoints

3. **Chat Not Loading**
   - Verify student has an assigned branch
   - Check if materials are uploaded for the subject/branch
   - Verify AWS Kendra is configured (for RAG functionality)

4. **Build Errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify all environment variables are set

5. **Port Already in Use**
   - Change port in `vite.config.ts` or use `--port` flag:
     ```bash
     npm run dev -- --port 5175
     ```

## Best Practices

1. **Chat Usage**:
   - Use Branch Chat for general questions
   - Use Subject Chat for specific exam preparation
   - Review source citations to verify information

2. **Performance**:
   - Chat history is loaded on demand
   - Large conversations are paginated
   - Images and assets are optimized

3. **Accessibility**:
   - Keyboard navigation supported
   - Screen reader friendly
   - Responsive design for all devices

## License

This project is for educational purposes.

