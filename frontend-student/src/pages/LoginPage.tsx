// -----------------------------------------------------------------------------
// File: LoginPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: User login page with authentication form
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthForm from '../components/AuthForm';
import apiClient from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Users, GraduationCap, Shield } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<'master_admin' | 'university_admin' | 'student'>('student');
  const PRIMARY_COLOR = 'blue';

  const handleSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login', data);
      const userRole = response.data.user.role;
      
      // Validate that the logged-in user matches the selected login type
      if (loginType === 'student' && userRole !== 'student') {
        setError('This email is not registered as a student. Please select the correct login type.');
        setIsLoading(false);
        return;
      }
      
      if (loginType === 'university_admin' && userRole !== 'university_admin') {
        setError('This email is not registered as a university admin. Please select the correct login type.');
        setIsLoading(false);
        return;
      }
      
      if (loginType === 'master_admin' && userRole !== 'master_admin') {
        setError('This email is not registered as a master admin. Please select the correct login type.');
        setIsLoading(false);
        return;
      }
      
      login(response.data.access_token, response.data.user);
      
      // Redirect based on role
      if (userRole === 'master_admin') {
        navigate('/master/universities', { replace: true });
      } else if (userRole === 'university_admin') {
        navigate('/admin/academics', { replace: true });
      } else if (userRole === 'student') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            <Link to="/" className="inline-block mb-4">
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                CampusMind AI
              </h1>
            </Link>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-lg text-gray-500">Sign in to continue your learning journey</p>
          </div>

          {/* Role Selection Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex gap-1">
              <button
                onClick={() => setLoginType('student')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 font-medium text-xs border-b-2 transition-colors ${
                  loginType === 'student'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Student
              </button>
              <button
                onClick={() => setLoginType('university_admin')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 font-medium text-xs border-b-2 transition-colors cursor-pointer ${
                  loginType === 'university_admin'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                University Admin
              </button>
              <button
                onClick={() => setLoginType('master_admin')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 font-medium text-xs border-b-2 transition-colors cursor-pointer ${
                  loginType === 'master_admin'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Master Admin
              </button>
            </nav>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl"
            >
              {error}
            </motion.div>
          )}

          <AuthForm isLogin={true} onSubmit={handleSubmit} isLoading={isLoading} />
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
