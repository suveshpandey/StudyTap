// -----------------------------------------------------------------------------
// File: AdminSubjectsPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Legacy admin subjects page - redirects to AdminAcademicsPage
// -----------------------------------------------------------------------------

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminSubjectsPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      if (user?.role !== 'university_admin') {
        // Redirect based on role
        if (user?.role === 'master_admin') {
          navigate('/master/universities');
        } else if (user?.role === 'student') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
        return;
      }
      // Redirect to the new academics page
      navigate('/admin/academics', { replace: true });
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-500">Redirecting...</div>
    </div>
  );
};

export default AdminSubjectsPage;
