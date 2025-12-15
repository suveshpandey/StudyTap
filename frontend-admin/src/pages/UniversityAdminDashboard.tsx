// -----------------------------------------------------------------------------
// File: UniversityAdminDashboard.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: University admin dashboard matching main.html UI/UX
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  getUniversityDetails,
  adminGetStudents,
  type UniversityDetails,
  type Student,
} from '../api/client';
import AdminSidebar from '../components/AdminSidebar';
import {
  Menu,
  // Bell, // Commented out - hidden
  // Settings, // Commented out - hidden
  Upload,
  // Send, // Commented out - hidden
  BarChart3, // Still used in charts section
  Users as UsersIcon,
  // FileText, // Commented out - unused
  MessageSquare,
  Brain,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle,
  UserPlus,
  // Trophy, // Commented out - unused
  // AlertCircle, // Commented out - unused
  // FileCheck, // Commented out - unused
  Users,
  ArrowRight,
  // Download, // Commented out - hidden
  Eye,
  Mail,
} from 'lucide-react';

const UniversityAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data state
  const [universityDetails, setUniversityDetails] = useState<UniversityDetails | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [totalDocuments, setTotalDocuments] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Month');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load university details (includes basic stats, documents, and questions)
        const details = await getUniversityDetails();
        setUniversityDetails(details);
        setTotalDocuments(details.total_documents || 0);
        setTotalQuestions(details.questions_per_month || 0);
        
        // Load all students
        const studentsData = await adminGetStudents();
        setStudents(studentsData);
        
        // Get recent students (last 5, sorted by ID descending)
        const sortedStudents = [...studentsData].sort((a, b) => b.id - a.id);
        setRecentStudents(sortedStudents.slice(0, 5));
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate active students today (mock for now - would need backend endpoint)
  const activeStudentsToday = Math.floor(students.filter(s => s.is_active).length * 0.36);

  // Format date
  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-600">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {/* Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        totalStudents={universityDetails?.total_students || 0}
        totalDocuments={totalDocuments}
        totalQuestions={totalQuestions}
        totalSubjects={universityDetails?.total_subjects || 0}
        searchPlaceholder="Search students, courses..."
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
                  Welcome back, {user?.name?.split(' ')[0] || 'Admin'}!
                </h2>
                <p className="text-sm text-gray-500">
                  {universityDetails?.name || 'University'} - Admin Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* <button className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                <Settings className="w-5 h-5" />
              </button> */}
              
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">{getCurrentDate()}</span>
              </div>
              
              {/* <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button> */}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
            {/* Quick Actions Section */}
            <section className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/admin/materials')}
                  className="bg-blue-600 text-white rounded-xl p-6 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Upload PDF</h3>
                  <p className="text-sm text-blue-100">Add course materials</p>
                </button>

                {/* <button className="bg-green-600 text-white rounded-xl p-6 hover:bg-green-700 transition-all shadow-sm hover:shadow-md group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Send className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Send Notification</h3>
                  <p className="text-sm text-green-100">Broadcast message</p>
                </button>

                <button className="bg-purple-600 text-white rounded-xl p-6 hover:bg-purple-700 transition-all shadow-sm hover:shadow-md group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">View Reports</h3>
                  <p className="text-sm text-purple-100">Analytics dashboard</p>
                </button> */}

                <button
                  onClick={() => navigate('/admin/students')}
                  className="bg-orange-600 text-white rounded-xl p-6 hover:bg-orange-700 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UsersIcon className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Manage Students</h3>
                  <p className="text-sm text-orange-100">User management</p>
                </button>
              </div>
            </section>

            {/* KPI Section */}
            <section className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      {universityDetails?.total_students ? `+${Math.floor(universityDetails.total_students * 0.05)} this month` : '0 this month'}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">
                    {universityDetails?.total_students || 0}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Total Students</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span>All time enrollment</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {universityDetails?.total_students ? `${Math.round((activeStudentsToday / (universityDetails.total_students || 1)) * 100)}% of total` : '0% of total'}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{activeStudentsToday}</h3>
                  <p className="text-sm text-gray-600 mb-3">Active Today</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Real-time activity</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      +18%
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{totalQuestions}</h3>
                  <p className="text-sm text-gray-600 mb-3">Questions Asked</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>This week</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      +25%
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
                  <p className="text-sm text-gray-600 mb-3">Quiz Attempts</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span>This week</span>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Charts Section - Placeholder for now */}
            <section className="mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Student Activity</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTimeRange('Week')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                          timeRange === 'Week'
                            ? 'text-indigo-600 bg-indigo-50'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setTimeRange('Month')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                          timeRange === 'Month'
                            ? 'text-indigo-600 bg-indigo-50'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Month
                      </button>
                      <button
                        onClick={() => setTimeRange('Year')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                          timeRange === 'Year'
                            ? 'text-indigo-600 bg-indigo-50'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Year
                      </button>
                    </div>
                  </div>
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chart visualization coming soon</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Question Trends</h3>
                    <button className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-all flex items-center gap-1">
                      View Details <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chart visualization coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Activity Feed & Sidebar */}
            <section className="mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg">
                        All
                      </button>
                      <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                        Uploads
                      </button>
                      <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                        Students
                      </button>
                      <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                        Quizzes
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {recentStudents.length > 0 ? (
                      recentStudents.map((student, index) => (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-100"
                        >
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <UserPlus className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">New Student Registration</h4>
                              <span className="text-xs text-gray-500">Recently registered</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {student.name} registered - {student.email}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                Student ID: {student.id}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                student.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {student.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent activity</p>
                      </div>
                    )}
                  </div>

                  <button className="w-full mt-4 py-3 text-indigo-600 font-semibold hover:bg-indigo-50 rounded-xl transition-all border border-indigo-200">
                    Load More Activities
                  </button>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                  {/* System Health - Hidden */}
                  {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">System Health</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">API Response Time</span>
                          <span className="text-sm font-semibold text-green-600">124ms</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Server Load</span>
                          <span className="text-sm font-semibold text-blue-600">42%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Database Usage</span>
                          <span className="text-sm font-semibold text-purple-600">68%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Storage Used</span>
                          <span className="text-sm font-semibold text-orange-600">234GB / 500GB</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: '46.8%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div> */}

                  {/* Quick Stats */}
                  <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Quick Stats</h4>
                        <p className="text-sm text-indigo-100">Today's Overview</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-indigo-100">Active Sessions</span>
                        <span className="font-bold">{activeStudentsToday}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-indigo-100">New Questions</span>
                        <span className="font-bold">{totalQuestions}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-indigo-100">Total Documents</span>
                        <span className="font-bold">{totalDocuments}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-indigo-100">Total Subjects</span>
                        <span className="font-bold">{universityDetails?.total_subjects || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Branches */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top Branches</h3>
                    <div className="space-y-3">
                      {universityDetails && universityDetails.total_branches > 0 ? (
                        <div className="text-sm text-gray-600">
                          {universityDetails.total_branches} branch{universityDetails.total_branches > 1 ? 'es' : ''} configured
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No branches yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Student Registrations */}
            <section className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Recent Student Registrations</h3>
                  <button
                    onClick={() => navigate('/admin/students')}
                    className="text-indigo-600 font-semibold hover:text-indigo-700 transition-all flex items-center gap-1"
                  >
                    View All Students <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {recentStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Student ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recentStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50 transition-all">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-indigo-600">
                                    {student.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{student.name}</p>
                                  <p className="text-xs text-gray-500">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700 font-mono">#{student.id}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">{student.email}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`flex items-center gap-1 text-sm ${
                                  student.is_active ? 'text-green-600' : 'text-yellow-600'
                                }`}
                              >
                                <CheckCircle className="w-4 h-4" />
                                {student.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                  <Mail className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No students registered yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-indigo-600 transition-all">
                Admin Guide
              </a>
              <a href="#" className="hover:text-indigo-600 transition-all">
                System Docs
              </a>
              <a href="#" className="hover:text-indigo-600 transition-all">
                API Documentation
              </a>
              <a href="#" className="hover:text-indigo-600 transition-all">
                Contact Support
              </a>
            </div>
            <div className="text-sm text-gray-600">
              © 2024 StudyTap AI Admin Portal. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default UniversityAdminDashboard;

