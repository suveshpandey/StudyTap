// -----------------------------------------------------------------------------
// File: Dashboard.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Student dashboard with sidebar navigation and comprehensive learning interface
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { startChat, getBranches, getSemesters, getSubjects, getChats, getChatMessages, getStudentProfile, getQuestionsToday, type Semester, type Subject, type Chat } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import StudentSidebar from '../components/StudentSidebar';
import {
  BookOpen,
  MessageSquare,
  Brain,
  History,
  // Bell,
  // Settings,
  Code,
  Database,
  Globe,
  Lightbulb,
  Trophy,
  Flame,
  Star,
  Menu,
  Mic,
  Image as ImageIcon,
  Send,
  ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [greeting, setGreeting] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [selectedSubjectForQuestion, setSelectedSubjectForQuestion] = useState<number | null>(null);
  const [allBranchSubjects, setAllBranchSubjects] = useState<Subject[]>([]);
  const [recentChats, setRecentChats] = useState<Array<{ chat: Chat; firstQuestion: string; answer: string }>>([]);
  const [isLoadingRecentChats, setIsLoadingRecentChats] = useState(false);
  const [currentSemesterSubjects, setCurrentSemesterSubjects] = useState<Subject[]>([]);
  const [isLoadingCurrentSemesterSubjects, setIsLoadingCurrentSemesterSubjects] = useState(false);
  const [questionsToday, setQuestionsToday] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Redirect university_admin and master_admin away from student dashboard
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'master_admin') {
        navigate('/master/universities', { replace: true });
        return;
      } else if (user.role === 'university_admin') {
        navigate('/admin/academics', { replace: true });
        return;
      }
    }
  }, [user, authLoading, navigate]);

  // Get time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Load student's branch and current semester subjects on mount
  useEffect(() => {
    const loadBranch = async () => {
      try {
        const data = await getBranches();
        if (data && data.length > 0) {
          const studentBranch = data[0];
          loadSemestersForBranch(studentBranch.id);
          // Load current semester subjects based on batch year
          await loadCurrentSemesterSubjects(studentBranch.id);
        }
      } catch (error) {
        console.error('Failed to load branch:', error);
      }
    };
    if (isAuthenticated && user?.role === 'student') {
      loadBranch();
    }
  }, [isAuthenticated, user]);

  // Load current semester subjects based on batch year
  const loadCurrentSemesterSubjects = async (branchId: number) => {
    try {
      setIsLoadingCurrentSemesterSubjects(true);
      
      // Get student profile to access batch_year
      const profile = await getStudentProfile();
      if (!profile.batch_year) {
        setCurrentSemesterSubjects([]);
        return;
      }

      // Get all semesters for the branch
      const branchSemesters = await getSemesters(branchId);
      if (branchSemesters.length === 0) {
        setCurrentSemesterSubjects([]);
        return;
      }

      // Calculate current semester based on batch_year
      // Academic year starts in August (month 7, 0-indexed)
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth(); // 0-11
      const batchYear = profile.batch_year;

      // Calculate which academic year we're in
      // Academic year runs from Aug (month 7) to Jul (month 6) of next year
      // If current month is Aug-Dec (7-11), we're in the first semester of current academic year
      // If current month is Jan-Jul (0-6), we're in the second semester of current academic year
      
      // Determine the start year of the current academic year
      // If we're in Aug-Dec, the academic year started this year
      // If we're in Jan-Jul, the academic year started last year
      const academicYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;
      
      // Calculate how many academic years have passed since batch_year
      const academicYearsPassed = academicYearStart - batchYear;
      
      // Determine which semester we're in within the current academic year
      // Semester 1 = Aug-Dec (months 7-11), Semester 2 = Jan-Jul (months 0-6)
      const semesterInYear = currentMonth >= 7 ? 1 : 2;
      
      // Calculate the current semester number
      // For batch_year 2024:
      // - Aug 2024 - Dec 2024: academicYearsPassed=0, semesterInYear=1 → Semester 1
      // - Jan 2025 - Jul 2025: academicYearsPassed=0, semesterInYear=2 → Semester 2
      // - Aug 2025 - Dec 2025: academicYearsPassed=1, semesterInYear=1 → Semester 3
      // - Jan 2026 - Jul 2026: academicYearsPassed=1, semesterInYear=2 → Semester 4
      const currentSemesterNumber = academicYearsPassed * 2 + semesterInYear;

      // Find the semester that matches or is closest to the calculated semester number
      const currentSemester = branchSemesters.find(s => 
        s.semester_number === currentSemesterNumber
      ) || branchSemesters.find(s => 
        Math.abs(s.semester_number - currentSemesterNumber) <= 1
      ) || branchSemesters[Math.min(currentSemesterNumber - 1, branchSemesters.length - 1)] || branchSemesters[0];

      if (currentSemester) {
        // Load subjects for the current semester
        const semesterSubjects = await getSubjects(currentSemester.id);
        setCurrentSemesterSubjects(semesterSubjects);
      } else {
        setCurrentSemesterSubjects([]);
      }
    } catch (error) {
      console.error('Failed to load current semester subjects:', error);
      setCurrentSemesterSubjects([]);
    } finally {
      setIsLoadingCurrentSemesterSubjects(false);
    }
  };

  const loadSemestersForBranch = async (branchId: number) => {
    try {
      const data = await getSemesters(branchId);
      setSelectedSemesterId(null);
      setSubjects([]);
      // Load all subjects for all semesters in this branch
      loadAllBranchSubjects(branchId, data);
    } catch (error) {
      console.error('Failed to load semesters:', error);
    }
  };

  // Load all subjects from all semesters in the branch
  const loadAllBranchSubjects = async (_branchId: number, semestersList: Semester[]) => {
    try {
      const allSubjects: Subject[] = [];
      
      // Fetch subjects for each semester
      for (const semester of semestersList) {
        try {
          const subjectsData = await getSubjects(semester.id);
          allSubjects.push(...subjectsData);
        } catch (error) {
          console.error(`Failed to load subjects for semester ${semester.id}:`, error);
        }
      }
      
      setAllBranchSubjects(allSubjects);
    } catch (error) {
      console.error('Failed to load branch subjects:', error);
      setAllBranchSubjects([]);
    }
  };

  // Load subjects when semester is selected (for the old semester/subject selection cards)
  useEffect(() => {
    if (selectedSemesterId) {
      const loadSubjects = async () => {
        try {
          setSelectedSubjectId(null);
          const data = await getSubjects(selectedSemesterId);
          setSubjects(data);
        } catch (error) {
          console.error('Failed to load subjects:', error);
          setSubjects([]);
        }
      };
      loadSubjects();
    } else {
      setSubjects([]);
      setSelectedSubjectId(null);
    }
  }, [selectedSemesterId]);

  // Load recent chats for Continue Learning section
  useEffect(() => {
    const loadRecentChats = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoadingRecentChats(true);
        const chats = await getChats();
        
        // Get the 10 most recent chats
        const recentChatsList = chats.slice(0, 10);
        
        // Fetch first question and answer for each chat
        const chatsWithQuestions = await Promise.all(
          recentChatsList.map(async (chat) => {
            try {
              const messages = await getChatMessages(chat.id);
              // Find first USER message (the question)
              const firstUserMessage = messages.find(msg => msg.sender === 'USER');
              // Find first BOT message (the answer)
              const firstBotMessage = messages.find(msg => msg.sender === 'BOT');
              
              return {
                chat,
                firstQuestion: firstUserMessage?.message || 'No question found',
                answer: firstBotMessage?.message || 'No answer yet'
              };
            } catch (error) {
              console.error(`Failed to load messages for chat ${chat.id}:`, error);
              return {
                chat,
                firstQuestion: 'Failed to load question',
                answer: 'Failed to load answer'
              };
            }
          })
        );
        
        setRecentChats(chatsWithQuestions);
      } catch (error) {
        console.error('Failed to load recent chats:', error);
        setRecentChats([]);
      } finally {
        setIsLoadingRecentChats(false);
      }
    };
    
    if (isAuthenticated && user?.role === 'student') {
      loadRecentChats();
    }
  }, [isAuthenticated, user]);

  // Load questions today count
  useEffect(() => {
    const loadQuestionsToday = async () => {
      if (!isAuthenticated || user?.role !== 'student') return;
      
      try {
        const data = await getQuestionsToday();
        setQuestionsToday(data.questions_today);
      } catch (error) {
        console.error('Failed to load questions today:', error);
        setQuestionsToday(0);
      }
    };
    
    if (isAuthenticated && user?.role === 'student') {
      loadQuestionsToday();
    }
  }, [isAuthenticated, user]);

  // Calculate streak based on chat activity
  const calculateStreak = async () => {
    try {
      const chats = await getChats();
      
      if (chats.length === 0) {
        setStreak(0);
        return;
      }

      // Get unique dates from chat creation dates
      const activityDates = new Set<string>();
      chats.forEach(chat => {
        const chatDate = new Date(chat.created_at);
        const dateStr = chatDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        activityDates.add(dateStr);
      });

      // Convert to sorted array of dates
      const sortedDates = Array.from(activityDates).sort().reverse();
      
      if (sortedDates.length === 0) {
        setStreak(0);
        return;
      }

      // Calculate streak from today backwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentStreak = 0;
      let checkDate = new Date(today);
      
      // Check if there's activity today
      const todayStr = today.toISOString().split('T')[0];
      if (sortedDates.includes(todayStr)) {
        currentStreak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If no activity today, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = checkDate.toISOString().split('T')[0];
        if (!sortedDates.includes(yesterdayStr)) {
          setStreak(0);
          return;
        }
        currentStreak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Continue checking consecutive days backwards
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (sortedDates.includes(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      setStreak(currentStreak);
    } catch (error) {
      console.error('Failed to calculate streak:', error);
      setStreak(0);
    }
  };

  // Load streak on mount
  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      calculateStreak();
    }
  }, [isAuthenticated, user]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-600">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleStartChat = async (subjectId?: number) => {
    setIsLoading(true);
    try {
      const chat = subjectId 
        ? await startChat(subjectId, subjects.find(s => s.id === subjectId)?.name || 'Subject Chat')
        : await startChat(undefined, 'Branch Chat');
      navigate(`/chat/${chat.id}`);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      alert(error.response?.data?.detail || 'Error starting chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = async () => {
    if (!questionText.trim()) return;
    
    setIsLoading(true);
    try {
      const chat = selectedSubjectForQuestion
        ? await startChat(selectedSubjectForQuestion, currentSemesterSubjects.find(s => s.id === selectedSubjectForQuestion)?.name || 'Subject Chat')
        : await startChat(undefined, 'Branch Chat');
      
      // Navigate to chat and the question will be sent automatically
      navigate(`/chat/${chat.id}`, { state: { initialQuestion: questionText } });
    } catch (error: any) {
      console.error('Error starting chat:', error);
      alert(error.response?.data?.detail || 'Error starting chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stats data
  const stats = {
    questionsToday: questionsToday,
    quizScore: 94,
    enrolledCourses: subjects.length || 12,
    streak: streak
  };

  const quickActions = [
    { icon: MessageSquare, label: 'Ask Question', desc: 'Get instant AI answers', color: 'blue', onClick: () => handleStartChat() },
    { icon: History, label: 'Study History', desc: 'Review past questions', color: 'orange', onClick: () => navigate('/chats') }
  ];

  // Format time ago helper
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  };

  // Get color and icon for subject
  const getSubjectColorAndIcon = (_subjectName: string | null, index: number) => {
    const colors = ['blue', 'green', 'purple', 'orange'];
    const color = colors[index % colors.length];
    const icon = MessageSquare; // Always use MessageSquare icon
    return { color, icon };
  };

  const activeCourses = allBranchSubjects.slice(0, 4).map((subject, index) => ({
    ...subject,
    documents: 24 - index * 3,
    questions: 68 - index * 5,
    progress: 78 - index * 8,
    color: ['blue', 'green', 'purple', 'orange'][index] as string,
    icon: [Code, Brain, Database, Globe][index]
  }));

  // Fill with dummy courses if not enough subjects
  while (activeCourses.length < 4) {
    const dummyCourses = [
      { id: activeCourses.length + 1, semester_id: 1, name: 'Data Structures', documents: 24, questions: 68, progress: 78, color: 'blue', icon: Code },
      { id: activeCourses.length + 2, semester_id: 1, name: 'Machine Learning', documents: 18, questions: 52, progress: 65, color: 'green', icon: Brain },
      { id: activeCourses.length + 3, semester_id: 1, name: 'Database Systems', documents: 31, questions: 74, progress: 82, color: 'purple', icon: Database },
      { id: activeCourses.length + 4, semester_id: 1, name: 'Web Development', documents: 15, questions: 38, progress: 54, color: 'orange', icon: Globe }
    ];
    activeCourses.push(dummyCourses[activeCourses.length] as any);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {/* Sidebar */}
      <StudentSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        searchPlaceholder="Search courses, notes..."
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
                <h2 className="text-2xl font-bold text-gray-900">
                  {greeting}, {user?.name || 'Student'}! 👋
                </h2>
                <p className="text-sm text-gray-500">Ready to continue your learning journey?</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg border border-orange-200">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-bold text-orange-700">{stats.streak} Day Streak</span>
              </div>

              {/* <button className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button> */}
              
              {/* <Link
                to="/profile"
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
              >
                <Settings className="w-5 h-5" />
              </Link> */}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
            {/* Quick Stats Section */}
            <section className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    {stats.questionsToday > 0 && (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        {stats.questionsToday} {stats.questionsToday === 1 ? 'question' : 'questions'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.questionsToday}</h3>
                  <p className="text-sm text-gray-600">Questions Today</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Excellent</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.quizScore}%</h3>
                  <p className="text-sm text-gray-600">Quiz Score Average</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full">5 Active</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.enrolledCourses}</h3>
                  <p className="text-sm text-gray-600">Enrolled Courses</p>
                </div>
              </div>
            </section>

            {/* Quick Question Section */}
            <section className="mb-8">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl shadow-lg border-2 border-indigo-600/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
                
                <div className="relative z-10 p-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Ask Your Question</h3>
                  <p className="text-indigo-100 mb-6">Get instant AI-powered answers from your course materials</p>
                  
                  <div className="bg-white rounded-xl p-6 shadow-xl">
                    <div className="relative mb-4">
                      <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        className="w-full px-4 py-4 pr-32 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all resize-none"
                        rows={3}
                        placeholder="Ask any question from your syllabus..."
                      />
                      <div className="absolute right-3 bottom-3 flex items-center gap-2">
                        <button className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-600/5 rounded-lg transition-all" title="Voice Input">
                          <Mic className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all" title="Upload Image">
                          <ImageIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedSubjectForQuestion || ''}
                          onChange={(e) => setSelectedSubjectForQuestion(e.target.value ? parseInt(e.target.value) : null)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">All Subjects</option>
                          {currentSemesterSubjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <button
                        onClick={handleQuickQuestion}
                        disabled={!questionText.trim() || isLoading}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                        <span>Ask AI</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Subject Selection Section */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Select Subject</h3>
                <button className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-all flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex gap-3 overflow-x-auto pb-2">
                <button
                  onClick={() => handleStartChat()}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold whitespace-nowrap shadow-sm hover:bg-indigo-700 transition-all flex-shrink-0"
                >
                  All Subjects
                </button>
                {isLoadingCurrentSemesterSubjects ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading subjects...</span>
                  </div>
                ) : (
                  <>
                    {currentSemesterSubjects.map((subject, index) => {
                      const colorConfigs = [
                        { dot: 'bg-blue-500', hover: 'hover:border-blue-300 hover:bg-blue-50' },
                        { dot: 'bg-green-500', hover: 'hover:border-green-300 hover:bg-green-50' },
                        { dot: 'bg-purple-500', hover: 'hover:border-purple-300 hover:bg-purple-50' },
                        { dot: 'bg-orange-500', hover: 'hover:border-orange-300 hover:bg-orange-50' },
                        { dot: 'bg-red-500', hover: 'hover:border-red-300 hover:bg-red-50' }
                      ];
                      const config = colorConfigs[index % colorConfigs.length];
                      return (
                        <button
                          key={subject.id}
                          onClick={() => {
                            handleStartChat(subject.id);
                          }}
                          className={`px-6 py-3 bg-white text-gray-700 rounded-xl font-medium whitespace-nowrap border border-gray-200 ${config.hover} transition-all flex-shrink-0 flex items-center gap-2`}
                        >
                          <div className={`w-2 h-2 ${config.dot} rounded-full`}></div>
                          {subject.name}
                        </button>
                      );
                    })}
                    {currentSemesterSubjects.length === 0 && (
                      <div className="text-sm text-gray-500 px-4 py-2">
                        No subjects found for your current semester
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Quick Actions Section */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  const colorClasses = {
                    blue: 'bg-blue-600',
                    purple: 'bg-purple-600',
                    cyan: 'bg-cyan-600',
                    orange: 'bg-orange-600'
                  };
                  const textColorClasses = {
                    blue: 'text-blue-100',
                    purple: 'text-purple-100',
                    cyan: 'text-cyan-100',
                    orange: 'text-orange-100'
                  };
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      onClick={action.onClick}
                      className={`${colorClasses[action.color as keyof typeof colorClasses]} rounded-2xl p-6 text-white shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                    >
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="w-7 h-7" />
                      </div>
                      <h4 className="text-lg font-bold mb-1">{action.label}</h4>
                      <p className={`${textColorClasses[action.color as keyof typeof textColorClasses]} text-sm`}>{action.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Continue Learning Section */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Continue Learning</h3>
                <button
                  onClick={() => navigate('/chats')}
                  className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-all flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {isLoadingRecentChats ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading recent chats...</span>
                    </div>
                  </div>
                ) : recentChats.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent chats found. Start a new conversation to see it here!</p>
                  </div>
                ) : (
                  recentChats.map((item, index) => {
                    const { color, icon: Icon } = getSubjectColorAndIcon(item.chat.subject_name, index);
                    const colorClasses = {
                      blue: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-600' },
                      green: { bg: 'bg-green-50', text: 'text-green-600', badge: 'bg-green-50 text-green-600' },
                      purple: { bg: 'bg-purple-50', text: 'text-purple-600', badge: 'bg-purple-50 text-purple-600' },
                      orange: { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-50 text-orange-600' }
                    };
                    const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
                    const timeAgo = formatTimeAgo(item.chat.created_at);
                    const subjectName = item.chat.subject_name || 'Branch Chat';
                    
                    return (
                      <div
                        key={item.chat.id}
                        onClick={() => navigate(`/chat/${item.chat.id}`)}
                        className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-6 h-6 ${colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-semibold ${colors.badge} px-2 py-1 rounded`}>{subjectName}</span>
                              <span className="text-xs text-gray-500">{timeAgo}</span>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1 truncate">{item.firstQuestion}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">{item.answer}</p>
                          </div>
                          <button className="text-indigo-600 hover:text-indigo-700 flex-shrink-0">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Active Courses Section */}
            {/* <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Active Courses</h3>
                <button className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-all flex items-center gap-1">
                  Manage Courses <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {activeCourses.map((course, index) => {
                  const Icon = course.icon;
                  const colorClasses = {
                    blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:bg-blue-50' },
                    green: { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-200', hover: 'hover:bg-green-50' },
                    purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200', hover: 'hover:bg-purple-50' },
                    orange: { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-200', hover: 'hover:bg-orange-50' }
                  };
                  const colors = colorClasses[course.color as keyof typeof colorClasses];
                  return (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group">
                      <div className={`h-32 ${colors.bg} relative overflow-hidden`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon className="w-10 h-10 text-white group-hover:scale-110 transition-transform drop-shadow-lg" />
                        </div>
                      </div>
                      <div className="p-5">
                        <h4 className="font-bold text-gray-900 mb-2">{course.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{course.documents} documents • {course.questions} questions</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-500">Progress</span>
                          <span className={`text-xs font-semibold ${colors.text}`}>{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                          <div className={`${colors.bg} h-2 rounded-full`} style={{ width: `${course.progress}%` }}></div>
                        </div>
                        <button className={`w-full py-2 text-sm font-semibold ${colors.text} ${colors.hover} rounded-lg transition-all border ${colors.border}`}>
                          Continue Learning
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section> */}

            {/* Study Tips Section */}
            {/* <section className="mb-8">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Lightbulb className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Study Tip of the Day</h3>
                    <p className="text-sm text-gray-600">Personalized for your learning style</p>
                  </div>
                </div>
                <p className="text-gray-700 text-lg mb-4">
                  Try using the AI Quiz Generator to test your understanding of {selectedSubject?.name || 'your subjects'}. Regular practice with quizzes can improve retention by up to 40%!
                </p>
                <button className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all shadow-sm">
                  Generate Quiz Now
                </button>
              </div>
            </section> */}

            {/* Achievements Section */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Achievements</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                  <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-200">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">100 Questions</h4>
                  <p className="text-sm text-gray-600">Asked your 100th question!</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-orange-200">
                    <Flame className="w-10 h-10 text-orange-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{stats.streak} Day Streak</h4>
                  <p className="text-sm text-gray-600">Keep up the consistency!</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-200">
                    <Star className="w-10 h-10 text-blue-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Quiz Master</h4>
                  <p className="text-sm text-gray-600">Scored 95%+ on 5 quizzes</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-indigo-600 transition-all">Terms of Service</a>
              <a href="#" className="hover:text-indigo-600 transition-all">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-600 transition-all">Help Center</a>
              <a href="#" className="hover:text-indigo-600 transition-all">Contact Support</a>
            </div>
            <div className="text-sm text-gray-600">
              © 2024 StudyTap AI. All rights reserved.
            </div>
          </div>
        </footer>
      </main>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;

