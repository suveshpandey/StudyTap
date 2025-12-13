# University AI Assistant - Admin Frontend

React-based admin dashboard for managing universities, branches, semesters, subjects, students, and materials. Supports two admin roles: Master Admin and University Admin.

## About

This is the administrative frontend for the University AI Assistant platform. It provides comprehensive management interfaces for:

- **Master Admins**: Manage universities, university admins, and students across the entire platform
- **University Admins**: Manage academic structure (branches, semesters, subjects), students, and materials within their university

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
frontend-admin/
├── src/
│   ├── api/
│   │   └── client.ts          # API client with axios configuration
│   ├── components/
│   │   ├── Navbar.tsx         # Global navigation bar
│   │   └── AuthForm.tsx       # Authentication form component
│   ├── hooks/
│   │   └── useAuth.tsx        # Authentication hook and context
│   ├── pages/
│   │   ├── LandingPage.tsx    # Landing/home page
│   │   ├── LoginPage.tsx      # Login page
│   │   ├── SignupPage.tsx     # Signup page
│   │   ├── MasterUniversitiesPage.tsx      # Master: Manage universities
│   │   ├── MasterAdminsPage.tsx            # Master: Manage university admins
│   │   ├── MasterStudentsPage.tsx          # Master: Manage students
│   │   ├── MasterUniversityDetailsPage.tsx # Master: University details
│   │   ├── MasterAdminProfilePage.tsx      # Master: Profile management
│   │   ├── AdminAcademicsPage.tsx           # Uni Admin: Manage academics
│   │   ├── AdminSubjectsPage.tsx            # Uni Admin: Manage subjects
│   │   ├── AdminStudentsPage.tsx            # Uni Admin: Manage students
│   │   ├── AdminMaterialsPage.tsx           # Uni Admin: Upload materials
│   │   ├── UniversityDetailsPage.tsx        # Uni Admin: University details
│   │   └── UniversityAdminProfilePage.tsx  # Uni Admin: Profile management
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

### 1. Navigate to Frontend Admin Directory

```bash
cd frontend-admin
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

Create a `.env` file in the `frontend-admin` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

**Note**: The `VITE_` prefix is required for Vite to expose the variable to the frontend code.

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

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

### Master Admin Features

1. **University Management**
   - Create, update, and delete universities
   - View university details and analytics
   - Manage university status (active/inactive)

2. **University Admin Management**
   - Create university admin accounts
   - Assign admins to universities
   - Update admin information
   - Activate/deactivate admins

3. **Student Management**
   - View all students across all universities
   - Create individual student accounts
   - Update student information
   - Activate/deactivate students

4. **Profile Management**
   - Update personal profile information
   - Change password
   - View account details

### University Admin Features

1. **Academic Structure Management**
   - **Branches**: Create and manage branches within university
   - **Semesters**: Create and manage semesters within branches
   - **Subjects**: Create, update, and manage subjects within semesters

2. **Student Management**
   - View students in their university
   - Bulk upload students via CSV or Excel
   - Create individual student accounts
   - Activate/deactivate students
   - Filter students by branch and batch year

3. **Material Management**
   - Upload PDF documents to AWS S3
   - Select branch → semester → subject for material upload
   - View uploaded materials
   - Documents automatically indexed by AWS Kendra

4. **University Details**
   - View university information
   - Update university details (if permitted)

5. **Profile Management**
   - Update personal profile information
   - Change password
   - View account details

## User Roles & Access

### Master Admin
- Full access to all universities
- Can manage university admins and students globally
- Access to platform-wide analytics

### University Admin
- Access limited to their assigned university
- Can manage academic structure within their university
- Can manage students within their university
- Can upload materials for their university

## Routing

### Public Routes
- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page (supports master admin signup with secret key)

### Master Admin Routes
- `/master/universities` - Manage universities
- `/master/universities/:id` - University details
- `/master/admins` - Manage university admins
- `/master/students` - Manage students
- `/master-admin/profile` - Profile management

### University Admin Routes
- `/admin/academics` - Manage academic structure (branches, semesters, subjects)
- `/admin/students` - Manage students
- `/admin/materials` - Upload and manage materials
- `/admin/university/details` - University details
- `/university-admin/profile` - Profile management

## Authentication

- Uses JWT tokens stored in localStorage
- Automatic token refresh on API calls
- Protected routes based on user role
- Automatic redirect to login on 401 errors

## API Integration

All API calls are made through the centralized API client (`src/api/client.ts`):

- Automatic JWT token injection
- Error handling and 401 redirects
- Type-safe API responses
- Centralized base URL configuration

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Responsive Design**: Mobile-friendly layouts
- **Modern UI**: Clean, professional interface

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Structure

- **Components**: Reusable UI components
- **Pages**: Full page components for routes
- **Hooks**: Custom React hooks (authentication, etc.)
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

3. **Build Errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify all environment variables are set

4. **Port Already in Use**
   - Change port in `vite.config.ts` or use `--port` flag:
     ```bash
     npm run dev -- --port 5174
     ```

## License

This project is for educational purposes.

