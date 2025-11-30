import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { startChat } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import {
  Cpu,
  FlaskConical,
  Building2,
  Globe,
  BookOpen,
  Code2,
  Database,
  Server,
  Network,
  Radio,
  Atom,
  Binary,
  Wrench,
  CircuitBoard,
  Calculator,
  Beaker,
  Microscope,
  Dna,
  BarChart3,
  Landmark,
  TrendingUp,
  Wallet,
  ShoppingCart,
  BookText,
  Clock,
  Shield,
  Sparkles
} from 'lucide-react';

interface Course {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  semester?: number | null;
}

// Course icons mapping
const COURSE_ICONS: Record<number, React.ReactNode> = {
  1: <Cpu className="w-5 h-5" />, // B.Tech
  2: <FlaskConical className="w-5 h-5" />, // B.Sc
  3: <Building2 className="w-5 h-5" />, // B.Com
  4: <Globe className="w-5 h-5" />, // B.S
  5: <BookOpen className="w-5 h-5" />, // B.A
  6: <Code2 className="w-5 h-5" />, // B.E
};

// Subject icons mapping
const SUBJECT_ICONS: Record<number, React.ReactNode> = {
  // B.Tech subjects
  1: <Database className="w-4 h-4" />, // DBMS
  2: <Server className="w-4 h-4" />, // Operating Systems
  3: <Network className="w-4 h-4" />, // Computer Networks
  4: <Radio className="w-4 h-4" />, // Data Communication
  5: <Atom className="w-4 h-4" />, // Engineering Physics
  6: <Binary className="w-4 h-4" />, // Data Structures
  7: <Wrench className="w-4 h-4" />, // Software Engineering
  8: <CircuitBoard className="w-4 h-4" />, // Computer Architecture

  // B.Sc subjects
  9: <Calculator className="w-4 h-4" />, // Mathematics
  10: <Beaker className="w-4 h-4" />, // Physics
  11: <FlaskConical className="w-4 h-4" />, // Chemistry
  12: <Dna className="w-4 h-4" />, // Biology
  13: <BarChart3 className="w-4 h-4" />, // Statistics

  // B.Com subjects
  14: <Landmark className="w-4 h-4" />, // Accounting
  15: <TrendingUp className="w-4 h-4" />, // Business Economics
  16: <Wallet className="w-4 h-4" />, // Financial Management
  17: <ShoppingCart className="w-4 h-4" />, // Marketing

  // B.S subjects
  18: <Calculator className="w-4 h-4" />, // Mathematics
  19: <Beaker className="w-4 h-4" />, // Physics
  20: <FlaskConical className="w-4 h-4" />, // Chemistry

  // B.A subjects
  21: <BookText className="w-4 h-4" />, // English Literature
  22: <Clock className="w-4 h-4" />, // History
  23: <Shield className="w-4 h-4" />, // Political Science

  // B.E subjects
  24: <Database className="w-4 h-4" />, // DBMS
  25: <Server className="w-4 h-4" />, // Operating Systems
  26: <Network className="w-4 h-4" />, // Computer Networks
  27: <Radio className="w-4 h-4" />, // Data Communication
  28: <Atom className="w-4 h-4" />, // Engineering Physics
};

// Hardcoded courses
const COURSES: Course[] = [
  { id: 1, name: 'B.Tech (Bachelor of Technology)' },
  { id: 2, name: 'B.Sc (Bachelor of Science)' },
  { id: 3, name: 'B.Com (Bachelor of Commerce)' },
  { id: 4, name: 'B.S (Bachelor of Science)' },
  { id: 5, name: 'B.A (Bachelor of Arts)' },
  { id: 6, name: 'B.E (Bachelor of Engineering)' },
];

