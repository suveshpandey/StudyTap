// -----------------------------------------------------------------------------
// File: AdminMaterialsPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Admin page for managing study material documents and chunks
// -----------------------------------------------------------------------------

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  getBranches,
  getSemesters,
  getSubjects,
  getMaterialDocuments,
  uploadMaterialDocument,
  type Branch,
  type Semester,
  type Subject,
  type MaterialDocument,
} from '../api/client';
import {
  BookOpen,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
} from 'lucide-react';

const AdminMaterialsPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<MaterialDocument[]>([]);

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check admin access
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
      setSelectedSubjectId(null);
    }
  }, [selectedSemesterId]);

  // Load documents when subject is selected
  useEffect(() => {
    if (selectedSubjectId) {
      loadDocuments(selectedSubjectId);
    } else {
      setDocuments([]);
    }
  }, [selectedSubjectId]);

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getBranches();
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
      const data = await getSemesters(branchId);
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
      const data = await getSubjects(semesterId);
      setSubjects(data);
      if (data.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(data[0].id);
      } else {
        setSelectedSubjectId(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async (subjectId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMaterialDocuments(subjectId);
      setDocuments(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only');
      return;
    }

    // Validate file size (e.g., max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedBranchId || !selectedSubjectId) {
      setError('Please select a branch, subject, and PDF file');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);
      await uploadMaterialDocument(selectedFile, selectedBranchId, selectedSubjectId);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSuccess('PDF document uploaded successfully to S3!');
      await loadDocuments(selectedSubjectId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload PDF document');
    } finally {
      setIsUploading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Materials</h1>
          <p className="text-gray-600">Upload PDF documents to AWS S3</p>
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

        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {/* Branch, Semester & Subject Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Select Branch, Semester & Subject
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch
                  </label>
                  <select
                    value={selectedBranchId || ''}
                    onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
                    disabled={isLoading}
                  >
                    <option value="">Select a branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={selectedSemesterId || ''}
                    onChange={(e) => setSelectedSemesterId(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
                    disabled={isLoading || !selectedBranchId}
                  >
                    <option value="">Select a semester</option>
                    {semesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    value={selectedSubjectId || ''}
                    onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
                    disabled={isLoading || !selectedSemesterId}
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Upload PDF Document to S3 */}
            {selectedSubjectId && selectedBranchId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Upload PDF Document to S3
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PDF File <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={isUploading || !selectedBranchId || !selectedSubjectId}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Only PDF files are allowed. Maximum file size: 50MB
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            {selectedFile.name}
                          </span>
                          <span className="text-xs text-blue-600">
                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          disabled={isUploading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={isUploading || !selectedFile || !selectedBranchId || !selectedSubjectId}
                    className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading to S3...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload PDF to S3
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Uploaded Documents List (Read-only) */}
            {selectedSubjectId && documents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Uploaded Documents ({documents.length})
                </h2>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="w-full text-left p-3 rounded-lg border bg-gray-50 border-gray-200 text-gray-900"
                    >
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {doc.s3_key ? (
                          <span className="text-green-600">Uploaded to S3</span>
                        ) : (
                          <span className="text-gray-400">Manual document</span>
                        )}
                        {' • '}
                        Created {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMaterialsPage;


