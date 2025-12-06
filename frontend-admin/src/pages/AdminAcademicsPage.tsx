// -----------------------------------------------------------------------------
// File: AdminAcademicsPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Admin page for managing branches, semesters, and subjects with two-column layout matching materials page
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  adminGetBranches,
  adminCreateBranch,
  adminDeleteBranch,
  adminGetSemesters,
  adminCreateSemester,
  adminDeleteSemester,
  adminGetSubjects,
  adminCreateSubject,
  adminDeleteSubject,
  type Branch,
  type Semester,
  type Subject,
} from '../api/client';
import {
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';

const AdminAcademicsPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [newBranchName, setNewBranchName] = useState('');
  const [newSemesterNumber, setNewSemesterNumber] = useState<number | null>(null);
  const [newSemesterName, setNewSemesterName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  // Check university admin access
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

  // Load branches on mount
  useEffect(() => {
    if (user?.role === 'university_admin') {
      loadBranches();
    }
  }, [user]);

  // Load semesters when branch is selected
  useEffect(() => {
    if (selectedBranchId) {
      loadSemesters(selectedBranchId);
    } else {
      setSemesters([]);
      setSelectedSemesterId(null);
    }
  }, [selectedBranchId]);

  // Load subjects when semester is selected
  useEffect(() => {
    if (selectedSemesterId) {
      loadSubjects(selectedSemesterId);
    } else {
      setSubjects([]);
    }
  }, [selectedSemesterId]);

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminGetBranches();
      setBranches(data);
      if (data.length > 0 && !selectedBranchId) {
        setSelectedBranchId(data[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSemesters = async (branchId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminGetSemesters(branchId);
      setSemesters(data);
      if (data.length > 0 && !selectedSemesterId) {
        setSelectedSemesterId(data[0].id);
      } else {
        setSelectedSemesterId(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load semesters');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjects = async (semesterId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminGetSubjects(semesterId);
      setSubjects(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) {
      setError('Please enter a branch name');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await adminCreateBranch(newBranchName.trim());
      setNewBranchName('');
      setSuccess('Branch created successfully!');
      await loadBranches();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create branch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId: number) => {
    if (!window.confirm('Are you sure you want to delete this branch? This will also delete all associated semesters, subjects, chats, and materials.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await adminDeleteBranch(branchId);
      setSuccess('Branch deleted successfully!');
      if (selectedBranchId === branchId) {
        setSelectedBranchId(null);
      }
      await loadBranches();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete branch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId || !newSemesterNumber || !newSemesterName.trim()) {
      setError('Please select a branch and enter semester number and name');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await adminCreateSemester({
        branch_id: selectedBranchId,
        semester_number: newSemesterNumber,
        name: newSemesterName.trim(),
      });
      setNewSemesterNumber(null);
      setNewSemesterName('');
      setSuccess('Semester created successfully!');
      await loadSemesters(selectedBranchId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create semester');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSemester = async (semesterId: number) => {
    if (!window.confirm('Are you sure you want to delete this semester? This will also delete all associated subjects, chats, and materials.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await adminDeleteSemester(semesterId);
      setSuccess('Semester deleted successfully!');
      if (selectedSemesterId === semesterId) {
        setSelectedSemesterId(null);
      }
      if (selectedBranchId) {
        await loadSemesters(selectedBranchId);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete semester');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSemesterId || !newSubjectName.trim()) {
      setError('Please select a semester and enter a subject name');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await adminCreateSubject({
        semester_id: selectedSemesterId,
        name: newSubjectName.trim(),
      });
      setNewSubjectName('');
      setSuccess('Subject created successfully!');
      await loadSubjects(selectedSemesterId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create subject');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!window.confirm('Are you sure you want to delete this subject? This will also delete all associated chats and materials.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await adminDeleteSubject(subjectId);
      setSuccess('Subject deleted successfully!');
      if (selectedSemesterId) {
        await loadSubjects(selectedSemesterId);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete subject');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const selectedSemester = semesters.find((s) => s.id === selectedSemesterId);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'university_admin') {
    return null;
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Academics</h1>
          <p className="text-gray-600">Manage branches, semesters, and subjects</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Creation */}
          <div className="space-y-6">
            {/* Create Branch */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Create Branch
              </h2>

              <form onSubmit={handleCreateBranch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="e.g., Computer Science"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !newBranchName.trim()}
                  className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Branch
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Branches List */}
            {branches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Branches ({branches.length})
                </h2>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        selectedBranchId === branch.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedBranchId(branch.id)}
                        className="flex-1 text-left font-medium text-gray-900 cursor-pointer"
                      >
                        {branch.name}
                      </button>
                      <button
                        onClick={() => handleDeleteBranch(branch.id)}
                        disabled={isLoading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="Delete branch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Semester & Subject Management */}
          <div className="space-y-6">
            {selectedBranchId ? (
              <>
                {/* Create Semester */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Create Semester for {selectedBranch?.name}
                  </h2>

                  <form onSubmit={handleCreateSemester} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semester Number
                      </label>
                      <input
                        type="number"
                        value={newSemesterNumber || ''}
                        onChange={(e) =>
                          setNewSemesterNumber(e.target.value ? Number(e.target.value) : null)
                        }
                        placeholder="e.g., 1"
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semester Name
                      </label>
                      <input
                        type="text"
                        value={newSemesterName}
                        onChange={(e) => setNewSemesterName(e.target.value)}
                        placeholder="e.g., 1st Semester"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        disabled={isLoading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !newSemesterNumber || !newSemesterName.trim()}
                      className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Create Semester
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>

                {/* Semesters List */}
                {semesters.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-600" />
                      Semesters ({semesters.length})
                    </h2>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {semesters.map((semester) => (
                        <div
                          key={semester.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            selectedSemesterId === semester.id
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <button
                            onClick={() => setSelectedSemesterId(semester.id)}
                            className="flex-1 text-left cursor-pointer"
                          >
                            <div className="font-medium text-gray-900">{semester.name}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              Semester {semester.semester_number}
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteSemester(semester.id)}
                            disabled={isLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title="Delete semester"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Create Subject */}
                {selectedSemesterId && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-blue-600" />
                      Create Subject for {selectedSemester?.name}
                    </h2>

                    <form onSubmit={handleCreateSubject} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subject Name
                        </label>
                        <input
                          type="text"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="e.g., Database Management Systems"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          disabled={isLoading}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || !newSubjectName.trim()}
                        className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Create Subject
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* Subjects List */}
                {selectedSemesterId && subjects.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      Subjects ({subjects.length})
                    </h2>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {subjects.map((subject) => (
                        <div
                          key={subject.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{subject.name}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteSubject(subject.id)}
                            disabled={isLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title="Delete subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 text-center py-12">
                <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a branch to manage its semesters and subjects</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAcademicsPage;
