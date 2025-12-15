// -----------------------------------------------------------------------------
// File: StudentSidebar.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Universal sidebar component for student pages
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  GraduationCap,
  Search,
  X,
  Home,
  Plus,
  MessageSquare,
  History,
  ChevronRight,
  User,
} from 'lucide-react';
import { getBranches, getSemesters, getSubjects, getStudentProfile, startChat, type Subject } from '../api/client';

interface StudentSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

const StudentSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  searchPlaceholder = 'Search courses, notes...',
  onSearch,
}: StudentSidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSemesterSubjects, setCurrentSemesterSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  // Load current semester subjects
  useEffect(() => {
    const loadCurrentSemesterSubjects = async () => {
      if (!user || user.role !== 'student') return;
      
      try {
        setIsLoadingSubjects(true);
        
        // Get student profile to access batch_year
        const profile = await getStudentProfile();
        setUserName(profile.name || '');
        setUserEmail(profile.email || '');
        
        if (!profile.batch_year) {
          setCurrentSemesterSubjects([]);
          return;
        }

        // Get all branches
        const branches = await getBranches();
        if (branches.length === 0) {
          setCurrentSemesterSubjects([]);
          return;
        }

        const branchId = branches[0].id;

        // Get all semesters for the branch
        const branchSemesters = await getSemesters(branchId);
        if (branchSemesters.length === 0) {
          setCurrentSemesterSubjects([]);
          return;
        }

        // Calculate current semester based on batch_year
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // 0-11
        const batchYear = profile.batch_year;

        // Calculate which academic year we're in
        let academicYear = currentYear;
        if (currentMonth < 7) {
          academicYear = currentYear - 1;
        }

        const yearsPassed = academicYear - batchYear;
        const semesterInYear = currentMonth >= 7 ? 1 : 2; // Aug-Jan = 1, Feb-Jul = 2
        const estimatedSemesterNumber = yearsPassed * 2 + semesterInYear;

        // Find the closest semester
        const closestSemester = branchSemesters.find(s => 
          Math.abs(s.semester_number - estimatedSemesterNumber) <= 1
        ) || branchSemesters[Math.min(estimatedSemesterNumber - 1, branchSemesters.length - 1)] || branchSemesters[0];

        if (closestSemester) {
          // Load subjects for current semester
          const subjects = await getSubjects(closestSemester.id);
          setCurrentSemesterSubjects(subjects);
        } else {
          setCurrentSemesterSubjects([]);
        }
      } catch (error) {
        console.error('Failed to load current semester subjects:', error);
        setCurrentSemesterSubjects([]);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    loadCurrentSemesterSubjects();
  }, [user]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleStartChat = async (subjectId?: number) => {
    try {
      const chat = subjectId 
        ? await startChat(subjectId, currentSemesterSubjects.find(s => s.id === subjectId)?.name || 'Subject Chat')
        : await startChat(undefined, 'Branch Chat');
      navigate(`/chat/${chat.id}`);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      alert(error.response?.data?.detail || 'Error starting chat. Please try again.');
    }
  };

  const isActive = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/home' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">StudyTap AI</h1>
              <p className="text-xs text-gray-500">Smart Learning Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <button
            onClick={() => handleStartChat()}
            className="w-full bg-indigo-600 text-white rounded-xl px-4 py-3 font-semibold shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Question</span>
          </button>
        </div>

        <div className="mb-6">
          <Link
            to="/home"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive('/home')
                ? 'bg-indigo-600/10 text-indigo-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
            Quick Actions
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => handleStartChat()}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
            >
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Ask Question</span>
              <span className="ml-auto bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">AI</span>
            </button>
            <Link
              to="/chats"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
            >
              <History className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Study History</span>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
            My Subjects
          </h3>
          {isLoadingSubjects ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading subjects...</span>
              </div>
            </div>
          ) : currentSemesterSubjects.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-gray-500">No subjects found for your current semester</p>
            </div>
          ) : (
            <div className="space-y-1">
              {currentSemesterSubjects.map((subject, index) => {
                const colorClasses = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
                return (
                  <button
                    key={subject.id}
                    onClick={() => handleStartChat(subject.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                  >
                    <div className={`w-2 h-2 ${colorClasses[index % colorClasses.length]} rounded-full`}></div>
                    <span className="text-sm">{subject.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-all"
        >
          <div className="w-10 h-10 bg-indigo-600/20 rounded-full border-2 border-indigo-600/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-indigo-600">
              {userName?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{userName || user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{userEmail || user?.email || 'user@university.edu'}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>
    </aside>
  );
};

export default StudentSidebar;

