// -----------------------------------------------------------------------------
// File: AdminStudentsPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Admin page for managing students via CSV upload
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
  type Student,
  type StudentBulkCreateResponse,
  type Branch,
} from '../api/client';
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
} from 'lucide-react';

const AdminStudentsPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [batchYear, setBatchYear] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<StudentBulkCreateResponse | null>(null);
  
  // Filter state for viewing students
  const [filterBranchId, setFilterBranchId] = useState<number | null>(null);
  const [filterBatchYear, setFilterBatchYear] = useState<string>('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'upload' | 'view'>('upload');

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

  // Load students when filters change
  useEffect(() => {
    if (user?.role === 'university_admin') {
      loadStudents();
    }
  }, [user, filterBranchId, filterBatchYear]);

  const loadBranches = async () => {
    try {
      const data = await adminGetBranches();
      setBranches(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load branches');
    }
  };

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const branchId = filterBranchId || undefined;
      const batchYear = filterBatchYear ? parseInt(filterBatchYear) : undefined;
      const data = await adminGetStudents(branchId, batchYear);
      setStudents(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
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
      }
      
      if (result.errors.length > 0) {
        setError(`${result.errors.length} error(s) occurred. Check details below.`);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload CSV file');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Students</h1>
          <p className="text-gray-600">Manage students via CSV upload</p>
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

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Students
              </div>
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'view'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                View Students
              </div>
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'upload' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Upload Students Excel/CSV
            </h2>

              <div className="space-y-4">
                {/* Branch Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedBranchId || ''}
                    onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    disabled={isUploading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the batch year (e.g., 2024, 2025)
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excel/CSV File <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    disabled={isUploading || !selectedBranchId || !batchYear}
                  />
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
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Uploading and processing file...</span>
                  </div>
                )}
              </div>

              {/* Upload Results */}
              {uploadResult && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
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
            </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              View Students
            </h2>

            {/* Filter Section */}
            <div className="mb-6 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filter Branch */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Branch
                  </label>
                  <select
                    value={filterBranchId || ''}
                    onChange={(e) => setFilterBranchId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Batch Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Batch Year
                  </label>
                  <input
                    type="number"
                    value={filterBatchYear}
                    onChange={(e) => setFilterBatchYear(e.target.value)}
                    placeholder="e.g., 2024, 2025"
                    min="2020"
                    max="2100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to show all batches
                  </p>
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Showing {students.length} student{students.length !== 1 ? 's' : ''}
                  {filterBranchId && (
                    <span> in {branches.find(b => b.id === filterBranchId)?.name}</span>
                  )}
                  {filterBatchYear && (
                    <span> (Batch {filterBatchYear})</span>
                  )}
                </p>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p>
                    {filterBranchId || filterBatchYear
                      ? 'No students found matching the selected filters.'
                      : 'No students yet. Upload a file to add students.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500 mt-1">{student.email}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                              {branches.find(b => b.id === student.branch_id)?.name || 'Unknown Branch'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {student.is_active ? (
                          <button
                            onClick={() => handleDeactivateStudent(student.id)}
                            disabled={isLoading}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title="Deactivate student"
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateStudent(student.id)}
                            disabled={isLoading}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title="Activate student"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          disabled={isLoading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentsPage;


