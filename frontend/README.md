# Frontend - University AI Assistant

React + TypeScript frontend with Tailwind CSS and Framer Motion.

## Prerequisites

- Node.js 16+ and npm

## Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `VITE_API_BASE_URL` to your backend URL (default: `http://localhost:8000`)

3. **Run the development server:**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Features

- User authentication (login/signup)
- Course and subject selection
- Chat interface with AI assistant
- Smooth animations with Framer Motion
- Responsive design with Tailwind CSS
