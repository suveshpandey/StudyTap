// -----------------------------------------------------------------------------
// File: AdminSidebar.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Universal sidebar component for university admin pages
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  GraduationCap,
  Search,
  X,
  TrendingUp,
  Users,
  BookOpen,
  FileText,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  totalStudents?: number;
  totalDocuments?: number;
  totalQuestions?: number;
  totalSubjects?: number;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

const AdminSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  totalStudents,
  totalDocuments,
  totalQuestions,
  totalSubjects,
  searchPlaceholder = 'Search students, courses...',
  onSearch,
}: AdminSidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === path;
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
              <p className="text-xs text-gray-500">Admin Portal</p>
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
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {/* Dashboard */}
        <div className="mb-6">
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive('/admin/dashboard')
                ? 'bg-indigo-600/10 text-indigo-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Management */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
            Management
          </h3>
          <div className="space-y-1">
            <Link
              to="/admin/students"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                isActive('/admin/students')
                  ? 'bg-indigo-600/10 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className={`w-4 h-4 ${isActive('/admin/students') ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className="text-sm">Students</span>
              {totalStudents !== undefined && (
                <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {totalStudents > 1000 ? `${(totalStudents / 1000).toFixed(1)}K` : totalStudents}
                </span>
              )}
            </Link>
            <Link
              to="/admin/academics"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                isActive('/admin/academics')
                  ? 'bg-indigo-600/10 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${isActive('/admin/academics') ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className="text-sm">Courses</span>
              {totalSubjects !== undefined && (
                <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {totalSubjects}
                </span>
              )}
            </Link>
            <Link
              to="/admin/materials"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                isActive('/admin/materials')
                  ? 'bg-indigo-600/10 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText className={`w-4 h-4 ${isActive('/admin/materials') ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className="text-sm">Documents</span>
              {totalDocuments !== undefined && (
                <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {totalDocuments > 1000 ? `${(totalDocuments / 1000).toFixed(1)}K` : totalDocuments}
                </span>
              )}
            </Link>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Questions</span>
              {totalQuestions !== undefined && (
                <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {totalQuestions > 1000 ? `${(totalQuestions / 1000).toFixed(1)}K` : totalQuestions}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Analytics */}
        {/* <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
            Analytics
          </h3>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Reports</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
              <PieChart className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Usage Stats</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
              <Download className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Export Data</span>
            </button>
          </div>
        </div> */}

        {/* System */}
        {/* <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
            System
          </h3>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Notifications</span>
              <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Security</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
              <LifeBuoy className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Support</span>
            </button>
          </div>
        </div> */}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200">
        {/* System Status */}
        <div className="bg-indigo-50 rounded-xl p-4 mb-3 border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">System Status</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Healthy
            </span>
          </div>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Server Load</span>
              <span className="font-semibold">42%</span>
            </div>
            <div className="flex justify-between">
              <span>API Response</span>
              <span className="font-semibold">124ms</span>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div
          onClick={() => navigate('/university-admin/profile')}
          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-all"
        >
          <div className="w-10 h-10 bg-indigo-600/20 rounded-full border-2 border-indigo-600/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-indigo-600">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
            <p className="text-xs text-gray-500">{user?.email || 'admin@university.edu'}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;

