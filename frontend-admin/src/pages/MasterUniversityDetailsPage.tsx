// -----------------------------------------------------------------------------
// File: MasterUniversityDetailsPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Master admin page for viewing university details, admins, and students
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  masterGetUniversities,
  masterGetUniversityAdmins,
  masterGetStudents,
  masterGetUniversityAnalytics,
  masterActivateUniversityAdmin,
  masterDeactivateUniversityAdmin,
  masterActivateStudent,
  masterDeactivateStudent,
  type University,
  type UniversityAdmin,
  type Student,
  type UniversityAnalytics,
} from '../api/client';
import {
  Building2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  GraduationCap,
  Power,
  PowerOff,
  UserCheck,
  UserX,
  BarChart3,
  TrendingUp,
  BookOpen,
  Layers,
  XCircle,
} from 'lucide-react';

const MasterUniversityDetailsPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { universityId } = useParams<{ universityId: string }>();

  // State
  const [university, setUniversity] = useState<University | null>(null);
  const [universityAdmins, setUniversityAdmins] = useState<UniversityAdmin[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [analytics, setAnalytics] = useState<UniversityAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'admins' | 'students'>('analytics');
  const [togglingAdmin, setTogglingAdmin] = useState<number | null>(null);
  const [togglingStudent, setTogglingStudent] = useState<number | null>(null);

  // Check master admin access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'master_admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Load university and data
  useEffect(() => {
    if (user && user.role === 'master_admin' && universityId) {
      loadUniversity();
      loadUniversityAdmins();
      loadStudents();
      loadAnalytics();
    }
  }, [user, universityId]);

  const loadUniversity = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const universities = await masterGetUniversities();
      const found = universities.find(u => u.id === parseInt(universityId || '0'));
      if (found) {
        setUniversity(found);
      } else {
        setError('University not found');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load university');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUniversityAdmins = async () => {
    try {
      setError(null);
      const admins = await masterGetUniversityAdmins(parseInt(universityId || '0'));
      setUniversityAdmins(admins);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load university admins');
    }
  };

  const loadStudents = async () => {
    try {
      setError(null);
      const studentsData = await masterGetStudents(parseInt(universityId || '0'));
      setStudents(studentsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load students');
    }
  };

  const loadAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true);
      setError(null);
      const analyticsData = await masterGetUniversityAnalytics(parseInt(universityId || '0'));
      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load analytics');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleToggleAdmin = async (adminId: number, isActive: boolean) => {
    try {
      setTogglingAdmin(adminId);
      setError(null);
      setSuccess(null);
      
      if (isActive) {
        await masterDeactivateUniversityAdmin(adminId);
        setSuccess('University admin deactivated successfully');
      } else {
        await masterActivateUniversityAdmin(adminId);
        setSuccess('University admin activated successfully');
      }
      
      await loadUniversityAdmins();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update university admin status');
    } finally {
      setTogglingAdmin(null);
    }
  };

  const handleToggleStudent = async (studentId: number, isActive: boolean) => {
    try {
      setTogglingStudent(studentId);
      setError(null);
      setSuccess(null);
      
      if (isActive) {
        await masterDeactivateStudent(studentId);
        setSuccess('Student deactivated successfully');
      } else {
        await masterActivateStudent(studentId);
        setSuccess('Student activated successfully');
      }
      
      await loadStudents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update student status');
    } finally {
      setTogglingStudent(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'master_admin') {
    return null;
  }

  if (!university) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">{error || 'University not found'}</p>
            <button
              onClick={() => navigate('/master/universities')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Universities
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/master/universities')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Universities
          </button>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{university.name}</h1>
              <p className="text-gray-600 mt-1">
                {university.code} • {university.city}, {university.state}, {university.country}
              </p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
              university.is_active
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {university.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </motion.div>

        {/* Error/Success Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'admins'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                University Admins ({universityAdmins.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'students'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Students ({students.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
        >
          {activeTab === 'analytics' ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                University Analytics
              </h2>
              {isLoadingAnalytics ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading analytics...</p>
                </div>
              ) : analytics ? (
                <div className="space-y-6">
                  {/* University Status */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">University Status</h3>
                      {analytics.is_active ? (
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Created</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(analytics.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {analytics.code && (
                        <div>
                          <p className="text-gray-600">Code</p>
                          <p className="font-semibold text-gray-900">{analytics.code}</p>
                        </div>
                      )}
                      {(analytics.city || analytics.state || analytics.country) && (
                        <div>
                          <p className="text-gray-600">Location</p>
                          <p className="font-semibold text-gray-900">
                            {[analytics.city, analytics.state, analytics.country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Students Statistics */}
                    <div className="bg-white rounded-xl p-5 border-2 border-blue-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Students</p>
                          <p className="text-2xl font-bold text-gray-900">{analytics.total_students}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Active
                          </span>
                          <span className="font-semibold text-gray-900">{analytics.active_students}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            Inactive
                          </span>
                          <span className="font-semibold text-gray-900">{analytics.inactive_students}</span>
                        </div>
                      </div>
                    </div>

                    {/* University Admins Statistics */}
                    <div className="bg-white rounded-xl p-5 border-2 border-purple-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <UserCheck className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">University Admins</p>
                          <p className="text-2xl font-bold text-gray-900">{analytics.total_university_admins}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Active
                          </span>
                          <span className="font-semibold text-gray-900">{analytics.active_university_admins}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            Inactive
                          </span>
                          <span className="font-semibold text-gray-900">{analytics.inactive_university_admins}</span>
                        </div>
                      </div>
                    </div>

                    {/* Branches */}
                    <div className="bg-white rounded-xl p-5 border-2 border-indigo-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <GraduationCap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Branches</p>
                          <p className="text-2xl font-bold text-gray-900">{analytics.total_branches}</p>
                        </div>
                      </div>
                    </div>

                    {/* Semesters */}
                    <div className="bg-white rounded-xl p-5 border-2 border-orange-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Layers className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Semesters</p>
                          <p className="text-2xl font-bold text-gray-900">{analytics.total_semesters}</p>
                        </div>
                      </div>
                    </div>

                    {/* Subjects */}
                    <div className="bg-white rounded-xl p-5 border-2 border-green-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <BookOpen className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Subjects</p>
                          <p className="text-2xl font-bold text-gray-900">{analytics.total_subjects}</p>
                        </div>
                      </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-5 h-5" />
                        <h4 className="font-semibold">Quick Summary</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-100">Student Activity</span>
                          <span className="font-bold">
                            {analytics.total_students > 0
                              ? Math.round((analytics.active_students / analytics.total_students) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-100">Admin Activity</span>
                          <span className="font-bold">
                            {analytics.total_university_admins > 0
                              ? Math.round((analytics.active_university_admins / analytics.total_university_admins) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-100">Academic Structure</span>
                          <span className="font-bold">
                            {analytics.total_branches} Branch{analytics.total_branches !== 1 ? 'es' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p>No analytics data available.</p>
                </div>
              )}
            </div>
          ) : activeTab === 'admins' ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">University Admins</h2>
              {universityAdmins.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p>No university admins for this university yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {universityAdmins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{admin.name}</div>
                        <div className="text-sm text-gray-500 mt-1">{admin.email}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            admin.is_active
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleAdmin(admin.id, admin.is_active)}
                        disabled={togglingAdmin === admin.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                          admin.is_active
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        }`}
                        title={admin.is_active ? 'Deactivate admin' : 'Activate admin'}
                      >
                        {togglingAdmin === admin.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : admin.is_active ? (
                          <>
                            <PowerOff className="w-4 h-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Students</h2>
              {students.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p>No students for this university yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500 mt-1">{student.email}</div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            student.is_active
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {student.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {student.batch_year && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              Batch: {student.batch_year}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleStudent(student.id, student.is_active)}
                        disabled={togglingStudent === student.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                          student.is_active
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        }`}
                        title={student.is_active ? 'Deactivate student' : 'Activate student'}
                      >
                        {togglingStudent === student.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : student.is_active ? (
                          <>
                            <PowerOff className="w-4 h-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MasterUniversityDetailsPage;

