// -----------------------------------------------------------------------------
// File: ProfileModal.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: User profile modal component displaying user information and logout option
// -----------------------------------------------------------------------------

import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { 
  X, 
  User, 
  Mail, 
  Calendar,
  Settings,
  CreditCard,
  HelpCircle,
  LogOut
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
    window.location.href = '/';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100/80 w-full max-w-2xl mx-4"
      >
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100/60">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Profile
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6 space-y-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl uppercase">
                {user?.name?.charAt(0) || <User className="w-8 h-8" />}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                  Active
                </span>
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                  Student
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">12</div>
              <div className="text-xs text-gray-500">Chats</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">8</div>
              <div className="text-xs text-gray-500">Subjects</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">24h</div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200 group">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-all duration-200">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-gray-700 font-medium">Edit Profile</span>
            </button>

            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200 group">
              <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-all duration-200">
                <Settings className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-gray-700 font-medium">Account Settings</span>
            </button>

            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200 group">
              <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-all duration-200">
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-gray-700 font-medium">Billing & Plans</span>
            </button>

            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200 group">
              <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-all duration-200">
                <HelpCircle className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-gray-700 font-medium">Help & Support</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 text-red-600 bg-red-50/80 hover:bg-red-100 border border-red-200/60 rounded-xl transition-all duration-200 font-semibold group"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileModal;