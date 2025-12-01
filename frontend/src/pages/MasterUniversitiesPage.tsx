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
  masterAssignAdmin,
  type University,
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
} from 'lucide-react';

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

  // Assign admin states
  const [assignAdminUserId, setAssignAdminUserId] = useState<{ [key: number]: string }>({});
  const [assigningAdmin, setAssigningAdmin] = useState<number | null>(null);

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

  const loadUniversities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await masterGetUniversities();
      setUniversities(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load universities');
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
      setError(err.response?.data?.detail || 'Failed to create university');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUniversity = async (id: number) => {
    if (!confirm('Are you sure you want to delete this university? This action cannot be undone.')) {
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
      setError(err.response?.data?.detail || 'Failed to delete university');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignAdmin = async (universityId: number) => {
    const userIdStr = assignAdminUserId[universityId]?.trim();
    if (!userIdStr) {
      setError('Please enter a user ID');
      return;
    }

    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      setError('User ID must be a number');
      return;
    }

    try {
      setAssigningAdmin(universityId);
      setError(null);
      setSuccess(null);
      await masterAssignAdmin(universityId, userId);
      setSuccess(`User ${userId} assigned as university admin successfully`);
      setAssignAdminUserId({ ...assignAdminUserId, [universityId]: '' });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign admin');
    } finally {
      setAssigningAdmin(null);
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
              Universities
            </h1>
            <p className="mt-2 text-gray-600">Manage universities and assign administrators</p>
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
                  className="text-red-500 hover:text-red-700"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Country (optional)"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                        <h3 className="text-lg font-semibold text-gray-900">{uni.name}</h3>
                        <div className="mt-1 text-sm text-gray-600 space-y-1">
                          {uni.code && <div>Code: {uni.code}</div>}
                          {(uni.city || uni.state || uni.country) && (
                            <div>
                              {[uni.city, uni.state, uni.country].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteUniversity(uni.id)}
                        disabled={isLoading}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete University"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Assign Admin Form */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign University Admin
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={assignAdminUserId[uni.id] || ''}
                          onChange={(e) =>
                            setAssignAdminUserId({
                              ...assignAdminUserId,
                              [uni.id]: e.target.value,
                            })
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter User ID"
                        />
                        <button
                          onClick={() => handleAssignAdmin(uni.id)}
                          disabled={assigningAdmin === uni.id || isLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {assigningAdmin === uni.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Assign Admin
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default MasterUniversitiesPage;

