// -----------------------------------------------------------------------------
// File: Navbar.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Main navigation bar component with user menu and admin links
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProfileModal from './ProfileModal';
import { motion } from "framer-motion";
import { 
  Brain, 
  MessageSquare, 
  LogOut, 
  LogIn, 
  Zap,
  User,
  ChevronDown,
  Home,
  GraduationCap,
  Settings,
  BookOpen
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  if (location.pathname === "/") return null;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/80 shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo with Icon */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent tracking-tight">
                  CampusMind AI
                </span>
                <span className="text-xs text-gray-500 -mt-1 font-medium">
                  Smart Learning Companion
                </span>
              </div>
            </Link>

            {/* Right side */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">

                {/* Dashboard */}
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl 
                             text-sm font-semibold text-blue-700 bg-blue-50/80 
                             border border-blue-200/60 hover:bg-blue-100 hover:border-blue-300 
                             transition-all duration-200 hover:shadow-md"
                >
                  <GraduationCap className="w-4 h-4" />
                  Dashboard
                </Link>

                {/* My Chats */}
                <Link
                  to="/chats"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                             text-sm font-semibold text-gray-700 bg-white
                             border border-gray-200 hover:bg-gray-50 hover:border-gray-300
                             transition-all duration-200 hover:shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  My Chats
                </Link>

                {/* Admin Panel - Only show for admins */}
                {user?.role === 'admin' && (
                  <>
                    <Link
                      to="/admin/materials"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                                 text-sm font-semibold text-purple-700 bg-purple-50/80
                                 border border-purple-200/60 hover:bg-purple-100 hover:border-purple-300
                                 transition-all duration-200 hover:shadow-md"
                    >
                      <Settings className="w-4 h-4" />
                      Materials
                    </Link>
                    <Link
                      to="/admin/academics"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                                 text-sm font-semibold text-purple-700 bg-purple-50/80
                                 border border-purple-200/60 hover:bg-purple-100 hover:border-purple-300
                                 transition-all duration-200 hover:shadow-md"
                    >
                      <GraduationCap className="w-4 h-4" />
                      Manage Courses & Subjects
                    </Link>
                  </>
                )}

                {/* Profile - Fixed */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl 
                             text-sm font-semibold text-gray-700 bg-white
                             border border-gray-200 hover:bg-gray-50 hover:border-gray-300
                             transition-all duration-200 hover:shadow-md"
                >
                  <div className="w-6 h-6 rounded-full 
                                  bg-gradient-to-br from-blue-600 to-blue-700
                                  flex items-center justify-center 
                                  text-white font-semibold text-xs uppercase">
                    {user?.name?.charAt(0) || <User className="w-3 h-3" />}
                  </div>
                  <span className="text-gray-800">{user.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </motion.button>

                {/* Logout */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold 
                             text-red-600 bg-red-50/80 border border-red-200/60 
                             rounded-xl hover:bg-red-100 hover:border-red-300
                             transition-all duration-200 hover:shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </motion.button>

              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                             text-sm font-semibold text-gray-700 bg-white
                             border border-gray-200 hover:bg-gray-50 hover:border-gray-300
                             transition-all duration-200 hover:shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                             text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700
                             hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl
                             transition-all duration-200"
                >
                  <Zap className="w-4 h-4" />
                  Get Started
                </Link>
              </div>
            )}

          </div>
        </div>
      </nav>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
};

export default Navbar;