// Hardcoded subjects mapped to courses
const SUBJECTS_BY_COURSE: Record<number, Subject[]> = {
  1: [
    // B.Tech
    { id: 1, name: 'Database Management Systems (DBMS)', semester: 4 },
    { id: 2, name: 'Operating Systems', semester: 5 },
    { id: 3, name: 'Computer Networks', semester: 6 },
    { id: 4, name: 'Data Communication', semester: 5 },
    { id: 5, name: 'Engineering Physics', semester: 1 },
    { id: 6, name: 'Data Structures and Algorithms', semester: 3 },
    { id: 7, name: 'Software Engineering', semester: 6 },
    { id: 8, name: 'Computer Architecture', semester: 4 },
  ],
  2: [
    // B.Sc
    { id: 9, name: 'Mathematics', semester: 1 },
    { id: 10, name: 'Physics', semester: 1 },
    { id: 11, name: 'Chemistry', semester: 1 },
    { id: 12, name: 'Biology', semester: 2 },
    { id: 13, name: 'Statistics', semester: 3 },
  ],
  3: [
    // B.Com
    { id: 14, name: 'Accounting', semester: 1 },
    { id: 15, name: 'Business Economics', semester: 2 },
    { id: 16, name: 'Financial Management', semester: 3 },
    { id: 17, name: 'Marketing', semester: 4 },
  ],
  4: [
    // B.S
    { id: 18, name: 'Mathematics', semester: 1 },
    { id: 19, name: 'Physics', semester: 1 },
    { id: 20, name: 'Chemistry', semester: 1 },
  ],
  5: [
    // B.A
    { id: 21, name: 'English Literature', semester: 1 },
    { id: 22, name: 'History', semester: 2 },
    { id: 23, name: 'Political Science', semester: 3 },
  ],
  6: [
    // B.E
    { id: 24, name: 'Database Management Systems (DBMS)', semester: 4 },
    { id: 25, name: 'Operating Systems', semester: 5 },
    { id: 26, name: 'Computer Networks', semester: 6 },
    { id: 27, name: 'Data Communication', semester: 5 },
    { id: 28, name: 'Engineering Physics', semester: 1 },
  ],
};

const SelectSubjectPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [greeting, setGreeting] = useState('');

  const subjects = selectedCourseId ? SUBJECTS_BY_COURSE[selectedCourseId] || [] : [];
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedCourse = COURSES.find((c) => c.id === selectedCourseId);

  // Get time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-blue-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (only after loading is complete)
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleStartChat = async (subjectName: string) => {
    setIsLoading(true);
    try {
      const chat = await startChat(1, subjectName);
      navigate(`/chat/${chat.id}`);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      alert(error.response?.data?.detail || 'Error starting chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      {/* Background Visual Element */}
      <div 
        className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" 
        aria-hidden="true"
      >
        <div 
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-200 to-indigo-200 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
          }}
        />
      </div>

      <div className="relative py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Elegant Greeting Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-1 w-12 bg-blue-200 rounded-full"></div>
              <span className="text-sm font-medium text-blue-600 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Welcome Back
              </span>
              <div className="h-1 w-12 bg-blue-200 rounded-full"></div>
            </div>
            
            <h2 className="text-4xl font-light text-gray-900 mb-4">
              {greeting}, <span className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user?.name || 'there'}</span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Choose your course and subject to start a focused AI chat tailored to your syllabus.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              <span className="px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                Total courses: <span className="font-semibold">{COURSES.length}</span>
              </span>
              <span className="px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
                Subjects mapped:{" "}
                <span className="font-semibold">
                  {Object.values(SUBJECTS_BY_COURSE).reduce((acc, arr) => acc + arr.length, 0)}
                </span>
              </span>
              {selectedCourse && selectedSubject && (
                <span className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium">
                  Selected: {selectedCourse.name.split('(')[0].trim()} · {selectedSubject.name}
                </span>
              )}
            </div>
          </div>

          {/* Course Selection */}
          <div className="space-y-6 mb-8">
            <div className="text-center">
              <label className="block text-2xl font-bold text-gray-900 mb-3">
                Select Your Course
              </label>
              <p className="text-gray-600 text-lg">
                Pick your degree program to see its mapped subjects
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {COURSES.map((course) => {
                const isActive = selectedCourseId === course.id;
                return (
                  <motion.button
                    key={course.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setSelectedSubjectId(null);
                    }}
                    className={`relative flex items-start gap-4 rounded-2xl px-6 py-5 text-left border-2 transition-all
                      ${
                        isActive
                          ? 'border-blue-500 bg-blue-50/80 shadow-lg'
                          : 'border-gray-200 bg-white/80 hover:bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className={`p-3 rounded-xl ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {COURSE_ICONS[course.id]}
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="text-lg font-semibold text-gray-900">{course.name}</p>
                      <p className="text-sm text-gray-600">
                        {course.name.includes('Tech') || course.name.includes('Engineering')
                          ? 'Core CS/IT & engineering subjects'
                          : 'Mapped core semester-wise subjects'}
                      </p>
                    </div>
                    {isActive && (
                      <span className="absolute top-3 right-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-blue-600 text-white">
                        Selected
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Subject Selection */}
          <div className="space-y-6 mb-8">
            <div className="text-center">
              <label className="block text-2xl font-bold text-gray-900 mb-3">
                Choose Your Subject
              </label>
              <p className="text-gray-600 text-lg">
                Select the subject you want to chat about
              </p>
            </div>

            {selectedCourseId && subjects.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="max-h-96 overflow-y-auto pr-2 space-y-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-2">
                  {subjects.map((subject) => {
                    const isActive = selectedSubjectId === subject.id;
                    return (
                      <motion.button
                        key={subject.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setSelectedSubjectId(subject.id)}
                        className={`flex items-start gap-4 rounded-2xl px-6 py-5 border-2 text-left transition-all
                          ${
                            isActive
                              ? 'border-blue-500 bg-white shadow-lg'
                              : 'border-gray-200 bg-white/80 hover:bg-white hover:border-gray-300'
                          }`}
                      >
                        <div className={`p-3 rounded-xl ${
                          isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {SUBJECT_ICONS[subject.id]}
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-gray-900 mb-3">
                            {subject.name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {subject.semester && (
                              <span className="inline-flex items-center rounded-full bg-gray-900 text-gray-50 px-3 py-1">
                                Sem {subject.semester}
                              </span>
                            )}
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1">
                              AI-ready syllabus
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {selectedCourseId && subjects.length === 0 && (
              <div className="text-gray-600 text-xl text-center py-12 bg-white/80 rounded-2xl border-2 border-dashed border-gray-300">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                No subjects available for this course yet. Please contact your admin.
              </div>
            )}
          </div>

          {/* Context Summary + CTA */}
          <div className="space-y-6">
            <div className="text-gray-600 bg-white/80 rounded-2xl border border-gray-200 px-8 py-6 text-lg text-center">
              {selectedCourse && selectedSubject ? (
                <>
                  <span className="font-semibold text-gray-800">Ready to start: </span>
                  You're about to start a chat for{' '}
                  <span className="font-semibold text-gray-800">
                    {selectedSubject.name}
                  </span>{' '}
                  under{' '}
                  <span className="font-semibold text-gray-800">
                    {selectedCourse.name}
                  </span>
                  . Your questions and AI responses will be stored in this subject's history.
                </>
              ) : (
                <>
                  Select both a course and a subject to unlock an AI chat tailored to that subject's
                  exam pattern and syllabus.
                </>
              )}
            </div>

            <motion.button
              whileHover={!isLoading && selectedSubjectId ? { scale: 1.02 } : {}}
              whileTap={!isLoading && selectedSubjectId ? { scale: 0.98 } : {}}
              onClick={() => selectedSubject && handleStartChat(selectedSubject.name)}
              disabled={!selectedSubjectId || isLoading}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full 
                        hover:from-blue-700 hover:to-blue-800 
                        disabled:opacity-50 disabled:cursor-not-allowed 
                        transition-all font-bold text-xl shadow-xl hover:shadow-2xl
                        flex items-center justify-center gap-4"
            >
              {isLoading && (
                <span className="h-6 w-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              <span>{isLoading ? 'Starting Chat...' : 'Start AI Learning Session'}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SelectSubjectPage;