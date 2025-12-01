// -----------------------------------------------------------------------------
// File: AdminMaterialsPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Admin page for managing study material documents and chunks
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  getCourses,
  getSubjects,
  createMaterialDocument,
  getMaterialDocuments,
  createMaterialChunk,
  getMaterialChunks,
  type Course,
  type Subject,
  type MaterialDocument,
  type MaterialChunk,
} from '../api/client';
import {
  BookOpen,
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const AdminMaterialsPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<MaterialDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [chunks, setChunks] = useState<MaterialChunk[]>([]);

  // Form states
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newChunkText, setNewChunkText] = useState('');
  const [newChunkPageNumber, setNewChunkPageNumber] = useState<number | null>(null);
  const [newChunkHeading, setNewChunkHeading] = useState('');
  const [newChunkKeywords, setNewChunkKeywords] = useState('');

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
      if (user?.role !== 'admin') {
        navigate('/chats');
        return;
      }
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  // Load courses on mount
  useEffect(() => {
    if (user?.role === 'admin') {
      loadCourses();
    }
  }, [user]);

  // Load subjects when course is selected
  useEffect(() => {
    if (selectedCourseId) {
      loadSubjects(selectedCourseId);
    } else {
      setSubjects([]);
      setSelectedSubjectId(null);
    }
  }, [selectedCourseId]);

  // Load documents when subject is selected
  useEffect(() => {
    if (selectedSubjectId) {
      loadDocuments(selectedSubjectId);
    } else {
      setDocuments([]);
      setSelectedDocumentId(null);
    }
  }, [selectedSubjectId]);

  // Load chunks when document is selected
  useEffect(() => {
    if (selectedDocumentId) {
      loadChunks(selectedDocumentId);
    } else {
      setChunks([]);
    }
  }, [selectedDocumentId]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCourses();
      setCourses(data);
      if (data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(data[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjects = async (courseId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSubjects(courseId);
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
      if (data.length > 0 && !selectedDocumentId) {
        setSelectedDocumentId(data[0].id);
      } else {
        setSelectedDocumentId(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChunks = async (documentId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMaterialChunks(documentId);
      setChunks(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load chunks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !newDocumentTitle.trim()) {
      setError('Please select a subject and enter a document title');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await createMaterialDocument(selectedSubjectId, newDocumentTitle.trim());
      setNewDocumentTitle('');
      setSuccess('Document created successfully!');
      await loadDocuments(selectedSubjectId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChunk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocumentId || !newChunkText.trim() || !newChunkKeywords.trim()) {
      setError('Please fill in text and keywords');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await createMaterialChunk(
        selectedDocumentId,
        newChunkPageNumber || null,
        newChunkHeading.trim() || null,
        newChunkKeywords.trim(),
        newChunkText.trim()
      );
      setNewChunkText('');
      setNewChunkPageNumber(null);
      setNewChunkHeading('');
      setNewChunkKeywords('');
      setSuccess('Chunk created successfully!');
      await loadChunks(selectedDocumentId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create chunk');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage study materials and content</p>
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
          {/* Left Column: Selection & Document Creation */}
          <div className="space-y-6">
            {/* Course & Subject Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Select Course & Subject
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course
                  </label>
                  <select
                    value={selectedCourseId || ''}
                    onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading || !selectedCourseId}
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

            {/* Create Document */}
            {selectedSubjectId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Create Document
                </h2>

                <form onSubmit={handleCreateDocument} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={newDocumentTitle}
                      onChange={(e) => setNewDocumentTitle(e.target.value)}
                      placeholder="e.g., Chapter 1: Introduction"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !newDocumentTitle.trim()}
                    className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Document
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Documents List */}
            {selectedSubjectId && documents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Documents ({documents.length})
                </h2>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocumentId(doc.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedDocumentId === doc.id
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Created {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Chunk Management */}
          <div className="space-y-6">
            {selectedDocumentId ? (
              <>
                {/* Create Chunk */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Add Chunk
                  </h2>

                  <form onSubmit={handleCreateChunk} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content (Text)
                      </label>
                      <textarea
                        value={newChunkText}
                        onChange={(e) => setNewChunkText(e.target.value)}
                        placeholder="Enter the content/text for this chunk..."
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Page Number (optional)
                        </label>
                        <input
                          type="number"
                          value={newChunkPageNumber || ''}
                          onChange={(e) =>
                            setNewChunkPageNumber(
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          placeholder="e.g., 12"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Heading (optional)
                        </label>
                        <input
                          type="text"
                          value={newChunkHeading}
                          onChange={(e) => setNewChunkHeading(e.target.value)}
                          placeholder="e.g., Introduction"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Keywords (comma-separated) *
                      </label>
                      <input
                        type="text"
                        value={newChunkKeywords}
                        onChange={(e) => setNewChunkKeywords(e.target.value)}
                        placeholder="e.g., normalization, database, sql"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate keywords with commas
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !newChunkText.trim() || !newChunkKeywords.trim()}
                      className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add Chunk
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>

                {/* Chunks List */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Chunks ({chunks.length})
                  </h2>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {chunks.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No chunks yet</p>
                    ) : (
                      chunks.map((chunk) => (
                        <div
                          key={chunk.id}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          {chunk.heading && (
                            <div className="font-semibold text-gray-900 mb-2">
                              {chunk.heading}
                            </div>
                          )}
                          <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                            {chunk.text}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            {chunk.page_number && (
                              <span>Page {chunk.page_number}</span>
                            )}
                            <span>Keywords: {chunk.keywords}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-lg p-12 border border-gray-200 text-center"
              >
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Select a document to view and manage chunks
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMaterialsPage;


