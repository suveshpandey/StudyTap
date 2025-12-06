// -----------------------------------------------------------------------------
// File: ChatListPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Page displaying list of all user's chat sessions
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getChats } from '../api/client';
import type { Chat } from '../api/client';
import { useAuth } from '../hooks/useAuth';

const ChatListPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const PRIMARY_COLOR = 'blue';

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Redirect non-students away from chat
  if (user && user.role !== 'student') {
    if (user.role === 'university_admin') {
      navigate('/admin/academics');
    } else if (user.role === 'master_admin') {
      navigate('/master/universities');
    } else {
      navigate('/');
    }
    return null;
  }

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      loadChats();
    }
  }, [isAuthenticated, user]);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const data = await getChats();
      setChats(data);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Background Visual Element */}
      <div
        className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl"
        aria-hidden="true"
      >
        <div
          className="relative left-1/2 aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#a6c1ee] to-[#7f8ff4] opacity-20 sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="relative isolate pt-14 pb-28 sm:pt-24 sm:pb-40">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="text-center mb-12">
            <p className={`text-sm font-semibold leading-6 text-${PRIMARY_COLOR}-600 mb-2 uppercase tracking-wider`}>
              Your Chats
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
              Chat History
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              View and continue your previous conversations
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100"
          >
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-gray-500">Loading chats...</div>
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-blue-100">
                  <svg
                    className="w-10 h-10 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No chats yet</h3>
                <p className="text-gray-500 mb-6">Start a new conversation to get started!</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard')}
                  className={`px-6 py-3 bg-gradient-to-r from-${PRIMARY_COLOR}-600 to-indigo-600 text-white rounded-full hover:from-${PRIMARY_COLOR}-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl cursor-pointer`}
                >
                  Start New Chat
                </motion.button>
              </div>
            ) : (
              <div className="space-y-3">
                {chats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-gray-50 hover:bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {chat.title || 'New chat'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(chat.created_at)}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/select-subject')}
                className={`w-full py-3 bg-gradient-to-r from-${PRIMARY_COLOR}-600 to-indigo-600 text-white rounded-full hover:from-${PRIMARY_COLOR}-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl`}
              >
                Start New Chat
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatListPage;

