// -----------------------------------------------------------------------------
// File: MasterUniversitiesPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Master admin page for managing universities
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
  masterGetUniversityAdmins,
  masterGetStudents,
  type University,
} from '../api/client';
import {
  Building2,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  Search,
  Menu,
  Bell,
  Settings,
  Download,
  Filter,
  Ban,
  CheckCircle,
  GraduationCap,
  Users,
  TrendingUp,
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

const MasterUniversitiesPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'students' | 'created' | 'status'>('name');

  // Stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);

  // Form states
  const [newUniversity, setNewUniversity] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    country: '',
  });

  const [togglingUniversity, setTogglingUniversity] = useState<number | null>(null);

  // Check master admin access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'master_admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Load universities and stats
  useEffect(() => {
    if (user && user.role === 'master_admin') {
      loadUniversities();
      loadStats();
    }
  }, [user]);

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

  const loadStats = async () => {
    try {
      const [admins, students] = await Promise.all([
        masterGetUniversityAdmins(),
        masterGetStudents(),
      ]);
      setTotalAdmins(admins.length);
      setTotalStudents(students.length);
    } catch (err) {
      // Silently fail stats loading
    }
  };

  const handleCreateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Validate required fields
      if (!newUniversity.name.trim()) {
        setError('University name is required');
        setIsLoading(false);
        return;
      }
      if (!newUniversity.code.trim()) {
        setError('University code is required');
        setIsLoading(false);
        return;
      }

      const data: any = { 
        name: newUniversity.name.trim(),
        code: newUniversity.code.trim()
      };
      if (newUniversity.city) data.city = newUniversity.city.trim();
      if (newUniversity.state) data.state = newUniversity.state.trim();
      if (newUniversity.country) data.country = newUniversity.country.trim();

      await masterCreateUniversity(data);
      setSuccess('University created successfully');
      setNewUniversity({ name: '', code: '', city: '', state: '', country: '' });
      setShowCreateForm(false);
      await loadUniversities();
      await loadStats();
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
      await loadStats();
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


  const getUniversityInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
  };

  const getUniversityColor = (index: number) => {
    const colors = [
      'bg-blue-600',
      'bg-red-600',
      'bg-purple-600',
      'bg-green-600',
      'bg-orange-600',
      'bg-cyan-600',
    ];
    return colors[index % colors.length];
  };

  // Filter and sort universities
  const filteredUniversities = universities
    .filter(uni => {
      const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (uni.code && uni.code.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && uni.is_active) ||
        (statusFilter === 'inactive' && !uni.is_active);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        case 'status':
          return a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1;
        default:
          return 0;
      }
    });

  const activeUniversities = universities.filter(u => u.is_active).length;
  const inactiveUniversities = universities.length - activeUniversities;
  const activeRate = universities.length > 0 ? Math.round((activeUniversities / universities.length) * 100) : 0;

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
        totalUniversities={universities.length}
        totalStudents={totalStudents}
        totalAdmins={totalAdmins}
        actionButton={{
          label: 'Add University',
          onClick: () => setShowCreateForm(true),
          icon: <Plus className="w-4 h-4" />,
        }}
        searchPlaceholder="Search universities..."
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
                <h2 className="text-2xl font-bold text-gray-900">University Management</h2>
                <p className="text-sm text-gray-500">Add and manage universities on the platform</p>
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
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all">
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
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

            {/* Stats Section */}
            <section className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      {activeUniversities} Active
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{universities.length}</h3>
                  <p className="text-sm text-gray-600">Total Universities</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">{activeUniversities} Active • {inactiveUniversities} Inactive</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full">
                      {totalStudents > 0 ? `${(totalStudents / 1000).toFixed(1)}K` : '0'} Active
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">
                    {totalStudents > 1000 ? `${(totalStudents / 1000).toFixed(1)}K` : totalStudents}
                  </h3>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Avg: {universities.length > 0 ? Math.round(totalStudents / universities.length) : 0} per university
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                      {totalAdmins} Active
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{totalAdmins}</h3>
                  <p className="text-sm text-gray-600">University Admins</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Avg: {universities.length > 0 ? (totalAdmins / universities.length).toFixed(1) : 0} per university
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      {activeRate}%
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{activeRate}%</h3>
                  <p className="text-sm text-gray-600">Active Rate</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Last 30 days activity</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Filters Section */}
            <section className="mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search university name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    <option value="name">Sort by: Name</option>
                    <option value="created">Sort by: Created Date</option>
                    <option value="status">Sort by: Status</option>
                  </select>

                  <div className="lg:col-span-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setSortBy('name');
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Reset Filters</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Universities Table Section */}
            <section className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Universities List</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage all universities on the platform</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-all">
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add University</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {isLoading && universities.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                  ) : filteredUniversities.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      {searchQuery || statusFilter !== 'all' ? 'No universities match your filters.' : 'No universities found. Create one to get started.'}
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Logo
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            University Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUniversities.map((uni, index) => (
                          <tr key={uni.id} className="hover:bg-gray-50 transition-all">
                            <td className="px-6 py-4">
                              <div className={`w-12 h-12 ${getUniversityColor(index)} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                                {getUniversityInitials(uni.name)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-gray-900">{uni.name}</p>
                                {uni.code && <p className="text-xs text-gray-500">{uni.code}</p>}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {(uni.city || uni.state || uni.country) && (
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-700">
                                    {[uni.city, uni.state, uni.country].filter(Boolean).join(', ') || 'N/A'}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 ${
                                uni.is_active
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              } text-xs font-semibold rounded-full`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  uni.is_active ? 'bg-green-500' : 'bg-red-500'
                                }`}></span>
                                {uni.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {uni.created_at ? new Date(uni.created_at).toLocaleDateString() : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => navigate(`/master/universities/${uni.id}`)}
                                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleUniversity(uni.id, uni.is_active)}
                                  disabled={togglingUniversity === uni.id}
                                  className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                                    uni.is_active
                                      ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                                      : 'text-green-500 hover:text-green-600 hover:bg-green-50'
                                  }`}
                                  title={uni.is_active ? 'Deactivate' : 'Activate'}
                                >
                                  {togglingUniversity === uni.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : uni.is_active ? (
                                    <Ban className="w-4 h-4" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteUniversity(uni.id)}
                                  disabled={isLoading}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {filteredUniversities.length > 0 && (
                  <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-semibold text-gray-900">1-{filteredUniversities.length}</span> of{' '}
                      <span className="font-semibold text-gray-900">{filteredUniversities.length}</span> universities
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
            <div className="text-sm text-gray-600">
              © 2024 StudyTap AI. All rights reserved.
            </div>
          </div>
        </footer>
      </main>

      {/* Create University Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowCreateForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add New University</h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <form onSubmit={handleCreateUniversity} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        University Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newUniversity.name}
                        onChange={(e) => setNewUniversity({ ...newUniversity, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                        placeholder="e.g., Massachusetts Institute of Technology"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        University Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={newUniversity.code}
                        onChange={(e) => setNewUniversity({ ...newUniversity, code: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                        placeholder="e.g., MIT, HARVARD, STANFORD"
                      />
                      <p className="mt-1 text-xs text-gray-500">Unique identifier code for the university</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={newUniversity.city}
                        onChange={(e) => setNewUniversity({ ...newUniversity, city: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                        placeholder="e.g., Cambridge"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={newUniversity.state}
                        onChange={(e) => setNewUniversity({ ...newUniversity, state: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                        placeholder="e.g., Massachusetts"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={newUniversity.country}
                        onChange={(e) => setNewUniversity({ ...newUniversity, country: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                        placeholder="e.g., United States"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add University
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MasterUniversitiesPage;
