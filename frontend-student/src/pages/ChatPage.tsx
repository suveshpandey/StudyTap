// -----------------------------------------------------------------------------
// File: ChatPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Main chat interface page for conversation with AI tutor
// -----------------------------------------------------------------------------

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessageBubble from '../components/ChatMessageBubble';
import ChatInput from '../components/ChatInput';
import { getChatMessages, sendChatMessage, getChats } from '../api/client';
import type { ChatMessage, Chat } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import {
  MessageSquare,
  Plus,
  Menu,
  X,
  Clock,
  Calendar,
  Brain,
  Sparkles,
  History,
  BookOpen,
  ChevronRight
} from 'lucide-react';

const ChatPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastChatIdRef = useRef<string | undefined>(undefined);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-blue-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
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

  const loadChats = async () => {
    setIsLoadingChats(true);
    try {
      const data = await getChats();
      setChats(data);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const loadMessages = async () => {
    if (!chatId) {
      setIsLoadingMessages(false);
      return;
    }
    setIsLoadingMessages(true);
    try {
      const data = await getChatMessages(Number(chatId));
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (chatId !== lastChatIdRef.current) {
      lastChatIdRef.current = chatId;
      setMessages([]);
      setIsLoadingMessages(true);

      if (chatId && isAuthenticated) {
        loadMessages();
      } else {
        setIsLoadingMessages(false);
      }
    }
  }, [chatId, isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (question: string) => {
    if (!chatId) return;

    const userMessageId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        sender: 'USER',
        message: question,
        created_at: new Date().toISOString(),
      },
    ]);

    setIsLoading(true);
    try {
      const res = await sendChatMessage(Number(chatId), question);
      const botMessageId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: botMessageId,
          sender: 'BOT',
          message: res.answer,
          sources: res.sources,
          created_at: new Date().toISOString(),
        },
      ]);
      await loadChats();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessageId));
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
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const getChatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!authLoading && !isAuthenticated) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50/50 to-indigo-50/50 flex overflow-hidden">
      {/* Elegant Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/60 flex flex-col h-full shadow-xl"
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-200/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <History className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Chat History</h2>
                    <p className="text-sm text-gray-500">{chats.length} conversations</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-200 cursor-pointer"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/select-subject')}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                New Chat Session
              </motion.button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingChats ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-gray-500">Loading your chats...</p>
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No chats yet</h3>
                  <p className="text-sm text-gray-500">
                    Start your first conversation to begin learning
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {chats.map((chat) => (
                    <motion.button
                      key={chat.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => navigate(`/chat/${chat.id}`)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 border cursor-pointer ${
                        Number(chatId) === chat.id
                          ? 'bg-blue-50/80 border-blue-200 shadow-md'
                          : 'bg-white/60 border-transparent hover:bg-white/80 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {chat.title || 'New chat'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(chat.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getChatTime(chat.created_at)}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                          Number(chatId) === chat.id ? 'text-blue-600' : ''
                        }`} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded-xl hover:bg-gray-100/80 transition-all duration-200"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </motion.button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Study Companion</h1>
                <p className="text-sm text-gray-500">Ready to assist with your learning</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/80 rounded-xl border border-blue-200/60">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">AI Powered</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-transparent">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {isLoadingMessages ? (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading conversation...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
                >
                  <BookOpen className="w-10 h-10 text-blue-600" />
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Start Learning Journey
                </h2>
                <p className="text-lg text-gray-600 max-w-md mb-8 leading-relaxed">
                  Ask your first question and begin an interactive learning session with your AI study companion
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Sparkles className="w-4 h-4" />
                  <span>Powered by advanced AI technology</span>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {messages.map((message, index) => (
                  <ChatMessageBubble
                    key={message.id || `msg-${index}-${message.created_at || Date.now()}`}
                    message={message.message}
                    sender={message.sender}
                    timestamp={message.created_at}
                    sources={message.sources}
                  />
                ))}
                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200/60 px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;