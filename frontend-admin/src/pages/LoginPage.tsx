// -----------------------------------------------------------------------------
// File: LoginPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: User login page with authentication form
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Users, Shield, Mail, Lock, ShieldCheck, GraduationCap, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'master_admin' | 'university_admin'>('university_admin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login', formData);
      const userRole = response.data.user.role;
      
      // Only allow admins to login from admin frontend
      if (userRole === 'student') {
        setError('Students cannot login from the admin portal. Please use the student portal.');
        setIsLoading(false);
        return;
      }
      
      // Validate that the logged-in user matches the selected login type
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
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-50/50 flex items-center justify-center px-4 py-12">
      {/* Background Visual Element */}
      <div 
        className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" 
        aria-hidden="true"
      >
        <div 
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-300 to-indigo-300 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header Section with Gradient Background */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-8 py-10 text-center">
            <Link to="/" className="inline-block mb-4">
              <div className="flex items-center justify-center gap-2">
                <div className="p-2 bg-white/20 rounded-xl">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  StudyTap
                </h1>
              </div>
            </Link>
            <h2 className="text-2xl font-bold text-white mb-2">Admin Portal</h2>
            <p className="text-blue-100 text-sm">Sign in to manage your university</p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            {/* Role Selection Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex gap-1">
                <button
                  type="button"
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
                  type="button"
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
                className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 pointer-events-none z-10" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3.5 pl-12 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 pointer-events-none z-10" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3.5 pl-12 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 
                text-white font-bold text-base rounded-xl shadow-lg
                hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
                flex items-center justify-center gap-2 transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <span className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Signing you in...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </motion.form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
