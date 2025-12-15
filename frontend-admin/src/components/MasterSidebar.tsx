// -----------------------------------------------------------------------------
// File: MasterSidebar.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Universal sidebar component for master admin pages
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Shield,
  Search,
  X,
  TrendingUp,
  Building2,
  Users,
  GraduationCap,
  User,
  FileText,
  LogOut,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

interface MasterSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  totalUniversities?: number;
  totalStudents?: number;
  totalAdmins?: number;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

const MasterSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  totalUniversities,
  totalStudents,
  totalAdmins,
  actionButton,
  searchPlaceholder = 'Search...',
  onSearch,
}: MasterSidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const isActive = (path: string) => {
    if (path === '/master/dashboard') {
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
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">StudyTap AI</h1>
              <p className="text-xs text-gray-500">Master Admin Panel</p>
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
        {/* Action Button (if provided) */}
        {actionButton && (
          <div className="mb-6">
            <button
              onClick={actionButton.onClick}
              className="w-full bg-indigo-600 text-white rounded-xl px-4 py-3 font-semibold shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              {actionButton.icon}
              <span>{actionButton.label}</span>
            </button>
          </div>
        )}

        {/* Main Menu */}
        <div className="mb-6">
          <Link
            to="/master/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive('/master/dashboard')
                ? 'bg-indigo-600/10 text-indigo-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Platform Management */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
            Platform Management
          </h3>
          <div className="space-y-1">
            <Link
              to="/master/universities"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                isActive('/master/universities')
                  ? 'bg-indigo-600/10 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Building2 className={`w-4 h-4 ${isActive('/master/universities') ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className="text-sm">Universities</span>
              {totalUniversities !== undefined && (
                <span className="ml-auto bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {totalUniversities}
                </span>
              )}
            </Link>
            <Link
              to="/master/students"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                isActive('/master/students')
                  ? 'bg-indigo-600/10 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${isActive('/master/students') ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className="text-sm">All Students</span>
              {totalStudents !== undefined && (
                <span className="ml-auto text-xs text-gray-500">
                  {totalStudents > 1000 ? `${(totalStudents / 1000).toFixed(1)}K` : totalStudents}
                </span>
              )}
            </Link>
            <Link
              to="/master/admins"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                isActive('/master/admins')
                  ? 'bg-indigo-600/10 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className={`w-4 h-4 ${isActive('/master/admins') ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className="text-sm">Admin Users</span>
              {totalAdmins !== undefined && (
                <span className="ml-auto text-xs text-gray-500">{totalAdmins}</span>
              )}
            </Link>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-sm">All Documents</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200">
        {/* System Alert (only on dashboard) */}
        {/* {location.pathname === '/master/dashboard' && (
          <div className="bg-red-50 rounded-xl p-4 mb-3 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-900">System Alert</span>
            </div>
            <p className="text-xs text-red-700 mb-2">High API usage detected</p>
            <button className="w-full bg-red-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-red-700 transition-all">
              View Details
            </button>
          </div>
        )} */}

        {/* User Profile */}
        <Link
          to="/master-admin/profile"
          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-all"
        >
          <div className="w-10 h-10 bg-indigo-600/20 rounded-full border-2 border-indigo-600/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-indigo-600">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Super Admin'}</p>
            <p className="text-xs text-gray-500">{user?.email || 'admin@studytap.ai'}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>
    </aside>
  );
};

export default MasterSidebar;

