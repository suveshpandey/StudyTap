// -----------------------------------------------------------------------------
// File: App.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Main React application component with routing configuration for admin frontend
// -----------------------------------------------------------------------------

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MasterUniversitiesPage from './pages/MasterUniversitiesPage';
import MasterAdminsPage from './pages/MasterAdminsPage';
import MasterStudentsPage from './pages/MasterStudentsPage';
import MasterUniversityDetailsPage from './pages/MasterUniversityDetailsPage';
import MasterAdminProfilePage from './pages/MasterAdminProfilePage';
import AdminAcademicsPage from './pages/AdminAcademicsPage';
import AdminStudentsPage from './pages/AdminStudentsPage';
import AdminSubjectsPage from './pages/AdminSubjectsPage';
import AdminMaterialsPage from './pages/AdminMaterialsPage';
import UniversityDetailsPage from './pages/UniversityDetailsPage';
import UniversityAdminProfilePage from './pages/UniversityAdminProfilePage';
import Navbar from './components/Navbar';
import { AnimatePresence } from 'framer-motion';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role if specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Master Admin Routes */}
          <Route
            path="/master/universities"
            element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <MasterUniversitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/master/universities/:id"
            element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <MasterUniversityDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/master/admins"
            element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <MasterAdminsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/master/students"
            element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <MasterStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/master-admin/profile"
            element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <MasterAdminProfilePage />
              </ProtectedRoute>
            }
          />
          
          {/* University Admin Routes */}
          <Route
            path="/admin/academics"
            element={
              <ProtectedRoute allowedRoles={['university_admin']}>
                <AdminAcademicsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['university_admin']}>
                <AdminStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute allowedRoles={['university_admin']}>
                <AdminSubjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/materials"
            element={
              <ProtectedRoute allowedRoles={['university_admin']}>
                <AdminMaterialsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/university/details"
            element={
              <ProtectedRoute allowedRoles={['university_admin']}>
                <UniversityDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/university-admin/profile"
            element={
              <ProtectedRoute allowedRoles={['university_admin']}>
                <UniversityAdminProfilePage />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

