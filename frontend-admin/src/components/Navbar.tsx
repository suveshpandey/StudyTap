// -----------------------------------------------------------------------------
// File: Navbar.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Global navigation bar component for admin frontend
// -----------------------------------------------------------------------------

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Building2, GraduationCap, FileText, Users, User, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Master Admin Navigation Items (main nav - left side)
  const masterAdminNavItems = [
    { path: '/master/universities', icon: Building2, label: 'Manage Universities', pageTitle: 'Manage Universities' },
    { path: '/master/admins', icon: Users, label: 'Manage Admins', pageTitle: 'Manage Admins' },
    { path: '/master/students', icon: GraduationCap, label: 'Manage Students', pageTitle: 'Manage Students' },
  ];

  // Master Admin Right Side Items
  const masterAdminRightItems = [
    { path: '/master-admin/profile', icon: User, label: 'Profile', pageTitle: 'Profile' },
  ];

  // University Admin Navigation Items (main nav - left side)
  const universityAdminNavItems = [
    { path: '/admin/academics', icon: GraduationCap, label: 'Manage Academics', pageTitle: 'Manage Academics' },
    { path: '/admin/students', icon: Users, label: 'Manage Students', pageTitle: 'Manage Students' },
    { path: '/admin/materials', icon: FileText, label: 'Manage Materials', pageTitle: 'Manage Materials' },
  ];

  // University Admin Right Side Items
  const universityAdminRightItems = [
    { path: '/admin/university/details', icon: Building2, label: 'University Details', pageTitle: 'University Details' },
    { path: '/university-admin/profile', icon: User, label: 'Profile', pageTitle: 'Profile' },
  ];

  // Get navigation items based on user role
  const getNavItems = () => {
    if (!user) return { main: [], right: [] };
    if (user.role === 'master_admin') {
      return { main: masterAdminNavItems, right: masterAdminRightItems };
    }
    if (user.role === 'university_admin') {
      return { main: universityAdminNavItems, right: universityAdminRightItems };
    }
    return { main: [], right: [] };
  };

  const { main: mainNavItems, right: rightNavItems } = getNavItems();

  // Check if current path matches
  const isActive = (path: string) => {
    if (path === '/master/universities') {
      // Match /master/universities and /master/universities/:id, but not /master/admins or /master/students
      return location.pathname.startsWith('/master/universities') && 
             !location.pathname.startsWith('/master/admins') && 
             !location.pathname.startsWith('/master/students');
    }
    if (path === '/master/admins') {
      return location.pathname === '/master/admins';
    }
    if (path === '/master/students') {
      return location.pathname === '/master/students';
    }
    // For university admin, check individual routes
    if (path === '/admin/academics') {
      return location.pathname === '/admin/academics';
    }
    if (path === '/admin/students') {
      return location.pathname === '/admin/students';
    }
    if (path === '/admin/materials') {
      return location.pathname === '/admin/materials';
    }
    if (path === '/admin/university/details') {
      return location.pathname === '/admin/university/details';
    }
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg group-hover:shadow-xl transition-shadow duration-200">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent tracking-tight">
                StudyTap
              </span>
              <span className="text-xs text-gray-500 -mt-1 font-medium">
                Admin Portal
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-1">
            {isAuthenticated && user ? (
              <>
                {/* Main Navigation Items (Left Side) */}
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer group ${
                        active ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      title={item.label}
                    >
                      {active && (
                        <motion.div
                          layoutId={`activeIndicator-${item.path}`}
                          className="absolute inset-0 bg-blue-50 rounded-xl"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <Icon className={`relative w-5 h-5 transition-colors duration-200 ${
                        active 
                          ? 'text-blue-600' 
                          : 'text-gray-600 group-hover:text-blue-600'
                      }`} />
                      <span className={`relative text-sm font-medium transition-colors duration-200 ${
                        active 
                          ? 'text-blue-600' 
                          : 'text-gray-600 group-hover:text-blue-600'
                      }`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
                
                {/* Right Side Navigation Items (University Details + Profile) */}
                {rightNavItems.length > 0 && (
                  <>
                    <div className="h-8 w-px bg-gray-300 mx-2" />
                    {rightNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer group ${
                            active ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          title={item.label}
                        >
                          {active && (
                            <motion.div
                              layoutId={`activeIndicator-${item.path}`}
                              className="absolute inset-0 bg-blue-50 rounded-xl"
                              initial={false}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}
                          <Icon className={`relative w-5 h-5 transition-colors duration-200 ${
                            active 
                              ? 'text-blue-600' 
                              : 'text-gray-600 group-hover:text-blue-600'
                          }`} />
                          <span className={`relative text-sm font-medium transition-colors duration-200 ${
                            active 
                              ? 'text-blue-600' 
                              : 'text-gray-600 group-hover:text-blue-600'
                          }`}>
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </>
                )}
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer
                           text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700
                           hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg
                           transition-all duration-200"
              >
                <LogIn className="w-5 h-5" />
                Sign in as admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

