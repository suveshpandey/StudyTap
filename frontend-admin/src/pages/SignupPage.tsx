// -----------------------------------------------------------------------------
// File: SignupPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Master admin registration page (only available if no master admin exists)
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthForm from '../components/AuthForm';
import apiClient from '../api/client';
import { useAuth } from '../hooks/useAuth';

const SignupPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingMasterAdmin, setCheckingMasterAdmin] = useState(true);
  const PRIMARY_COLOR = 'blue';

  // Check if master admin already exists
  useEffect(() => {
    const checkMasterAdmin = async () => {
      try {
        // Try to access a master admin endpoint - if it works, master admin exists
        // Or we can check by trying to login with a dummy account
        // For now, we'll let the signup endpoint handle the check
        setCheckingMasterAdmin(false);
      } catch (err) {
        setCheckingMasterAdmin(false);
      }
    };
    checkMasterAdmin();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const [masterAdminKey, setMasterAdminKey] = useState('');

  const handleSubmit = async (data: { name?: string; email: string; password: string }) => {
    setIsLoading(true);
    setError('');

    if (!data.name) {
      setError('Name is required');
      setIsLoading(false);
      return;
    }

    if (!masterAdminKey.trim()) {
      setError('Master Admin Key is required for security purposes');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/auth/signup', {
        name: data.name,
        email: data.email,
        password: data.password,
        master_admin_key: masterAdminKey.trim(),
        // No university_id for master admin
      });
      login(response.data.access_token, response.data.user);
      // Redirect to master admin dashboard
      navigate('/master/universities');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Signup failed. Please try again.';
      setError(errorMessage);
      
      // If master admin already exists, redirect to login after 3 seconds
      if (errorMessage.includes('Master admin already exists')) {
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingMasterAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background Visual Element */}
      <div 
        className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" 
        aria-hidden="true"
      >
        <div 
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#a6c1ee] to-[#7f8ff4] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
          }}
        />
      </div>

      <div className="flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md border border-gray-100"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4 cursor-pointer">
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                CampusMind AI
              </h1>
            </Link>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Create Master Admin</h2>
            <p className="text-lg text-gray-500">Set up the master administrator account</p>
            <p className="text-sm text-gray-400 mt-2">Only available if no master admin exists</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl"
            >
              {error}
              {error.includes('Master admin already exists') && (
                <p className="mt-2 text-sm">Redirecting to login page...</p>
              )}
            </motion.div>
          )}

          <AuthForm isLogin={false} onSubmit={handleSubmit} isLoading={isLoading} />

          {/* Master Admin Key Field */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Master Admin Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={masterAdminKey}
              onChange={(e) => setMasterAdminKey(e.target.value)}
              placeholder="Enter master admin secret key"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              disabled={isLoading}
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              This key is required to create a master admin account. Only authorized personnel have access to this key.
            </p>
          </div>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className={`text-${PRIMARY_COLOR}-600 hover:text-${PRIMARY_COLOR}-800 font-semibold transition-colors cursor-pointer`}>
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
