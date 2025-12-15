// -----------------------------------------------------------------------------
// File: ChatListPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Page displaying list of all user's chat sessions
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getChats, getChatMessages, startChat, getBranches, getSemesters, getSubjects, type Subject } from '../api/client';
import type { Chat } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import StudentSidebar from '../components/StudentSidebar';
import {
  MessageSquare,
  Menu,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

const ChatListPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [chatsWithDetails, setChatsWithDetails] = useState<Array<{ chat: Chat; firstQuestion: string; answer: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-600">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Loading...</span>
        </div>
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
      loadSubjects();
    }
  }, [isAuthenticated, user]);

  const loadSubjects = async () => {
    try {
      const branches = await getBranches();
      if (branches && branches.length > 0) {
        const semesters = await getSemesters(branches[0].id);
        const allSubjects: Subject[] = [];
        for (const semester of semesters) {
          try {
            const semesterSubjects = await getSubjects(semester.id);
            allSubjects.push(...semesterSubjects);
          } catch (error) {
            console.error(`Failed to load subjects for semester ${semester.id}:`, error);
          }
        }
        setSubjects(allSubjects);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const handleStartChat = async (subjectId?: number) => {
    try {
      const chat = subjectId 
        ? await startChat(subjectId, subjects.find(s => s.id === subjectId)?.name || 'Subject Chat')
        : await startChat(undefined, 'Branch Chat');
      navigate(`/chat/${chat.id}`);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      alert(error.response?.data?.detail || 'Error starting chat. Please try again.');
    }
  };

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const data = await getChats();
      
      // Fetch first question and answer for each chat
      const chatsWithQuestions = await Promise.all(
        data.map(async (chat) => {
          try {
            const messages = await getChatMessages(chat.id);
            // Find first USER message (the question)
            const firstUserMessage = messages.find(msg => msg.sender === 'USER');
            // Find first BOT message (the answer)
            const firstBotMessage = messages.find(msg => msg.sender === 'BOT');
            
            return {
              chat,
              firstQuestion: firstUserMessage?.message || chat.title || 'No question found',
              answer: firstBotMessage?.message || 'No answer yet'
            };
          } catch (error) {
            console.error(`Failed to load messages for chat ${chat.id}:`, error);
            return {
              chat,
              firstQuestion: chat.title || 'Failed to load question',
              answer: 'Failed to load answer'
            };
          }
        })
      );
      
      setChatsWithDetails(chatsWithQuestions);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format time ago helper
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  };

  // Get color for chat card
  const getChatColor = (index: number) => {
    const colors = ['blue', 'green', 'purple', 'orange'];
    const color = colors[index % colors.length];
    const colorClasses = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-600', badge: 'bg-green-50 text-green-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', badge: 'bg-purple-50 text-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-50 text-orange-600' }
    };
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
  };

  const filteredChats = chatsWithDetails.filter(item =>
    item.firstQuestion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.chat.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {/* Sidebar */}
      <StudentSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        searchPlaceholder="Search conversations..."
      />

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
              <button
                onClick={() => navigate('/home')}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chat History</h2>
                <p className="text-sm text-gray-500">View and continue your previous conversations</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">

          {/* Chats List */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">All Conversations</h3>
              <span className="text-sm text-gray-500">{filteredChats.length} {filteredChats.length === 1 ? 'chat' : 'chats'}</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading chats...</span>
                </div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No chats found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery ? 'No chats match your search. Try a different query.' : 'Start a new conversation to see it here!'}
                </p>
                <button
                  onClick={() => navigate('/home')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm"
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredChats.map((item, index) => {
                  const colors = getChatColor(index);
                  const timeAgo = formatTimeAgo(item.chat.created_at);
                  const subjectName = item.chat.subject_name || 'Branch Chat';
                  
                  return (
                    <motion.div
                      key={item.chat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => navigate(`/chat/${item.chat.id}`)}
                      className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <MessageSquare className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold ${colors.badge} px-2 py-1 rounded`}>{subjectName}</span>
                            <span className="text-xs text-gray-500">{timeAgo}</span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1 truncate">{item.firstQuestion}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.answer}</p>
                        </div>
                        <button className="text-indigo-600 hover:text-indigo-700 flex-shrink-0">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatListPage;

