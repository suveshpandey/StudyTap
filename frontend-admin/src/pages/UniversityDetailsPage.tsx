// -----------------------------------------------------------------------------
// File: UniversityDetailsPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Page for university admin to view their university details and statistics
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { getUniversityDetails, type UniversityDetails } from '../api/client';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';

const UniversityDetailsPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [universityDetails, setUniversityDetails] = useState<UniversityDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check admin access
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
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  // Load university details
  useEffect(() => {
    const loadDetails = async () => {
      if (user?.role === 'university_admin') {
        try {
          setIsLoading(true);
          setError(null);
          const data = await getUniversityDetails();
          setUniversityDetails(data);
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Failed to load university details');
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadDetails();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-blue-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-medium">Loading university details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Error</h2>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (!universityDetails) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const stats = [
    {
      label: 'Total Students',
      value: universityDetails.total_students,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Active Students',
      value: universityDetails.active_students,
      icon: CheckCircle2,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    {
      label: 'Inactive Students',
      value: universityDetails.inactive_students,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
    },
    {
      label: 'Branches',
      value: universityDetails.total_branches,
      icon: GraduationCap,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
    },
    {
      label: 'Semesters',
      value: universityDetails.total_semesters,
      icon: Layers,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
    },
    {
      label: 'Subjects',
      value: universityDetails.total_subjects,
      icon: BookOpen,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-50/50 py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">University Details</h1>
              <p className="text-gray-600 mt-1">View your university information and statistics</p>
            </div>
          </div>
        </motion.div>

        {/* University Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{universityDetails.name}</h2>
                {universityDetails.is_active ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold border border-green-200">
                    <CheckCircle2 className="w-4 h-4" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-semibold border border-red-200">
                    <XCircle className="w-4 h-4" />
                    Inactive
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {universityDetails.code && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">Code:</span>
                    <span className="text-gray-900">{universityDetails.code}</span>
                  </div>
                )}
                
                {(universityDetails.city || universityDetails.state || universityDetails.country) && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-5 h-5 mt-0.5 text-gray-400" />
                    <div>
                      {[universityDetails.city, universityDetails.state, universityDetails.country]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">Created:</span>
                  <span>{formatDate(universityDetails.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 ${stat.borderColor} hover:shadow-xl transition-all`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                <div className="mb-2">
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6" />
            <h3 className="text-xl font-bold">Quick Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-purple-200 text-sm mb-1">Student Activity</p>
              <p className="text-2xl font-bold">
                {universityDetails.total_students > 0
                  ? Math.round((universityDetails.active_students / universityDetails.total_students) * 100)
                  : 0}% Active
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Academic Structure</p>
              <p className="text-2xl font-bold">
                {universityDetails.total_branches} Branch{universityDetails.total_branches !== 1 ? 'es' : ''}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Content Coverage</p>
              <p className="text-2xl font-bold">
                {universityDetails.total_subjects} Subject{universityDetails.total_subjects !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UniversityDetailsPage;


