// -----------------------------------------------------------------------------
// File: SelectSubjectPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Student dashboard for selecting semester and subject to start an AI chat
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { startChat, getBranches, getSemesters, getSubjects, type Branch, type Semester, type Subject } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Layers,
  MessageSquare
} from 'lucide-react';

const SelectSubjectPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [greeting, setGreeting] = useState('');
  const [isLoadingBranch, setIsLoadingBranch] = useState(false);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedSemester = semesters.find((s) => s.id === selectedSemesterId);

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
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Load student's branch on mount (getBranches returns only their branch)
  useEffect(() => {
    const loadBranch = async () => {
      try {
        setIsLoadingBranch(true);
        const data = await getBranches();
        if (data && data.length > 0) {
          const studentBranch = data[0]; // Student gets only their assigned branch
          setBranch(studentBranch);
          // Auto-load semesters for the student's branch
          loadSemestersForBranch(studentBranch.id);
        }
      } catch (error) {
        console.error('Failed to load branch:', error);
      } finally {
        setIsLoadingBranch(false);
      }
    };
    if (isAuthenticated && user?.role === 'student') {
      loadBranch();
    }
  }, [isAuthenticated, user]);

  const loadSemestersForBranch = async (branchId: number) => {
    try {
      setIsLoadingSemesters(true);
      const data = await getSemesters(branchId);
      setSemesters(data);
      setSelectedSemesterId(null);
      setSubjects([]);
    } catch (error) {
      console.error('Failed to load semesters:', error);
    } finally {
      setIsLoadingSemesters(false);
    }
  };

  // Load subjects when semester is selected
  useEffect(() => {
    if (selectedSemesterId) {
      const loadSubjects = async () => {
        try {
          setIsLoadingSubjects(true);
          setSelectedSubjectId(null);
          const data = await getSubjects(selectedSemesterId);
          setSubjects(data);
        } catch (error) {
          console.error('Failed to load subjects:', error);
          setSubjects([]);
        } finally {
          setIsLoadingSubjects(false);
        }
      };
      loadSubjects();
    } else {
      setSubjects([]);
      setSelectedSubjectId(null);
    }
  }, [selectedSemesterId]);

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

  const handleStartChat = async () => {
    if (!selectedSubject) return;
    
    setIsLoading(true);
    try {
      const chat = await startChat(selectedSubject.id, selectedSubject.name);
      navigate(`/chat/${chat.id}`);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      alert(error.response?.data?.detail || 'Error starting chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBranchChat = async () => {
    setIsLoading(true);
    try {
      const chat = await startChat(undefined, 'Branch Chat');
      navigate(`/chat/${chat.id}`);
    } catch (error: any) {
      console.error('Error starting branch chat:', error);
      alert(error.response?.data?.detail || 'Error starting branch chat. Please try again.');
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

      <div className="relative py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Greeting Section */}
          <div className="text-center mb-8">
            
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {greeting}, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user?.name || 'Student'}</span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Start an AI-powered learning session with all your branch materials, or select a specific subject
            </p>

            {/* Branch Chat Button - Prominent and Always Visible */}
            {branch && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-md mx-auto mb-8"
              >
                <motion.button
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                  onClick={handleStartBranchChat}
                  disabled={isLoading}
                  className="w-full py-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl 
                            hover:from-green-700 hover:to-emerald-700 
                            disabled:opacity-50 disabled:cursor-not-allowed 
                            transition-all font-bold text-xl shadow-2xl hover:shadow-3xl cursor-pointer
                            flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="h-6 w-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Starting Branch Chat...</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-6 h-6" />
                      <span>Start Branch Chat</span>
                      <Sparkles className="w-6 h-6" />
                    </>
                  )}
                </motion.button>
                <p className="text-sm text-gray-500 mt-3">
                  Access all materials from your branch: <span className="font-semibold text-gray-700">{branch.name}</span>
                </p>
              </motion.div>
            )}
          </div>

          {/* Divider with "OR" text */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 text-gray-500 font-medium">
                OR Select a Specific Subject
              </span>
            </div>
          </div>

          {/* Branch Info Card (Read-only) - Clean Design */}
          {isLoadingBranch ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading your branch...
            </div>
          ) : branch ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Your Branch</p>
                  <h3 className="text-xl font-bold text-gray-900">{branch.name}</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs font-medium text-blue-700">Assigned</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="mb-8 text-center py-8 bg-red-50 border-2 border-red-200 rounded-2xl">
              <p className="text-red-700 font-medium">No branch assigned. Please contact your administrator.</p>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Semester Selection Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-[500px]"
            >
              <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <Layers className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Select Semester</h2>
              </div>

              <div className="flex-1 flex flex-col min-h-0 px-6 py-6">
                {isLoadingSemesters ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm">Loading semesters...</p>
                    </div>
                  </div>
                ) : semesters.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No semesters available. Contact your admin.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100 pr-2 py-1 space-y-3" style={{ scrollBehavior: 'smooth' }}>
                    {semesters.map((semester) => {
                      const isActive = selectedSemesterId === semester.id;
                      return (
                        <motion.button
                          key={semester.id}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => {
                            setSelectedSemesterId(semester.id);
                            setSelectedSubjectId(null);
                          }}
                          className={`w-full flex items-center gap-4 rounded-xl px-5 py-4 text-left border-2 transition-all cursor-pointer
                            ${
                              isActive
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                            }`}
                        >
                          <div className={`p-3 rounded-xl ${
                            isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                          }`}>
                            <Layers className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-base mb-1">{semester.name}</p>
                            <p className="text-sm text-gray-600">Semester {semester.semester_number}</p>
                          </div>
                          {isActive && (
                            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-semibold">
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                              Selected
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Subject Selection Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-[500px]"
            >
              <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
                <div className="p-2.5 bg-indigo-100 rounded-xl">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Select Subject</h2>
              </div>

              <div className="flex-1 flex flex-col min-h-0 px-6 py-6">
                {!selectedSemesterId ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Select a semester first</p>
                    </div>
                  </div>
                ) : isLoadingSubjects ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm">Loading subjects...</p>
                    </div>
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No subjects available for this semester.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100 pr-2 py-1 space-y-3" style={{ scrollBehavior: 'smooth' }}>
                    {subjects.map((subject) => {
                      const isActive = selectedSubjectId === subject.id;
                      return (
                        <motion.button
                          key={subject.id}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setSelectedSubjectId(subject.id)}
                          className={`w-full flex items-center gap-4 rounded-xl px-5 py-4 text-left border-2 transition-all cursor-pointer
                            ${
                              isActive
                                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                            }`}
                        >
                          <div className={`p-3 rounded-xl ${
                            isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'
                          }`}>
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-base">{subject.name}</p>
                          </div>
                          {isActive && (
                            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-semibold">
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                              Selected
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Subject Selection Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-4"
          >
            {/* Summary Card */}
            {branch && selectedSemester && selectedSubject && (
              <div className="bg-white/80 border border-gray-200 rounded-2xl px-6 py-4">
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <span className="font-medium">Ready to start:</span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {branch.name}
                  </span>
                  <span className="text-gray-400">›</span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                    <Layers className="w-3.5 h-3.5" />
                    {selectedSemester.name}
                  </span>
                  <span className="text-gray-400">›</span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                    <BookOpen className="w-3.5 h-3.5" />
                    {selectedSubject.name}
                  </span>
                </div>
              </div>
            )}

            {/* Subject-specific Chat Button */}
            <motion.button
              whileHover={!isLoading && selectedSubjectId ? { scale: 1.01 } : {}}
              whileTap={!isLoading && selectedSubjectId ? { scale: 0.99 } : {}}
              onClick={handleStartChat}
              disabled={!selectedSubjectId || isLoading}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl 
                        hover:from-blue-700 hover:to-indigo-700 
                        disabled:opacity-50 disabled:cursor-not-allowed 
                        transition-all font-bold text-lg shadow-xl hover:shadow-2xl cursor-pointer
                        flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Starting Subject Chat...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  <span>Start Subject Chat</span>
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </motion.button>

            {!selectedSubjectId && (
              <p className="text-center text-sm text-gray-500">
                Select a semester and subject above to start a subject-specific chat
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SelectSubjectPage;
