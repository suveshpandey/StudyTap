// -----------------------------------------------------------------------------
// File: MasterAdminProfilePage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Master admin profile management page matching StudentProfilePage UI/UX
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { getMasterAdminProfile, changeMasterAdminPassword } from '../api/client';
import MasterSidebar from '../components/MasterSidebar';
import {
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Shield,
  CheckCircle,
  Menu,
  Bell,
  Settings,
  ChevronRight,
  Crown,
  Camera,
  Pen,
  Key,
  Info,
  FileText,
  Headphones,
  HelpCircle,
} from 'lucide-react';

const MasterAdminProfilePage = () => {
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
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if not authenticated or not a master admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'master_admin')) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated || user?.role !== 'master_admin') return;
      
      try {
        setProfileLoading(true);
        const profile = await getMasterAdminProfile();
        setName(profile.name);
        setEmail(profile.email);
      } catch (err: any) {
        console.error('Failed to load profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'master_admin') {
      loadProfile();
    }
  }, [isAuthenticated, user]);

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
      await changeMasterAdminPassword({
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

  if (!isAuthenticated || user?.role !== 'master_admin') {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {/* Sidebar */}
      <MasterSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        searchPlaceholder="Search..."
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
                          <Shield className="w-16 h-16 text-indigo-600" />
                        </div>
                        <button className="absolute bottom-2 right-2 w-10 h-10 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center">
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="pb-2">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{name || 'Master Admin'}</h3>
                        <p className="text-gray-600 mb-2">{email || 'admin@studytap.ai'}</p>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-full">
                            <Crown className="w-3 h-3" />
                            Master Admin
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
                      <div className="text-3xl font-bold text-gray-900 mb-1">-</div>
                      <div className="text-sm text-gray-600">Universities</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-3xl font-bold text-gray-900 mb-1">-</div>
                      <div className="text-sm text-gray-600">Total Students</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-3xl font-bold text-gray-900 mb-1">-</div>
                      <div className="text-sm text-gray-600">Admin Users</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-3xl font-bold text-gray-900 mb-1">-</div>
                      <div className="text-sm text-gray-600">Documents</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Account Information Section */}
                <section>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Account Information</h3>
                      <button className="text-indigo-600 font-semibold hover:text-indigo-700 transition-all flex items-center gap-1">
                        <Pen className="w-4 h-4" />
                        Edit
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <div className="relative">
                          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                            {name || 'Not available'}
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Name cannot be edited</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <div className="relative">
                          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                            {email || 'Not available'}
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Email cannot be edited</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                        <div className="relative">
                          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                            Master Administrator
                          </div>
                        </div>
                      </div>
                    </div>
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
                {/* Account Stats Card */}
                <section>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Account Stats</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Role</span>
                        <span className="font-semibold text-gray-900">Master Admin</span>
                      </div>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Account Status</span>
                        <span className="font-semibold text-green-600">Active</span>
                      </div>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Access Level</span>
                        <span className="font-semibold text-gray-900">Full</span>
                      </div>
                    </div>
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

export default MasterAdminProfilePage;
