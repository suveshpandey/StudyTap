// -----------------------------------------------------------------------------
// File: StudentProfilePage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Student profile management page matching main.html UI/UX
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import StudentSidebar from '../components/StudentSidebar';
import { 
  getStudentProfile, 
  changeStudentPassword,
  getBranches,
  getSemesters,
  getSubjects,
  getChats,
  getChatMessages,
  getUniversities,
  type Branch,
  type Semester,
  type Subject,
  type University
} from '../api/client';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogOut, 
  Shield, 
  CheckCircle,
  GraduationCap,
  Search,
  Home,
  Plus,
  Menu,
  X,
  Bell,
  Settings,
  ChevronRight,
  Crown,
  Trophy,
  Star,
  Camera,
  Pen,
  Key,
  Info,
  FileText,
  Headphones,
  HelpCircle
} from 'lucide-react';

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Additional student info state
  const [university, setUniversity] = useState<University | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null);
  const [batchYear, setBatchYear] = useState<number | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [loadingAdditionalInfo, setLoadingAdditionalInfo] = useState(true);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'student')) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated || user?.role !== 'student') return;
      
      try {
        setProfileLoading(true);
        const profile = await getStudentProfile();
        setName(profile.name);
        setEmail(profile.email);
        setBatchYear(profile.batch_year || null);
        setCreatedAt(profile.created_at || null);
        
        // Load additional information
        await loadAdditionalInfo(profile);
      } catch (err: any) {
        console.error('Failed to load profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'student') {
      loadProfile();
    }
  }, [isAuthenticated, user]);

  // Load additional student information
  const loadAdditionalInfo = async (profile: any) => {
    try {
      setLoadingAdditionalInfo(true);
      
      // Load university
      if (profile.university_id) {
        const universities = await getUniversities();
        const studentUniversity = universities.find(u => u.id === profile.university_id);
        if (studentUniversity) {
          setUniversity(studentUniversity);
        }
      }
      
      // Load branch
      if (profile.branch_id) {
        const branches = await getBranches();
        const studentBranch = branches.find(b => b.id === profile.branch_id);
        if (studentBranch) {
          setBranch(studentBranch);
          
          // Load semesters for this branch
          const branchSemesters = await getSemesters(profile.branch_id);
          
          // Calculate current semester from batch_year (academic year starts in August)
          if (profile.batch_year) {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth(); // 0-11
            
            // Academic year starts in August (month 7)
            let academicYear = currentYear;
            if (currentMonth < 7) {
              academicYear = currentYear - 1;
            }
            
            const yearsPassed = academicYear - profile.batch_year;
            const semesterInYear = currentMonth >= 7 ? 1 : 2; // Aug-Jan = 1, Feb-Jul = 2
            const estimatedSemesterNumber = yearsPassed * 2 + semesterInYear;
            
            // Find the closest semester
            const closestSemester = branchSemesters.find(s => 
              Math.abs(s.semester_number - estimatedSemesterNumber) <= 1
            ) || branchSemesters[Math.min(estimatedSemesterNumber - 1, branchSemesters.length - 1)] || branchSemesters[0];
            
            if (closestSemester) {
              setCurrentSemester(closestSemester);
              
              // Load subjects for current semester only
              try {
                const subjects = await getSubjects(closestSemester.id);
                setAllSubjects(subjects);
              } catch (err) {
                console.error(`Failed to load subjects for semester ${closestSemester.id}:`, err);
              }
            }
          }
        }
      }
      
      // Count questions asked (USER messages in all chats)
      try {
        const chats = await getChats();
        let totalQuestions = 0;
        for (const chat of chats) {
          try {
            const messages = await getChatMessages(chat.id);
            const userMessages = messages.filter(m => m.sender === 'USER');
            totalQuestions += userMessages.length;
          } catch (err) {
            console.error(`Failed to load messages for chat ${chat.id}:`, err);
          }
        }
        setQuestionCount(totalQuestions);
      } catch (err) {
        console.error('Failed to load chats:', err);
      }
      
    } catch (err: any) {
      console.error('Failed to load additional info:', err);
    } finally {
      setLoadingAdditionalInfo(false);
    }
  };

  // Format created_at to "Month Year" format
  const formatMemberSince = (createdAt: string | null): string => {
    if (!createdAt) return 'N/A';
    try {
      const date = new Date(createdAt);
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear();
      return `${month} ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate passwords
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      await changeStudentPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setShowChangePassword(false);
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-600">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') {
    return null;
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
                <h2 className="text-2xl font-bold text-gray-900">Profile & Settings</h2>
                <p className="text-sm text-gray-500">Manage your account and preferences</p>
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
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
            {/* Profile Header Section */}
            <section className="mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500"></div>
                <div className="px-8 pb-8">
                  <div className="flex items-end justify-between -mt-16 mb-6">
                    <div className="flex items-end gap-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg bg-indigo-100 flex items-center justify-center">
                          <User className="w-16 h-16 text-indigo-600" />
                        </div>
                        <button className="absolute bottom-2 right-2 w-10 h-10 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center">
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="pb-2">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{name || 'Student'}</h3>
                        <p className="text-gray-600 mb-2">{email || 'student@university.edu'}</p>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-full">
                            <Crown className="w-3 h-3" />
                            Premium Member
                          </span>
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2">
                      <Pen className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-3xl font-bold text-gray-900 mb-1">{questionCount}</div>
                      <div className="text-sm text-gray-600">Questions Asked</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-3xl font-bold text-gray-900 mb-1">0</div>
                      <div className="text-sm text-gray-600">Quizzes Completed</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-3xl font-bold text-gray-900 mb-1">-</div>
                      <div className="text-sm text-gray-600">Avg Quiz Score</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-3xl font-bold text-orange-600 mb-1">🔥 0</div>
                      <div className="text-sm text-gray-600">Day Streak</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Academic Information Section */}
                <section>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Academic Information</h3>
                      <button className="text-indigo-600 font-semibold hover:text-indigo-700 transition-all flex items-center gap-1">
                        <Pen className="w-4 h-4" />
                        Edit
                      </button>
                    </div>

                    {loadingAdditionalInfo ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-3 text-indigo-600">
                          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm font-medium">Loading information...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">University</label>
                          <div className="relative">
                            <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                              {university ? university.name : 'Not assigned'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Course/Program</label>
                          <div className="relative">
                            <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                              {branch ? branch.name : 'Not assigned'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Current Semester</label>
                          <div className="relative">
                            <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                              {currentSemester ? `${currentSemester.name} (Semester ${currentSemester.semester_number})` : 'Not available'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Enrolled Subjects</label>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[48px]">
                              {allSubjects.length > 0 ? (
                                allSubjects.map((subject, index) => {
                                  const colorClasses = [
                                    'bg-blue-50 text-blue-700',
                                    'bg-green-50 text-green-700',
                                    'bg-purple-50 text-purple-700',
                                    'bg-orange-50 text-orange-700',
                                    'bg-red-50 text-red-700',
                                  ];
                                  return (
                                    <span
                                      key={subject.id}
                                      className={`inline-flex items-center gap-2 px-3 py-1 ${colorClasses[index % colorClasses.length]} text-sm font-medium rounded-lg`}
                                    >
                                      {subject.name}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-sm text-gray-500">No subjects enrolled</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Settings & Preferences Section */}
                <section>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Settings & Preferences</h3>

                    <div className="space-y-6">
                      {/* Account Security */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-indigo-600" />
                          Account Security
                        </h4>
                        <div className="space-y-3 pl-6">
                          <button
                            onClick={() => setShowChangePassword(!showChangePassword)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <Key className="w-5 h-5 text-gray-600" />
                              <div className="text-left">
                                <p className="font-semibold text-gray-900 text-sm">Change Password</p>
                                <p className="text-xs text-gray-500">Update your account password</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </button>

                          {showChangePassword && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="p-4 bg-indigo-50 rounded-lg border border-indigo-200"
                            >
                              {passwordError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                  {passwordError}
                                </div>
                              )}
                              {passwordSuccess && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                                  {passwordSuccess}
                                </div>
                              )}
                              <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                      type={showCurrentPassword ? 'text' : 'password'}
                                      value={currentPassword}
                                      onChange={(e) => setCurrentPassword(e.target.value)}
                                      required
                                      className="w-full pl-11 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                      placeholder="Enter current password"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                      type={showNewPassword ? 'text' : 'password'}
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      required
                                      minLength={6}
                                      className="w-full pl-11 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                      placeholder="Enter new password (min 6 characters)"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowNewPassword(!showNewPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                      type={showConfirmPassword ? 'text' : 'password'}
                                      value={confirmPassword}
                                      onChange={(e) => setConfirmPassword(e.target.value)}
                                      required
                                      minLength={6}
                                      className="w-full pl-11 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                      placeholder="Confirm new password"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {changingPassword ? 'Changing...' : 'Save Changes'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowChangePassword(false);
                                      setCurrentPassword('');
                                      setNewPassword('');
                                      setConfirmPassword('');
                                      setPasswordError('');
                                      setPasswordSuccess('');
                                    }}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all border border-gray-200"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* About & Support Section */}
                <section>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">About & Support</h3>

                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <Info className="w-5 h-5 text-indigo-600" />
                          <div className="text-left">
                            <p className="font-semibold text-gray-900">App Version</p>
                            <p className="text-sm text-gray-500">v2.4.1 (Latest)</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">Up to date</span>
                      </button>

                      <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <p className="font-semibold text-gray-900">Terms of Service</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>

                      <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-gray-600" />
                          <p className="font-semibold text-gray-900">Privacy Policy</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>

                      <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <Headphones className="w-5 h-5 text-gray-600" />
                          <p className="font-semibold text-gray-900">Contact Support</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>

                      <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <HelpCircle className="w-5 h-5 text-gray-600" />
                          <p className="font-semibold text-gray-900">Help Center</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Logout Section */}
                <section>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-white hover:bg-red-50 rounded-xl transition-all border-2 border-red-200 shadow-sm"
                  >
                    <LogOut className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-red-600">Sign Out</span>
                  </button>
                </section>
              </div>

              {/* Right Column - Sidebar Cards */}
              <div className="space-y-6">
                {/* Premium Member Card */}
                <section>
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl p-6 text-white shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold">Premium Member</h4>
                      <Crown className="w-6 h-6" />
                    </div>
                    <p className="text-indigo-100 text-sm mb-4">Member since {formatMemberSince(createdAt)}</p>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Questions Used</span>
                        <span className="font-bold">{questionCount}/500</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-white h-2 rounded-full" style={{ width: `${Math.min((questionCount / 500) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                    <button className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-50 transition-all">
                      Manage Subscription
                    </button>
                  </div>
                </section>

                {/* Account Stats Card */}
                <section>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Account Stats</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Member Since</span>
                        <span className="font-semibold text-gray-900">{formatMemberSince(createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Total Questions</span>
                        <span className="font-semibold text-gray-900">{questionCount}</span>
                      </div>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Current Semester</span>
                        <span className="font-semibold text-gray-900">{currentSemester ? `Sem ${currentSemester.semester_number}` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Subjects</span>
                        <span className="font-semibold text-gray-900">{allSubjects.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Study Streak</span>
                        <span className="font-semibold text-orange-600">🔥 0 days</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Recent Achievements Card */}
                <section>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Recent Achievements</h4>
                    <div className="space-y-3">
                      {questionCount >= 100 && (
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">100 Questions</p>
                            <p className="text-xs text-gray-600">Asked 100+ questions</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Star className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Getting Started</p>
                          <p className="text-xs text-gray-600">Welcome to StudyTap AI</p>
                        </div>
                      </div>
                    </div>
                    <button className="w-full mt-4 py-2 text-indigo-600 font-semibold hover:bg-indigo-50 rounded-lg transition-all text-sm">
                      View All Achievements
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentProfilePage;
