// -----------------------------------------------------------------------------
// File: MasterStudentsPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Master admin page for managing students
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  masterGetUniversities,
  masterGetStudents,
  masterActivateStudent,
  masterDeactivateStudent,
  masterDeleteStudent,
  type University,
  type Student,
} from '../api/client';
import {
  GraduationCap,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Power,
  PowerOff,
  Menu,
  Bell,
  Settings,
  Search,
} from 'lucide-react';
import MasterSidebar from '../components/MasterSidebar';

// Helper function to extract error message from FastAPI error responses
const extractErrorMessage = (err: any): string => {
  if (!err.response) {
    return 'An unexpected error occurred';
  }
  
  const data = err.response.data;
  
  // Handle 422 validation errors (array format)
  if (err.response.status === 422 && Array.isArray(data.detail)) {
    const errors = data.detail.map((e: any) => {
      const field = e.loc?.slice(-1)[0] || 'field';
      return `${field}: ${e.msg}`;
    });
    return errors.join(', ');
  }
  
  // Handle standard error with detail string
  if (data.detail) {
    return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
  }
  
  // Fallback
  return err.response.statusText || 'An error occurred';
};

const MasterStudentsPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [togglingStudent, setTogglingStudent] = useState<number | null>(null);
  
  // Filter state for students
  const [selectedUniversityFilter, setSelectedUniversityFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Check master admin access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'master_admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Load universities
  useEffect(() => {
    if (user && user.role === 'master_admin') {
      loadUniversities();
    }
  }, [user]);

  // Load students
  useEffect(() => {
    if (user && user.role === 'master_admin') {
      loadStudents();
    }
  }, [user, selectedUniversityFilter]);

  const loadUniversities = async () => {
    try {
      const data = await masterGetUniversities();
      setUniversities(data);
    } catch (err: any) {
      console.error('Failed to load universities:', err);
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      setError(null);
      const data = await masterGetStudents(selectedUniversityFilter || undefined);
      setStudents(data);
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to load students');
    } finally {
      setLoadingStudents(false);
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
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to update student status');
    } finally {
      setTogglingStudent(null);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!confirm('Are you sure you want to delete this student? This will also delete all associated chats and data. This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await masterDeleteStudent(studentId);
      setSuccess('Student deleted successfully');
      await loadStudents();
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to delete student');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user || user.role !== 'master_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {/* Sidebar */}
      <MasterSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        totalStudents={students.length}
        searchPlaceholder="Search students..."
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Students</h2>
                <p className="text-sm text-gray-500">View and manage all students across universities</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              Manage Students
            </h1>
            <p className="mt-2 text-gray-600">View and manage all students across universities</p>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{success}</span>
                </div>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-green-500 hover:text-green-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Students List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Students</h2>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search Bar */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <label htmlFor="universityFilter" className="text-sm font-medium text-gray-700">
                  Filter by University:
                </label>
                <select
                  id="universityFilter"
                  value={selectedUniversityFilter || ''}
                  onChange={(e) => setSelectedUniversityFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer bg-white"
                >
                  <option value="">All Universities</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {loadingStudents ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No students found.
              </div>
            ) : (
              <div className="space-y-4">
                {students
                  .filter((student) => {
                    // Apply search filter
                    if (searchQuery.trim()) {
                      const query = searchQuery.toLowerCase();
                      if (
                        !student.name.toLowerCase().includes(query) &&
                        !student.email.toLowerCase().includes(query)
                      ) {
                        return false;
                      }
                    }
                    return true;
                  })
                  .map((student) => {
                  const university = universities.find(u => u.id === student.university_id);
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                student.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {student.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600 space-y-1">
                            <div>Email: {student.email}</div>
                            {university && <div>University: {university.name}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStudent(student.id, student.is_active)}
                            disabled={togglingStudent === student.id}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${
                              student.is_active
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={student.is_active ? 'Deactivate Student' : 'Activate Student'}
                          >
                            {togglingStudent === student.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : student.is_active ? (
                              <PowerOff className="w-5 h-5" />
                            ) : (
                              <Power className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            disabled={isLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-indigo-600 transition-all">Terms of Service</a>
              <a href="#" className="hover:text-indigo-600 transition-all">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-600 transition-all">Help Center</a>
              <a href="#" className="hover:text-indigo-600 transition-all">Contact Support</a>
            </div>
            <div className="text-sm text-gray-600">
              © 2024 StudyTap AI. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default MasterStudentsPage;

