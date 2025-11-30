import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Users
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

interface CourseSubjectSelectorProps {
  onStartChat: (subjectName: string) => void;
  isLoading?: boolean;
  userName?: string;
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

const CourseSubjectSelector = ({
  onStartChat,
  isLoading = false,
  userName,
}: CourseSubjectSelectorProps) => {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [greeting, setGreeting] = useState('');
  const PRIMARY_COLOR = 'indigo';

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

  const handleStartChat = () => {
    if (selectedSubject) {
      onStartChat(selectedSubject.name);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-xl px-8 py-8 w-full max-w-6xl mx-auto space-y-8"
    >
      {/* Elegant Greeting Section */}
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="h-1 w-12 bg-indigo-200 rounded-full"></div>
          <span className="text-sm font-medium text-indigo-600 uppercase tracking-wider">
            Welcome Back
          </span>
          <div className="h-1 w-12 bg-indigo-200 rounded-full"></div>
        </div>
        
        <h2 className="text-4xl font-light text-blue-600">
          {greeting}, <span className="font-semibold">{userName || 'there'}</span>
        </h2>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Choose your course and subject to start a focused AI chat tailored to your syllabus.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
          <span className="px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700">
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
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Select Course
          </label>
          <p className="text-gray-600">
            Pick your degree program to see its mapped subjects.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {COURSES.map((course) => {
            const isActive = selectedCourseId === course.id;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setSelectedSubjectId(null);
                }}
                className={`relative flex items-start gap-4 rounded-2xl px-6 py-4 text-left border-2 transition-all
                  ${
                    isActive
                      ? `border-blue-500 bg-blue-50/70 shadow-lg`
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                  }`}
              >
                <div className={`p-2 rounded-xl ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {COURSE_ICONS[course.id]}
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-base font-semibold text-gray-900">{course.name}</p>
                  <p className="text-sm text-gray-600">
                    {course.name.includes('Tech') || course.name.includes('Engineering')
                      ? 'Core CS/IT & engineering subjects'
                      : 'Mapped core semester-wise subjects'}
                  </p>
                </div>
                {isActive && (
                  <span className="ml-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-blue-600 text-white">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Select Subject
          </label>
          <p className="text-gray-600">
            Choose the subject you want to chat about. Each chat stays attached to this subject.
          </p>
        </div>

        {!selectedCourseId && (
          <div className="text-gray-600 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl px-6 py-8 text-center text-lg">
            Pick a course above to see its subjects.
          </div>
        )}

        {selectedCourseId && subjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="max-h-80 overflow-y-auto pr-2 space-y-3"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => {
                const isActive = selectedSubjectId === subject.id;
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(subject.id)}
                    className={`flex items-start gap-4 rounded-2xl px-6 py-4 border-2 text-left transition-all
                      ${
                        isActive
                          ? `border-blue-500 bg-white shadow-lg`
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                  >
                    <div className={`p-2 rounded-xl ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {SUBJECT_ICONS[subject.id]}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-900 mb-2">
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
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {selectedCourseId && subjects.length === 0 && (
          <div className="text-gray-600 text-lg text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            No subjects available for this course yet. Please contact your admin.
          </div>
        )}
      </div>

      {/* Context Summary + CTA */}
      <div className="space-y-4">
        <div className="text-gray-600 bg-gray-50 rounded-2xl border border-gray-200 px-6 py-4 text-lg">
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
          onClick={handleStartChat}
          disabled={!selectedSubjectId || isLoading}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full 
                    hover:from-blue-700 hover:to-blue-800 
                    disabled:opacity-50 disabled:cursor-not-allowed 
                    transition-all font-bold text-lg shadow-lg hover:shadow-xl
                    flex items-center justify-center gap-3"
        >
          {isLoading && (
            <span className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          <span>{isLoading ? 'Starting Chat...' : 'Start Chat'}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CourseSubjectSelector;