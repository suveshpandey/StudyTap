// -----------------------------------------------------------------------------
// File: AdminStudentsPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Admin page for managing students matching main.html UI/UX
// -----------------------------------------------------------------------------

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  adminGetStudents,
  adminUploadStudentsCSV,
  adminDeleteStudent,
  adminActivateStudent,
  adminDeactivateStudent,
  adminGetBranches,
  getUniversityDetails,
  type Student,
  type StudentBulkCreateResponse,
  type Branch,
} from '../api/client';
import AdminSidebar from '../components/AdminSidebar';
import {
  Users,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Power,
  PowerOff,
  Menu,
  Bell,
  Settings,
  X,
  Search,
  Filter,
  RotateCw,
  MoreVertical,
  UserCheck,
  Crown,
  TrendingUp,
  CloudUpload,
} from 'lucide-react';

interface StudentWithStats extends Student {
  semester?: string;
  questionsCount?: number;
  quizzesCount?: number;
  subscription?: 'Free' | 'Basic' | 'Premium' | 'Enterprise';
  lastActive?: string;
}

const AdminStudentsPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [batchYear, setBatchYear] = useState<string>('');
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<StudentBulkCreateResponse | null>(null);
  const [universityDetails, setUniversityDetails] = useState<any>(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState<number | null>(null);
  const [filterSession, setFilterSession] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All Status');
  
  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Calculate current semester from batch year (academic year starts in August)
  const calculateCurrentSemester = (batchYear: number | null): string => {
    if (!batchYear) return 'N/A';
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    // Academic year starts in August (month 8)
    let academicYear = currentYear;
    if (currentMonth < 8) {
      academicYear = currentYear - 1;
    }
    
    const yearsSinceStart = academicYear - batchYear;
    const semester = Math.min(Math.max(1, Math.floor(yearsSinceStart * 2) + (currentMonth >= 8 ? 1 : 0)), 8);
    
    return `${semester}${getOrdinalSuffix(semester)} Semester`;
  };

  const getOrdinalSuffix = (n: number): string => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Check admin access
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      if (user?.role !== 'university_admin') {
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

  // Load initial data
  useEffect(() => {
    if (user?.role === 'university_admin') {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load university details for stats
      const details = await getUniversityDetails();
      setUniversityDetails(details);

      // Load branches
      const branchesData = await adminGetBranches();
      setBranches(branchesData);

      // Load all students
      await loadStudents();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await adminGetStudents();
      
      // Enhance students with calculated data
      const enhancedStudents: StudentWithStats[] = data.map((student) => ({
        ...student,
        semester: calculateCurrentSemester(student.batch_year),
        questionsCount: 0, // Will be calculated from actual data if available
        quizzesCount: 0, // Mock for now
        subscription: 'Free' as const, // Mock for now
        lastActive: '2 hours ago', // Mock for now
      }));

      setStudents(enhancedStudents);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load students');
    }
  };

  // Get unique values for filters
  const availableBranches = branches.filter(branch => 
    students.some(s => s.branch_id === branch.id)
  );
  
  const availableSessions = Array.from(new Set(
    students
      .map(s => s.batch_year)
      .filter((year): year is number => year !== null)
  )).sort((a, b) => b - a); // Sort descending

  // Filter students
  const filteredStudents = students.filter((student) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (
        !student.name.toLowerCase().includes(query) &&
        !student.email.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Branch filter
    if (filterBranch !== null) {
      if (student.branch_id !== filterBranch) {
        return false;
      }
    }

    // Session (batch year) filter
    if (filterSession !== null) {
      if (student.batch_year !== filterSession) {
        return false;
      }
    }

    // Status filter
    if (filterStatus !== 'All Status') {
      if (filterStatus === 'Active' && !student.is_active) return false;
      if (filterStatus === 'Inactive' && student.is_active) return false;
      if (filterStatus === 'Suspended') return false; // We don't have suspended status
    }

    return true;
  });

  // Calculate stats
  const stats = {
    total: students.length,
    active: students.filter(s => s.is_active).length,
    premium: students.filter(s => s.subscription === 'Premium').length, // Mock
    totalQuestions: universityDetails?.questions_per_month || 0, // Use exact number from backend
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file');
      return;
    }

    if (!selectedBranchId) {
      setError('Please select a branch first');
      return;
    }

    if (!batchYear || isNaN(parseInt(batchYear)) || parseInt(batchYear) < 2020 || parseInt(batchYear) > 2100) {
      setError('Please enter a valid batch year (e.g., 2024, 2025)');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);
      setUploadResult(null);

      const result = await adminUploadStudentsCSV(file, selectedBranchId, parseInt(batchYear));
      setUploadResult(result);
      
      if (result.success > 0) {
        setSuccess(`Successfully created ${result.success} student(s)!`);
        await loadStudents();
        setTimeout(() => setSuccess(null), 5000);
        setUploadModalOpen(false);
        setSelectedBranchId(null);
        setBatchYear('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      
      if (result.errors.length > 0) {
        setError(`${result.errors.length} error(s) occurred. Check details below.`);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload CSV file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleActivateStudent = async (studentId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await adminActivateStudent(studentId);
      setSuccess('Student activated successfully!');
      await loadStudents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to activate student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateStudent = async (studentId: number) => {
    if (!window.confirm('Are you sure you want to deactivate this student? They will not be able to access the application.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await adminDeactivateStudent(studentId);
      setSuccess('Student deactivated successfully!');
      await loadStudents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to deactivate student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!window.confirm('Are you sure you want to delete this student? This will also delete all associated chats and data.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await adminDeleteStudent(studentId);
      setSuccess('Student deleted successfully!');
      await loadStudents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete student');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = 'name,email\nJohn Doe,john.doe@example.com\nJane Smith,jane.smith@example.com';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterBranch(null);
    setFilterSession(null);
    setFilterStatus('All Status');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'university_admin') {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {/* Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        totalStudents={universityDetails?.total_students}
        totalDocuments={universityDetails?.total_documents}
        totalQuestions={universityDetails?.questions_per_month}
        totalSubjects={universityDetails?.total_subjects}
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
                <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
                <p className="text-sm text-gray-500">Manage and monitor registered students</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Add Student</span>
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
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

            {/* Stats Section */}
            <section className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</h3>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">32 new this month</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full">Active</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.active}</h3>
                  <p className="text-sm text-gray-600">Active Students</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% activity rate
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Crown className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Premium</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.premium}</h3>
                  <p className="text-sm text-gray-600">Premium Users</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      {stats.total > 0 ? Math.round((stats.premium / stats.total) * 100) : 0}% conversion
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">+8%</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalQuestions.toLocaleString()}</h3>
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Avg. {stats.total > 0 ? Math.round(stats.totalQuestions / stats.total) : 0} per student
                    </p>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Filters Section */}
            <section className="mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      />
                      <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                    <select
                      value={filterBranch || ''}
                      onChange={(e) => setFilterBranch(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    >
                      <option value="">All Branches</option>
                      {availableBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
                    <select
                      value={filterSession || ''}
                      onChange={(e) => setFilterSession(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    >
                      <option value="">All Sessions</option>
                      {availableSessions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    >
                      <option>All Status</option>
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border border-gray-200">
                      <Filter className="w-4 h-4" />
                      <span>More Filters</span>
                    </button>
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-2"
                    >
                      <RotateCw className="w-4 h-4" />
                      Reset Filters
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{filteredStudents.length}</span> students
                  </div>
                </div>
              </div>
            </section>

            {/* Students Table Section */}
            <section className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-900">Student List</h3>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg">All</button>
                      <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-all">Active</button>
                      <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-all">Premium</button>
                      <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-all">Free</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left">
                          <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Student Name</span>
                            <Filter className="w-3 h-3 text-gray-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Semester</span>
                            <Filter className="w-3 h-3 text-gray-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Questions</span>
                            <Filter className="w-3 h-3 text-gray-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Quizzes</span>
                            <Filter className="w-3 h-3 text-gray-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subscription</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Last Active</span>
                            <Filter className="w-3 h-3 text-gray-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {isLoading ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                            No students found
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50 transition-all">
                            <td className="px-6 py-4">
                              <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full border-2 border-indigo-200 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-indigo-600">
                                    {student.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{student.name}</p>
                                  <p className="text-xs text-gray-500">ID: STU-{student.batch_year}-{String(student.id).padStart(3, '0')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700">{student.email}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700">{student.semester || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-gray-900">{student.questionsCount || 0}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-gray-900">{student.quizzesCount || 0}</span>
                            </td>
                            <td className="px-6 py-4">
                              {student.subscription === 'Premium' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                                  <Crown className="w-3 h-3" />
                                  Premium
                                </span>
                              )}
                              {student.subscription === 'Basic' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                  Basic
                                </span>
                              )}
                              {student.subscription === 'Free' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                                  Free
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">{student.lastActive || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {student.is_active ? (
                                  <button
                                    onClick={() => handleDeactivateStudent(student.id)}
                                    className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                    title="Deactivate"
                                  >
                                    <PowerOff className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleActivateStudent(student.id)}
                                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    title="Activate"
                                  >
                                    <Power className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredStudents.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-semibold text-gray-900">1-{Math.min(20, filteredStudents.length)}</span> of{' '}
                      <span className="font-semibold text-gray-900">{filteredStudents.length}</span> students
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                      >
                        Previous
                      </button>
                      <button className="w-10 h-10 text-sm font-medium text-white bg-indigo-600 rounded-lg">1</button>
                      <button className="w-10 h-10 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-all">2</button>
                      <button className="w-10 h-10 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-all">3</button>
                      <span className="px-2 text-gray-500">...</span>
                      <button className="w-10 h-10 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-all">31</button>
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
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
            <div className="text-sm text-gray-600">© 2024 StudyTap AI. All rights reserved.</div>
          </div>
        </footer>
      </main>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setUploadModalOpen(false);
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-indigo-600 px-8 py-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">Upload Students CSV</h3>
                <p className="text-sm text-indigo-100">Bulk import students from Excel/CSV file</p>
              </div>
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setSelectedBranchId(null);
                  setBatchYear('');
                  setUploadResult(null);
                  setError(null);
                  setSuccess(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {/* Branch Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedBranchId || ''}
                    onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    disabled={isUploading}
                  >
                    <option value="">-- Select Branch --</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Year Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={batchYear}
                    onChange={(e) => setBatchYear(e.target.value)}
                    placeholder="e.g., 2024, 2025"
                    min="2020"
                    max="2100"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    disabled={isUploading}
                  />
                  <p className="mt-1 text-xs text-gray-500">Enter the batch year (e.g., 2024, 2025)</p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excel/CSV File <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <CloudUpload className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Drag & Drop CSV/Excel File</h4>
                    <p className="text-gray-600 mb-4">or click to browse from your computer</p>
                    <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all">
                      Browse Files
                    </button>
                    <p className="text-xs text-gray-500 mt-4">Supports .csv, .xlsx, .xls files</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading || !selectedBranchId || !batchYear}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Excel/CSV format: name, email (only these two columns required)
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={downloadCSVTemplate}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>

                {isUploading && (
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Uploading and processing file...</span>
                  </div>
                )}
              </div>

              {/* Upload Results */}
              {uploadResult && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Upload Results
                  </h3>

                  {uploadResult.success > 0 && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 font-semibold mb-2">
                        Successfully created {uploadResult.success} student(s):
                      </p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {uploadResult.students.map((student, idx) => (
                          <div key={idx} className="text-sm text-gray-700 bg-white p-2 rounded border">
                            <div className="font-medium">{student.name}</div>
                            <div className="text-xs text-gray-500">Email: {student.email}</div>
                            <div className="text-xs text-gray-500">Password: {student.password}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadResult.errors.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 font-semibold mb-2">
                        Errors ({uploadResult.errors.length}):
                      </p>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {uploadResult.errors.map((error, idx) => (
                          <div key={idx} className="text-sm text-red-600">{error}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentsPage;
