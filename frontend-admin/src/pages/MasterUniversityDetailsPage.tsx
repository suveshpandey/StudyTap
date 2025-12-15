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
  masterDeleteStudent,
  masterDeleteUniversityAdmin,
  masterGetUniversityBranches,
  masterCreateUniversityAdmin,
  type University,
  type UniversityAdmin,
  type Student,
  type UniversityAnalytics,
  type Branch,
  type UniversityAdminCreateResponse,
} from '../api/client';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  GraduationCap,
  Power,
  PowerOff,
  BarChart3,
  TrendingUp,
  BookOpen,
  Layers,
  XCircle,
  Search,
  X,
  Menu,
  Bell,
  Settings,
  Trash2,
  Filter,
  Plus,
  Copy,
  Check,
} from 'lucide-react';
import MasterSidebar from '../components/MasterSidebar';

const MasterUniversityDetailsPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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
  const [deletingAdmin, setDeletingAdmin] = useState<number | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBatch, setFilterBatch] = useState<number | null>(null);
  const [filterBranch, setFilterBranch] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [createAdminName, setCreateAdminName] = useState('');
  const [createAdminEmail, setCreateAdminEmail] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createdAdminPassword, setCreatedAdminPassword] = useState<{ email: string; password: string } | null>(null);

  // Check master admin access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'master_admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Load university and data
  useEffect(() => {
    if (user && user.role === 'master_admin' && id) {
      loadUniversity();
      loadUniversityAdmins();
      loadStudents();
      loadAnalytics();
      loadBranches();
    }
  }, [user, id]);

  const loadBranches = async () => {
    if (!id) {
      setBranches([]);
      return;
    }
    try {
      const universityId = parseInt(id);
      const branchesData = await masterGetUniversityBranches(universityId);
      // Branches are already filtered and sorted by the API
      setBranches(branchesData);
    } catch (err: any) {
      console.error('Failed to load branches:', err);
      setBranches([]);
    }
  };

  const loadUniversity = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const universities = await masterGetUniversities();
      const found = universities.find(u => u.id === parseInt(id || '0'));
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
      const admins = await masterGetUniversityAdmins(parseInt(id || '0'));
      setUniversityAdmins(admins);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load university admins');
    }
  };

  const loadStudents = async () => {
    try {
      setError(null);
      const studentsData = await masterGetStudents(parseInt(id || '0'));
      setStudents(studentsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load students');
    }
  };

  const loadAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true);
      setError(null);
      const analyticsData = await masterGetUniversityAnalytics(parseInt(id || '0'));
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

  const handleDeleteStudent = async (studentId: number, studentName: string) => {
    if (!window.confirm(`Are you sure you want to delete student "${studentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingStudent(studentId);
      setError(null);
      setSuccess(null);
      
      await masterDeleteStudent(studentId);
      setSuccess('Student deleted successfully');
      
      await loadStudents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete student');
    } finally {
      setDeletingStudent(null);
    }
  };

  const handleDeleteAdmin = async (adminId: number, adminName: string) => {
    if (!window.confirm(`Are you sure you want to delete university admin "${adminName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingAdmin(adminId);
      setError(null);
      setSuccess(null);
      
      await masterDeleteUniversityAdmin(adminId);
      setSuccess('University admin deleted successfully');
      
      await loadUniversityAdmins();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete university admin');
    } finally {
      setDeletingAdmin(null);
    }
  };

  const handleCreateAdmin = async () => {
    if (!id) return;
    
    if (!createAdminName.trim() || !createAdminEmail.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createAdminEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setCreatingAdmin(true);
      setError(null);
      setSuccess(null);
      
      const response = await masterCreateUniversityAdmin(parseInt(id), {
        name: createAdminName.trim(),
        email: createAdminEmail.trim(),
      });
      
      // Store the generated password
      setCreatedAdminPassword({
        email: response.email,
        password: response.plain_password,
      });
      
      setSuccess('University admin created successfully');
      setCreateAdminName('');
      setCreateAdminEmail('');
      setShowCreateAdminModal(false);
      
      await loadUniversityAdmins(); // Reload admins after creation
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create university admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const copyPasswordToClipboard = (password: string) => {
    navigator.clipboard.writeText(password);
    setSuccess('Password copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  // Filter data based on search
  const filteredAdmins = universityAdmins.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = filterBatch === null || student.batch_year === filterBatch;
    const matchesBranch = filterBranch === null || student.branch_id === filterBranch;
    return matchesSearch && matchesBatch && matchesBranch;
  });

  // Get unique batch years from students
  const availableBatches = Array.from(new Set(students.map(s => s.batch_year).filter(Boolean))).sort((a, b) => (b || 0) - (a || 0));
  // Use all branches for the university (already filtered in loadBranches)
  // Sort branches by name for better UX
  const availableBranches = [...branches].sort((a, b) => a.name.localeCompare(b.name));

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'master_admin') {
    return null;
  }

  if (!university) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || 'University not found'}</p>
          <button
            onClick={() => navigate('/master/universities')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Universities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {/* Sidebar */}
      <MasterSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        searchPlaceholder="Search..."
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
              <button
                onClick={() => navigate('/master/universities')}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{university.name}</h2>
                <p className="text-sm text-gray-500">
                  {university.code && `${university.code} • `}
                  {[university.city, university.state, university.country].filter(Boolean).join(', ') || 'University Details'}
                </p>
              </div>
              <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                university.is_active
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {university.is_active ? 'Active' : 'Inactive'}
              </span>
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
            {/* Error/Success Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700"
              >
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{success}</span>
                <button
                  onClick={() => setSuccess(null)}
                  className="ml-auto text-green-500 hover:text-green-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* Tabs */}
            <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-1">
              <nav className="flex gap-2">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex-1 px-4 py-3 font-medium text-sm rounded-lg transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('admins')}
                  className={`flex-1 px-4 py-3 font-medium text-sm rounded-lg transition-all ${
                    activeTab === 'admins'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    University Admins ({universityAdmins.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`flex-1 px-4 py-3 font-medium text-sm rounded-lg transition-all ${
                    activeTab === 'students'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
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
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              {activeTab === 'analytics' ? (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    University Analytics
                  </h2>
                  {isLoadingAnalytics ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Loading analytics...</p>
                    </div>
                  ) : analytics ? (
                    <div className="space-y-6">
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
                              <Users className="w-5 h-5 text-purple-600" />
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

                        {/* Documents & Questions */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-5 text-white shadow-lg">
                          <div className="flex items-center gap-3 mb-4">
                            <TrendingUp className="w-5 h-5" />
                            <h4 className="font-semibold">Quick Summary</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-indigo-100">Total Documents</span>
                              <span className="font-bold">{analytics.total_documents}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-indigo-100">Questions/Month</span>
                              <span className="font-bold">{analytics.questions_per_month}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-indigo-100">Student Activity</span>
                              <span className="font-bold">
                                {analytics.total_students > 0
                                  ? Math.round((analytics.active_students / analytics.total_students) * 100)
                                  : 0}%
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
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">University Admins</h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowCreateAdminModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Create Admin
                      </button>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search admins..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Display generated password if available */}
                  {createdAdminPassword && (
                    <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-green-900">Admin Created Successfully</h3>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            <span className="font-medium">Email:</span> {createdAdminPassword.email}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700 font-medium">Generated Password:</span>
                            <code className="px-3 py-1.5 bg-white border border-green-300 rounded-md text-sm font-mono font-bold text-green-700">
                              {createdAdminPassword.password}
                            </code>
                            <button
                              onClick={() => copyPasswordToClipboard(createdAdminPassword.password)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-all"
                              title="Copy password"
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => setCreatedAdminPassword(null)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Dismiss"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                  {filteredAdmins.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p>{searchQuery ? 'No admins match your search.' : 'No university admins for this university yet.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAdmins.map((admin) => (
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
                          <div className="flex items-center gap-2">
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
                            <button
                              onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                              disabled={deletingAdmin === admin.id}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                              title="Delete admin"
                            >
                              {deletingAdmin === admin.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Students</h2>
                    <div className="flex items-center gap-3">
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filters:</span>
                    <select
                      value={filterBatch || ''}
                      onChange={(e) => setFilterBatch(e.target.value ? parseInt(e.target.value) : null)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    >
                      <option value="">All Batches</option>
                      {availableBatches.map((batch) => (
                        <option key={batch} value={batch}>
                          Batch {batch}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filterBranch || ''}
                      onChange={(e) => setFilterBranch(e.target.value ? parseInt(e.target.value) : null)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    >
                      <option value="">All Branches</option>
                      {availableBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    {(filterBatch !== null || filterBranch !== null) && (
                      <button
                        onClick={() => {
                          setFilterBatch(null);
                          setFilterBranch(null);
                        }}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Clear Filters
                      </button>
                    )}
                  </div>
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p>{searchQuery ? 'No students match your search.' : 'No students for this university yet.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {filteredStudents.map((student) => (
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
                              {student.branch_id && (
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                  {branches.find(b => b.id === student.branch_id)?.name || 'Branch'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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
                            <button
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              disabled={deletingStudent === student.id}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                              title="Delete student"
                            >
                              {deletingStudent === student.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Create Admin Modal */}
        {showCreateAdminModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create University Admin</h3>
                <button
                  onClick={() => {
                    setShowCreateAdminModal(false);
                    setCreateAdminName('');
                    setCreateAdminEmail('');
                    setError(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={createAdminName}
                    onChange={(e) => setCreateAdminName(e.target.value)}
                    placeholder="Enter admin name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    disabled={creatingAdmin}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={createAdminEmail}
                    onChange={(e) => setCreateAdminEmail(e.target.value)}
                    placeholder="Enter admin email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    disabled={creatingAdmin}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    A random 8-character password will be generated automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleCreateAdmin}
                  disabled={creatingAdmin || !createAdminName.trim() || !createAdminEmail.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingAdmin ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Admin
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCreateAdminModal(false);
                    setCreateAdminName('');
                    setCreateAdminEmail('');
                    setError(null);
                  }}
                  disabled={creatingAdmin}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

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

export default MasterUniversityDetailsPage;
