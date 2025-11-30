import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  adminGetCourses,
  adminCreateCourse,
  adminDeleteCourse,
  adminGetSubjects,
  adminCreateSubject,
  adminDeleteSubject,
  type Course,
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
} from 'lucide-react';

const AdminAcademicsPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [newCourseName, setNewCourseName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectSemester, setNewSubjectSemester] = useState<number | null>(null);

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
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminGetCourses();
      setCourses(data);
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
      const data = await adminGetSubjects(courseId);
      setSubjects(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) {
      setError('Please enter a course name');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await adminCreateCourse(newCourseName.trim());
      setNewCourseName('');
      setSuccess('Course created successfully!');
      await loadCourses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm('Are you sure you want to delete this course? This will also delete all associated subjects, chats, and materials.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await adminDeleteCourse(courseId);
      setSuccess('Course deleted successfully!');
      if (selectedCourseId === courseId) {
        setSelectedCourseId(null);
      }
      await loadCourses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !newSubjectName.trim()) {
      setError('Please select a course and enter a subject name');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await adminCreateSubject({
        course_id: selectedCourseId,
        name: newSubjectName.trim(),
        semester: newSubjectSemester || undefined,
      });
      setNewSubjectName('');
      setNewSubjectSemester(null);
      setSuccess('Subject created successfully!');
      await loadSubjects(selectedCourseId);
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
      if (selectedCourseId) {
        await loadSubjects(selectedCourseId);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete subject');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Courses & Subjects</h1>
          <p className="text-gray-600">Create and manage courses and their subjects</p>
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
          {/* Left Column: Course Management */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Courses ({courses.length})
            </h2>

            {/* Create Course Form */}
            <form onSubmit={handleCreateCourse} className="mb-6 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="e.g., B.Tech (Bachelor of Technology)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !newCourseName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Courses List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {courses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No courses yet. Create your first course!</p>
                </div>
              ) : (
                courses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      selectedCourseId === course.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedCourseId(course.id)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-gray-900">{course.name}</div>
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      disabled={isLoading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Right Column: Subject Management */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            {selectedCourse ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Subjects for {selectedCourse.name}
                </h2>

                {/* Create Subject Form */}
                <form onSubmit={handleCreateSubject} className="mb-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="e.g., Database Management Systems"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester (optional)
                    </label>
                    <input
                      type="number"
                      value={newSubjectSemester || ''}
                      onChange={(e) =>
                        setNewSubjectSemester(e.target.value ? Number(e.target.value) : null)
                      }
                      placeholder="e.g., 3"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !newSubjectName.trim()}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Subject
                      </>
                    )}
                  </button>
                </form>

                {/* Subjects List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {subjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>No subjects yet. Add your first subject!</p>
                    </div>
                  ) : (
                    subjects.map((subject) => (
                      <motion.div
                        key={subject.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{subject.name}</div>
                          {subject.semester && (
                            <div className="text-sm text-gray-500 mt-1">
                              Semester {subject.semester}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteSubject(subject.id)}
                          disabled={isLoading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a course to manage its subjects</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminAcademicsPage;

