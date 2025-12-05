// -----------------------------------------------------------------------------
// File: MasterUniversitiesPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Master admin page for managing universities and assigning university admins
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  masterGetUniversities,
  masterCreateUniversity,
  masterDeleteUniversity,
  masterActivateUniversity,
  masterDeactivateUniversity,
  masterCreateUniversityAdmin,
  masterGetUniversityAdmins,
  masterActivateUniversityAdmin,
  masterDeactivateUniversityAdmin,
  masterDeleteUniversityAdmin,
  masterGetStudents,
  masterActivateStudent,
  masterDeactivateStudent,
  masterDeleteStudent,
  type University,
  type UniversityAdmin,
  type Student,
} from '../api/client';
import {
  Building2,
  Plus,
  Trash2,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Power,
  PowerOff,
  Copy,
  Users,
  GraduationCap,
  Eye,
} from 'lucide-react';

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

const MasterUniversitiesPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [newUniversity, setNewUniversity] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    country: '',
  });

  // Create admin states
  const [showCreateAdminForm, setShowCreateAdminForm] = useState<{ [key: number]: boolean }>({});
  const [createAdminData, setCreateAdminData] = useState<{ [key: number]: { name: string; email: string; password: string } }>({});
  const [creatingAdmin, setCreatingAdmin] = useState<number | null>(null);
  const [createdAdminInfo, setCreatedAdminInfo] = useState<{ [key: number]: { email: string; password: string; universityName: string } }>({});
  const [togglingUniversity, setTogglingUniversity] = useState<number | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'universities' | 'admins' | 'students'>('universities');
  
  // University admins and students state
  const [universityAdmins, setUniversityAdmins] = useState<UniversityAdmin[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [togglingAdmin, setTogglingAdmin] = useState<number | null>(null);
  const [togglingStudent, setTogglingStudent] = useState<number | null>(null);
  
  // Filter state for students
  const [selectedUniversityFilter, setSelectedUniversityFilter] = useState<number | null>(null);

  // Check master admin access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'master_admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Load data based on active tab
  useEffect(() => {
    if (user && user.role === 'master_admin') {
      if (activeTab === 'universities') {
        loadUniversities();
      } else if (activeTab === 'admins') {
        loadUniversityAdmins();
      } else if (activeTab === 'students') {
        // Load universities for the filter dropdown if not already loaded
        if (universities.length === 0) {
          loadUniversities();
        }
        loadStudents();
      }
    }
  }, [user, activeTab]);

  // Reload students when filter changes
  useEffect(() => {
    if (user && user.role === 'master_admin' && activeTab === 'students') {
      loadStudents();
    }
  }, [selectedUniversityFilter]);

  const loadUniversities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await masterGetUniversities();
      setUniversities(data);
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to load universities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const data: any = { name: newUniversity.name };
      if (newUniversity.code) data.code = newUniversity.code;
      if (newUniversity.city) data.city = newUniversity.city;
      if (newUniversity.state) data.state = newUniversity.state;
      if (newUniversity.country) data.country = newUniversity.country;

      await masterCreateUniversity(data);
      setSuccess('University created successfully');
      setNewUniversity({ name: '', code: '', city: '', state: '', country: '' });
      await loadUniversities();
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to create university');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUniversity = async (id: number) => {
    if (!confirm('Are you sure you want to delete this university? This will also delete all students and university admins associated with this university. This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await masterDeleteUniversity(id);
      setSuccess('University deleted successfully');
      await loadUniversities();
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to delete university');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUniversity = async (universityId: number, isActive: boolean) => {
    try {
      setTogglingUniversity(universityId);
      setError(null);
      setSuccess(null);
      if (isActive) {
        await masterDeactivateUniversity(universityId);
        setSuccess('University deactivated successfully');
      } else {
        await masterActivateUniversity(universityId);
        setSuccess('University activated successfully');
      }
      await loadUniversities();
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to update university status');
    } finally {
      setTogglingUniversity(null);
    }
  };

  const handleCreateAdmin = async (universityId: number) => {
    const adminData = createAdminData[universityId];
    if (!adminData || !adminData.name.trim() || !adminData.email.trim()) {
      setError('Please fill in name and email');
      return;
    }

    try {
      setCreatingAdmin(universityId);
      setError(null);
      setSuccess(null);
      // Backend generates password, so we send a dummy value
      const response = await masterCreateUniversityAdmin(universityId, {
        name: adminData.name.trim(),
        email: adminData.email.trim(),
        password: 'dummy', // Backend will generate its own password
      });
      
      const university = universities.find(u => u.id === universityId);
      // Use the password returned from backend
      setCreatedAdminInfo({
        ...createdAdminInfo,
        [universityId]: {
          email: adminData.email.trim(),
          password: response.plain_password || 'Generated password',
          universityName: university?.name || 'University',
        },
      });
      
      // Clear form and hide it
      setCreateAdminData({ ...createAdminData, [universityId]: { name: '', email: '', password: 'dummy' } });
      setShowCreateAdminForm({ ...showCreateAdminForm, [universityId]: false });
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to create admin');
    } finally {
      setCreatingAdmin(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const loadUniversityAdmins = async () => {
    try {
      setLoadingAdmins(true);
      setError(null);
      const data = await masterGetUniversityAdmins();
      setUniversityAdmins(data);
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to load university admins');
    } finally {
      setLoadingAdmins(false);
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
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to update admin status');
    } finally {
      setTogglingAdmin(null);
    }
  };

  const handleDeleteAdmin = async (adminId: number) => {
    if (!confirm('Are you sure you want to delete this university admin? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await masterDeleteUniversityAdmin(adminId);
      setSuccess('University admin deleted successfully');
      await loadUniversityAdmins();
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to delete admin');
    } finally {
      setIsLoading(false);
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
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              Master Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">Manage universities, university admins, and students</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('universities')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'universities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Universities
                </div>
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'admins'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  University Admins
                </div>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Students
                </div>
              </button>
            </nav>
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
                  className="text-green-500 hover:text-green-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Universities Tab */}
          {activeTab === 'universities' && (
            <>
          {/* Create University Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Create New University
            </h2>
            <form onSubmit={handleCreateUniversity} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUniversity.name}
                    onChange={(e) =>
                      setNewUniversity({ ...newUniversity, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="University Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={newUniversity.code}
                    onChange={(e) =>
                      setNewUniversity({ ...newUniversity, code: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="University Code (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newUniversity.city}
                    onChange={(e) =>
                      setNewUniversity({ ...newUniversity, city: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="City (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newUniversity.state}
                    onChange={(e) =>
                      setNewUniversity({ ...newUniversity, state: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="State (optional)"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={newUniversity.country}
                    onChange={(e) =>
                      setNewUniversity({ ...newUniversity, country: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Country (optional)"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create University
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Universities List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Universities</h2>
            {isLoading && universities.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : universities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No universities found. Create one to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {universities.map((uni) => (
                  <motion.div
                    key={uni.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{uni.name}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              uni.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {uni.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 space-y-1">
                          {uni.code && <div>Code: {uni.code}</div>}
                          {(uni.city || uni.state || uni.country) && (
                            <div>
                              {[uni.city, uni.state, uni.country].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleUniversity(uni.id, uni.is_active)}
                          disabled={togglingUniversity === uni.id || isLoading}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${
                            uni.is_active
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={uni.is_active ? 'Deactivate University' : 'Activate University'}
                        >
                          {togglingUniversity === uni.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : uni.is_active ? (
                            <PowerOff className="w-5 h-5" />
                          ) : (
                            <Power className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteUniversity(uni.id)}
                          disabled={isLoading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete University"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/master/universities/${uni.id}`)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold cursor-pointer flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateAdminForm({
                            ...showCreateAdminForm,
                            [uni.id]: !showCreateAdminForm[uni.id],
                          });
                          if (!createAdminData[uni.id]) {
                            setCreateAdminData({
                              ...createAdminData,
                              [uni.id]: { name: '', email: '', password: 'dummy' },
                            });
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold cursor-pointer flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Create Admin
                      </button>
                    </div>

                    {/* Create Admin Form */}
                    <AnimatePresence>
                      {showCreateAdminForm[uni.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200"
                        >
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">
                            Create University Admin for {uni.name}
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={createAdminData[uni.id]?.name || ''}
                                onChange={(e) =>
                                  setCreateAdminData({
                                    ...createAdminData,
                                    [uni.id]: {
                                      ...(createAdminData[uni.id] || { name: '', email: '', password: 'dummy' }),
                                      name: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                placeholder="Admin Full Name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                              </label>
                              <input
                                type="email"
                                value={createAdminData[uni.id]?.email || ''}
                                onChange={(e) =>
                                  setCreateAdminData({
                                    ...createAdminData,
                                    [uni.id]: {
                                      ...(createAdminData[uni.id] || { name: '', email: '', password: 'dummy' }),
                                      email: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                placeholder="admin@university.edu"
                              />
                            </div>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                              <strong>Note:</strong> A random 6-character password will be automatically generated for this admin.
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCreateAdmin(uni.id)}
                                disabled={creatingAdmin === uni.id}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                              >
                                {creatingAdmin === uni.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                  </>
                                ) : (
                                  'Create Admin'
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setShowCreateAdminForm({
                                    ...showCreateAdminForm,
                                    [uni.id]: false,
                                  });
                                  setCreateAdminData({
                                    ...createAdminData,
                                    [uni.id]: { name: '', email: '', password: 'dummy' },
                                  });
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Created Admin Success Message */}
                    <AnimatePresence>
                      {createdAdminInfo[uni.id] && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 text-green-700 font-semibold">
                              <CheckCircle2 className="w-5 h-5" />
                              Admin created for {createdAdminInfo[uni.id].universityName}
                            </div>
                            <button
                              onClick={() => {
                                setCreatedAdminInfo({
                                  ...createdAdminInfo,
                                  [uni.id]: undefined as any,
                                });
                              }}
                              className="text-green-500 hover:text-green-700 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between bg-white p-2 rounded border border-green-200">
                              <span className="text-gray-700 font-medium">Email:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 font-mono">
                                  {createdAdminInfo[uni.id].email}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(createdAdminInfo[uni.id].email)}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors cursor-pointer"
                                  title="Copy email"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between bg-white p-2 rounded border border-green-200">
                              <span className="text-gray-700 font-medium">Password:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 font-mono">
                                  {createdAdminInfo[uni.id].password}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(createdAdminInfo[uni.id].password)}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors cursor-pointer"
                                  title="Copy password"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
            </>
          )}

          {/* University Admins Tab */}
          {activeTab === 'admins' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">All University Admins</h2>
              {loadingAdmins ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : universityAdmins.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No university admins found. Create universities and assign admins to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {universityAdmins.map((admin) => {
                    const university = universities.find(u => u.id === admin.university_id);
                    return (
                      <motion.div
                        key={admin.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-gray-900">{admin.name}</h3>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  admin.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {admin.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-600 space-y-1">
                              <div>Email: {admin.email}</div>
                              {university && <div>University: {university.name}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleAdmin(admin.id, admin.is_active)}
                              disabled={togglingAdmin === admin.id}
                              className={`p-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${
                                admin.is_active
                                  ? 'text-orange-600 hover:bg-orange-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={admin.is_active ? 'Deactivate Admin' : 'Activate Admin'}
                            >
                              {togglingAdmin === admin.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : admin.is_active ? (
                                <PowerOff className="w-5 h-5" />
                              ) : (
                                <Power className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin.id)}
                              disabled={isLoading}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              title="Delete Admin"
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
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Students</h2>
                <div className="flex items-center gap-3">
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
                  {students.map((student) => {
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
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MasterUniversitiesPage;



