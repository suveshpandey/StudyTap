// -----------------------------------------------------------------------------
// File: SignupPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: User registration page with signup form
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthForm from '../components/AuthForm';
import apiClient from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { getUniversities, type University } from '../api/client';
import { Loader2 } from 'lucide-react';

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | null>(null);
  const PRIMARY_COLOR = 'blue';

  // Load universities on mount
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setIsLoadingUniversities(true);
        const data = await getUniversities();
        setUniversities(data);
      } catch (err: any) {
        setError('Failed to load universities. Please refresh the page.');
      } finally {
        setIsLoadingUniversities(false);
      }
    };
    loadUniversities();
  }, []);

  const handleSubmit = async (data: { name?: string; email: string; password: string }) => {
    setIsLoading(true);
    setError('');

    if (!data.name) {
      setError('Name is required');
      setIsLoading(false);
      return;
    }

    if (!selectedUniversityId) {
      setError('Please select a university');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/auth/signup', {
        name: data.name,
        email: data.email,
        password: data.password,
        university_id: selectedUniversityId,
      });
      login(response.data.access_token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
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
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Create Account</h2>
            <p className="text-lg text-gray-500">Join us and start learning with AI</p>
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

          {/* University Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              University <span className="text-red-500">*</span>
            </label>
            {isLoadingUniversities ? (
              <div className="flex items-center gap-2 text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading universities...</span>
              </div>
            ) : (
              <select
                required
                value={selectedUniversityId || ''}
                onChange={(e) => setSelectedUniversityId(parseInt(e.target.value) || null)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select your university</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                    {uni.code && ` (${uni.code})`}
                    {uni.city && ` - ${uni.city}`}
                  </option>
                ))}
              </select>
            )}
            {universities.length === 0 && !isLoadingUniversities && (
              <p className="mt-2 text-sm text-gray-500">
                No universities available. Please contact your administrator.
              </p>
            )}
          </div>

          <AuthForm isLogin={false} onSubmit={handleSubmit} isLoading={isLoading} />

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className={`text-${PRIMARY_COLOR}-600 hover:text-${PRIMARY_COLOR}-800 font-semibold transition-colors`}>
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
