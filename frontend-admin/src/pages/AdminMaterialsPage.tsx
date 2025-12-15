// -----------------------------------------------------------------------------
// File: AdminMaterialsPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Admin page for managing study material documents matching main.html UI/UX
// -----------------------------------------------------------------------------

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  adminGetBranches,
  adminGetSemesters,
  adminGetSubjects,
  getMaterialDocuments,
  uploadMaterialDocument,
  getUniversityDetails,
  type Branch,
  type Semester,
  type Subject,
  type MaterialDocument,
} from '../api/client';
import AdminSidebar from '../components/AdminSidebar';
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Menu,
  Bell,
  Settings,
  X,
  Search,
  Filter,
  Trash2,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Database,
  CloudUpload,
} from 'lucide-react';

interface DocumentWithDetails extends MaterialDocument {
  subject?: Subject;
  semester?: Semester;
  branch?: Branch;
  status?: 'Complete' | 'Indexing' | 'Processing' | 'Pending' | 'Failed';
}

const AdminMaterialsPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allDocuments, setAllDocuments] = useState<DocumentWithDetails[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentWithDetails[]>([]);

  // Filter states
  const [filterSubjectId, setFilterSubjectId] = useState<number | null>(null);
  const [filterSemesterId, setFilterSemesterId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All Status');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; subjectId: number | null; semesterId: number | null; branchId: number | null }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [universityDetails, setUniversityDetails] = useState<any>(null);

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

      // Load all semesters
      const semestersData = await adminGetSemesters();
      setSemesters(semestersData);

      // Load all subjects
      const subjectsData = await adminGetSubjects();
      setSubjects(subjectsData);

      // Load all documents
      await loadAllDocuments(branchesData, semestersData, subjectsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllDocuments = async (branchesData: Branch[], semestersData: Semester[], subjectsData: Subject[]) => {
    try {
      const documents: DocumentWithDetails[] = [];

      // Create maps for quick lookup
      const subjectMap = new Map(subjectsData.map(s => [s.id, s]));
      const semesterMap = new Map(semestersData.map(s => [s.id, s]));
      const branchMap = new Map(branchesData.map(b => [b.id, b]));

      // Load documents for each subject
      for (const subject of subjectsData) {
        try {
          const docs = await getMaterialDocuments(subject.id);
          for (const doc of docs) {
            const subjectInfo = subjectMap.get(doc.subject_id);
            const semesterInfo = subjectInfo ? semesterMap.get(subjectInfo.semester_id) : undefined;
            const branchInfo = semesterInfo ? branchMap.get(semesterInfo.branch_id) : undefined;

            // Determine status
            // If document has s3_key, it's uploaded to S3 and should be considered Complete/Indexed
            // Processing status is not applicable since we don't track actual processing state
            let status: 'Complete' | 'Indexing' | 'Processing' | 'Pending' | 'Failed' = 'Pending';
            if (doc.s3_key) {
              // Document uploaded to S3 is considered Complete/Indexed
              status = 'Complete';
            }

            documents.push({
              ...doc,
              subject: subjectInfo,
              semester: semesterInfo,
              branch: branchInfo,
              status,
            });
          }
        } catch (err) {
          console.error(`Failed to load documents for subject ${subject.id}:`, err);
        }
      }

      // Sort by created_at DESC
      documents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAllDocuments(documents);
      setFilteredDocuments(documents);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...allDocuments];

    // Filter by subject
    if (filterSubjectId) {
      filtered = filtered.filter(doc => doc.subject_id === filterSubjectId);
    }

    // Filter by semester
    if (filterSemesterId) {
      filtered = filtered.filter(doc => doc.semester?.id === filterSemesterId);
    }

    // Filter by status
    if (filterStatus !== 'All Status') {
      filtered = filtered.filter(doc => doc.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.subject?.name.toLowerCase().includes(query) ||
        doc.semester?.name.toLowerCase().includes(query)
      );
    }

    setFilteredDocuments(filtered);
  }, [allDocuments, filterSubjectId, filterSemesterId, filterStatus, searchQuery]);

  // Calculate stats
  const stats = {
    total: allDocuments.length,
    indexed: allDocuments.filter(d => d.s3_key !== null).length, // Documents with s3_key are indexed
    processing: 0, // No processing status since we don't track it
    pending: allDocuments.filter(d => d.s3_key === null).length, // Documents without s3_key are pending
    failed: 0, // No failed status since we don't track it
  };

  // Get subjects for current filter semester
  const getSubjectsForSemester = (semesterId: number | null) => {
    if (!semesterId) return subjects;
    return subjects.filter(s => s.semester_id === semesterId);
  };

  // Get semesters for current filter branch (if we had branch filter)
  const getSemestersForBranch = (branchId: number | null) => {
    if (!branchId) return semesters;
    return semesters.filter(s => s.branch_id === branchId);
  };

  // Handle file selection for upload modal
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: Array<{ file: File; subjectId: number | null; semesterId: number | null; branchId: number | null }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (file.type !== 'application/pdf') {
        setError(`File "${file.name}" is not a PDF. Only PDF files are allowed.`);
        continue;
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds 50MB limit.`);
        continue;
      }

      newFiles.push({
        file,
        subjectId: null,
        semesterId: null,
        branchId: null,
      });
    }

    setSelectedFiles([...selectedFiles, ...newFiles]);
    setError(null);
  };

  // Handle file removal from upload modal
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Handle file upload
  const handleUploadFiles = async () => {
    // Validate all files have subject and branch selected
    const invalidFiles = selectedFiles.filter(f => !f.subjectId || !f.branchId);
    if (invalidFiles.length > 0) {
      setError('Please select subject and branch for all files');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);

      // Upload each file
      for (const fileData of selectedFiles) {
        if (fileData.subjectId && fileData.branchId) {
          await uploadMaterialDocument(fileData.file, fileData.branchId, fileData.subjectId);
        }
      }

      setSuccess(`${selectedFiles.length} file(s) uploaded successfully!`);
      setSelectedFiles([]);
      setUploadModalOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload documents
      await loadAllData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  // Get time ago string
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilterSubjectId(null);
    setFilterSemesterId(null);
    setFilterStatus('All Status');
    setSearchQuery('');
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
        searchPlaceholder="Search content..."
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
                <h2 className="text-2xl font-bold text-gray-900">Documents Management</h2>
                <p className="text-sm text-gray-500">Upload and manage course PDFs for RAG indexing</p>
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

              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Upload PDF</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</h3>
                  <p className="text-sm text-gray-600">Total PDFs</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.indexed}</h3>
                  <p className="text-sm text-gray-600">Indexed</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.processing}</h3>
                  <p className="text-sm text-gray-600">Processing</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-gray-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.pending}</h3>
                  <p className="text-sm text-gray-600">Pending</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.failed}</h3>
                  <p className="text-sm text-gray-600">Failed</p>
                </motion.div>
              </div>
            </section>

            {/* Filters Section */}
            <section className="mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                    <select
                      value={filterSubjectId || ''}
                      onChange={(e) => setFilterSubjectId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    >
                      <option value="">All Subjects</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Semester</label>
                    <select
                      value={filterSemesterId || ''}
                      onChange={(e) => {
                        setFilterSemesterId(e.target.value ? Number(e.target.value) : null);
                        setFilterSubjectId(null); // Reset subject filter when semester changes
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    >
                      <option value="">All Semesters</option>
                      {semesters.map((semester) => (
                        <option key={semester.id} value={semester.id}>
                          {semester.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    >
                      <option>All Status</option>
                      <option>Complete</option>
                      <option>Indexing</option>
                      <option>Processing</option>
                      <option>Pending</option>
                      <option>Failed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by filename..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      />
                      <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Reset Filters
                    </button>
                    <button className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Bulk Delete
                    </button>
                    <button className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Bulk Re-index
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">0</span> items selected
                  </div>
                </div>
              </div>
            </section>

            {/* Documents Table */}
            <section className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left">
                          <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Semester
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Uploaded
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : filteredDocuments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No documents found
                          </td>
                        </tr>
                      ) : (
                        filteredDocuments.map((doc) => (
                          <tr key={doc.id} className="hover:bg-gray-50 transition-all">
                            <td className="px-6 py-4">
                              <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{doc.title}</p>
                                  <p className="text-xs text-gray-500">
                                    {doc.s3_key ? 'Uploaded to S3' : 'Manual document'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700">{doc.subject?.name || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700">{doc.semester?.name || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4">
                              {doc.status === 'Complete' && (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full w-fit">
                                  <CheckCircle className="w-3 h-3" />
                                  Complete
                                </span>
                              )}
                              {doc.status === 'Pending' && (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full w-fit">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </span>
                              )}
                              {doc.status === 'Failed' && (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full w-fit">
                                  <AlertTriangle className="w-3 h-3" />
                                  Failed
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">{getTimeAgo(doc.created_at)}</span>
                              <p className="text-xs text-gray-500">by {user?.name || 'Admin'}</p>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredDocuments.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-semibold text-gray-900">1-{Math.min(20, filteredDocuments.length)}</span> of{' '}
                      <span className="font-semibold text-gray-900">{filteredDocuments.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                      >
                        Previous
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg">
                        1
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Upload Activity */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Recent Upload Activity</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h4 className="font-bold text-gray-900 mb-4">Upload Timeline</h4>
                  <div className="space-y-4">
                    {allDocuments.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="flex items-start gap-4">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            doc.status === 'Complete'
                              ? 'bg-green-500'
                              : doc.status === 'Pending'
                              ? 'bg-gray-400'
                              : 'bg-red-500'
                          }`}
                        ></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-gray-900">{doc.title}</p>
                            <span className="text-xs text-gray-500">{getTimeAgo(doc.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {doc.status === 'Complete'
                              ? 'Successfully indexed and uploaded to S3'
                              : doc.status === 'Pending'
                              ? 'Waiting to be uploaded'
                              : 'Failed to process'}
                          </p>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              doc.status === 'Complete'
                                ? 'text-green-600 bg-green-50'
                                : doc.status === 'Pending'
                                ? 'text-gray-600 bg-gray-100'
                                : 'text-red-600 bg-red-50'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Index Statistics</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Total Documents</span>
                          <span className="font-bold text-gray-900">{stats.total}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${(stats.total / Math.max(stats.total, 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Indexed</span>
                          <span className="font-bold text-gray-900">{stats.indexed}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(stats.indexed / Math.max(stats.total, 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Processing</span>
                          <span className="font-bold text-gray-900">{stats.processing}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-amber-600 h-2 rounded-full"
                            style={{ width: `${(stats.processing / Math.max(stats.total, 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Storage Usage</h4>
                        <p className="text-sm text-indigo-100">Documents stored in S3</p>
                      </div>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3 mb-3">
                      <div
                        className="bg-white h-3 rounded-full"
                        style={{ width: `${(stats.indexed / Math.max(stats.total, 1)) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-indigo-100">{stats.indexed} documents indexed</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-indigo-600 transition-all">
                Documentation
              </a>
              <a href="#" className="hover:text-indigo-600 transition-all">
                API Reference
              </a>
              <a href="#" className="hover:text-indigo-600 transition-all">
                System Status
              </a>
              <a href="#" className="hover:text-indigo-600 transition-all">
                Support
              </a>
            </div>
            <div className="text-sm text-gray-600">© 2024 StudyTap AI Admin Panel</div>
          </div>
        </footer>
      </main>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setUploadModalOpen(false);
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Upload PDF Documents</h3>
                <p className="text-sm text-gray-500">Upload course materials for RAG indexing</p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer"
              >
                <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CloudUpload className="w-8 h-8 text-indigo-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Drag & Drop PDF Files</h4>
                <p className="text-gray-600 mb-4">or click to browse from your computer</p>
                <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all">
                  Browse Files
                </button>
                <p className="text-xs text-gray-500 mt-4">Supports PDF files up to 50MB each</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-4">
                  {selectedFiles.map((fileData, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{fileData.file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveFile(index)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch</label>
                              <select
                                value={fileData.branchId || ''}
                                onChange={(e) => {
                                  const newFiles = [...selectedFiles];
                                  newFiles[index].branchId = e.target.value ? Number(e.target.value) : null;
                                  newFiles[index].semesterId = null;
                                  newFiles[index].subjectId = null;
                                  setSelectedFiles(newFiles);
                                }}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                              >
                                <option value="">Select Branch</option>
                                {branches.map((branch) => (
                                  <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Semester</label>
                              <select
                                value={fileData.semesterId || ''}
                                onChange={(e) => {
                                  const newFiles = [...selectedFiles];
                                  newFiles[index].semesterId = e.target.value ? Number(e.target.value) : null;
                                  newFiles[index].subjectId = null;
                                  setSelectedFiles(newFiles);
                                }}
                                disabled={!fileData.branchId}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              >
                                <option value="">Select Semester</option>
                                {getSemestersForBranch(fileData.branchId).map((semester) => (
                                  <option key={semester.id} value={semester.id}>
                                    {semester.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                            <select
                              value={fileData.subjectId || ''}
                              onChange={(e) => {
                                const newFiles = [...selectedFiles];
                                newFiles[index].subjectId = e.target.value ? Number(e.target.value) : null;
                                setSelectedFiles(newFiles);
                              }}
                              disabled={!fileData.semesterId}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">Select Subject</option>
                              {getSubjectsForSemester(fileData.semesterId).map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} ready to upload
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setUploadModalOpen(false);
                      setSelectedFiles([]);
                    }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadFiles}
                    disabled={isUploading || selectedFiles.length === 0 || selectedFiles.some(f => !f.subjectId || !f.branchId)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Start Upload
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminMaterialsPage;
