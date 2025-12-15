// -----------------------------------------------------------------------------
// File: AdminAcademicsPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Admin page for managing branches, semesters, and subjects matching main.html UI/UX
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
  getUniversityDetails,
  type Branch,
  type Semester,
  type Subject,
} from '../api/client';
import AdminSidebar from '../components/AdminSidebar';
import {
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Menu,
  Bell,
  Settings,
  Building2,
} from 'lucide-react';

const AdminAcademicsPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [universityDetails, setUniversityDetails] = useState<any>(null);

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

      // Load university details for sidebar
      const details = await getUniversityDetails();
      setUniversityDetails(details);

      // Load branches
      await loadBranches();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

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
        searchPlaceholder="Search academics..."
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
                <h2 className="text-2xl font-bold text-gray-900">Academics Management</h2>
                <p className="text-sm text-gray-500">Manage branches, semesters, and subjects</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{branches.length}</h3>
                  <p className="text-sm text-gray-600">Total Branches</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Layers className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{semesters.length}</h3>
                  <p className="text-sm text-gray-600">Total Semesters</p>
                  {selectedBranch && (
                    <p className="text-xs text-gray-500 mt-2">in {selectedBranch.name}</p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{subjects.length}</h3>
                  <p className="text-sm text-gray-600">Total Subjects</p>
                  {selectedSemester && (
                    <p className="text-xs text-gray-500 mt-2">in {selectedSemester.name}</p>
                  )}
                </motion.div>
              </div>
            </section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Branches */}
              <div className="space-y-6">
                {/* Create Branch */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-600" />
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
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                        disabled={isLoading}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !newBranchName.trim()}
                      className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                      Branches ({branches.length})
                    </h2>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {branches.map((branch) => (
                        <div
                          key={branch.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            selectedBranchId === branch.id
                              ? 'bg-indigo-50 border-indigo-200'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <button
                            onClick={() => setSelectedBranchId(branch.id)}
                            className="flex-1 text-left font-semibold text-gray-900 cursor-pointer"
                          >
                            {branch.name}
                          </button>
                          <button
                            onClick={() => handleDeleteBranch(branch.id)}
                            disabled={isLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Right Column: Semesters & Subjects */}
              <div className="space-y-6">
                {selectedBranchId ? (
                  <>
                    {/* Create Semester */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    >
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-indigo-600" />
                        Create Semester
                        {selectedBranch && (
                          <span className="text-sm font-normal text-gray-500">for {selectedBranch.name}</span>
                        )}
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
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
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
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                            disabled={isLoading}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading || !newSemesterNumber || !newSemesterName.trim()}
                          className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                      >
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-indigo-600" />
                          Semesters ({semesters.length})
                        </h2>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {semesters.map((semester) => (
                            <div
                              key={semester.id}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                selectedSemesterId === semester.id
                                  ? 'bg-indigo-50 border-indigo-200'
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <button
                                onClick={() => setSelectedSemesterId(semester.id)}
                                className="flex-1 text-left cursor-pointer"
                              >
                                <div className="font-semibold text-gray-900">{semester.name}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Semester {semester.semester_number}
                                </div>
                              </button>
                              <button
                                onClick={() => handleDeleteSemester(semester.id)}
                                disabled={isLoading}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                      >
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Plus className="w-5 h-5 text-indigo-600" />
                          Create Subject
                          {selectedSemester && (
                            <span className="text-sm font-normal text-gray-500">for {selectedSemester.name}</span>
                          )}
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
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                              disabled={isLoading}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isLoading || !newSubjectName.trim()}
                            className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                      >
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                          Subjects ({subjects.length})
                        </h2>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {subjects.map((subject) => (
                            <div
                              key={subject.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all"
                            >
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">{subject.name}</div>
                              </div>
                              <button
                                onClick={() => handleDeleteSubject(subject.id)}
                                disabled={isLoading}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Select a branch to manage its semesters and subjects</p>
                  </div>
                )}
              </div>
            </div>
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
    </div>
  );
};

export default AdminAcademicsPage;
