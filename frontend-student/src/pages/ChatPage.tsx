// -----------------------------------------------------------------------------
// File: ChatPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Main chat interface page for conversation with AI tutor
// -----------------------------------------------------------------------------

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { getChatMessages, sendChatMessage, getChats } from '../api/client';
import type { ChatMessage, Chat } from '../api/client';
import DiagramDisplay from '../components/DiagramDisplay';
import { useAuth } from '../hooks/useAuth';
import {
  MessageSquare,
  Plus,
  Clock,
  Calendar,
  Brain,
  Sparkles,
  History,
  BookOpen,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
  Search,
  ArrowLeft,
  Download,
  Share2,
  MoreVertical,
  Copy,
  Check,
  Bot,
  Mic,
  Image as ImageIcon,
  Send,
  Circle,
  Keyboard,
  X,
  FileText
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
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastChatIdRef = useRef<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [chatFirstQuestions, setChatFirstQuestions] = useState<Record<number, string>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const location = useLocation();
  const currentChat = chats.find(c => c.id === Number(chatId));

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
      
      // Load first question for each chat
      const firstQuestions: Record<number, string> = {};
      await Promise.all(
        data.map(async (chat) => {
          try {
            const messages = await getChatMessages(chat.id);
            const firstUserMessage = messages.find(msg => msg.sender === 'USER');
            if (firstUserMessage) {
              firstQuestions[chat.id] = firstUserMessage.message;
            }
          } catch (error) {
            console.error(`Failed to load first question for chat ${chat.id}:`, error);
          }
        })
      );
      setChatFirstQuestions(firstQuestions);
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

  // Handle initial question from navigation state after messages are loaded
  useEffect(() => {
    const initialQuestion = location.state?.initialQuestion;
    if (initialQuestion && typeof initialQuestion === 'string' && initialQuestion.trim() && chatId && !isLoadingMessages && messages.length === 0) {
      // Wait a bit to ensure chat is fully ready
      const timer = setTimeout(() => {
        handleSendMessage(initialQuestion);
        // Clear the state to prevent re-sending
        if (window.history.replaceState) {
          window.history.replaceState({ ...location.state, initialQuestion: undefined }, '');
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [chatId, isLoadingMessages, messages.length, location.state]);

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
          diagrams: res.diagrams,
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

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupChatsByTime = (chatsList: Chat[]) => {
    const now = new Date();
    const today: Chat[] = [];
    const yesterday: Chat[] = [];
    const last7Days: Chat[] = [];

    chatsList.forEach(chat => {
      const chatDate = new Date(chat.created_at);
      const diffInMs = now.getTime() - chatDate.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        today.push(chat);
      } else if (diffInDays === 1) {
        yesterday.push(chat);
      } else if (diffInDays < 7) {
        last7Days.push(chat);
      }
    });

    return { today, yesterday, last7Days };
  };

  const toggleSources = (messageIndex: number) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageIndex)) {
        newSet.delete(messageIndex);
      } else {
        newSet.add(messageIndex);
      }
      return newSet;
    });
  };

  const copyToClipboard = (markdownText: string, messageId: number) => {
    // Convert markdown to plain text by removing markdown syntax
    let plainText = markdownText;
    
    // Remove code blocks (```code```) - handle multiline
    plainText = plainText.replace(/```[\s\S]*?```/g, '');
    
    // Remove inline code (`code`)
    plainText = plainText.replace(/`([^`]+)`/g, '$1');
    
    // Remove strikethrough (~~text~~) - do this before bold/italic
    plainText = plainText.replace(/~~([^~]+)~~/g, '$1');
    
    // Remove bold (**text** or __text__) - handle nested cases
    plainText = plainText.replace(/\*\*([^*]+)\*\*/g, '$1');
    plainText = plainText.replace(/__([^_]+)__/g, '$1');
    
    // Remove italic (*text* or _text_) - simple approach
    plainText = plainText.replace(/\*([^*\n]+)\*/g, '$1');
    plainText = plainText.replace(/_([^_\n]+)_/g, '$1');
    
    // Remove headers (# Header)
    plainText = plainText.replace(/^#{1,6}\s+(.+)$/gm, '$1');
    
    // Remove links [text](url) -> text
    plainText = plainText.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // Remove images ![alt](url)
    plainText = plainText.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1');
    
    // Remove blockquotes (> text)
    plainText = plainText.replace(/^>\s+(.+)$/gm, '$1');
    
    // Remove horizontal rules (--- or ***)
    plainText = plainText.replace(/^[-*]{3,}$/gm, '');
    
    // Remove list markers (-, *, +, 1.)
    plainText = plainText.replace(/^[\s]*[-*+]\s+(.+)$/gm, '$1');
    plainText = plainText.replace(/^[\s]*\d+\.\s+(.+)$/gm, '$1');
    
    // Remove any remaining standalone asterisks or underscores used as formatting
    plainText = plainText.replace(/\*\*/g, '');
    plainText = plainText.replace(/__/g, '');
    
    // Clean up extra whitespace
    plainText = plainText.replace(/\n{3,}/g, '\n\n');
    plainText = plainText.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
    plainText = plainText.trim();
    
    navigator.clipboard.writeText(plainText);
    
    // Show copy feedback
    setCopiedMessageId(messageId);
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 5000);
  };

  const filteredChats = chats.filter(chat => 
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.subject_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { today, yesterday, last7Days } = groupChatsByTime(filteredChats);

  if (!authLoading && !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className={`w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Sidebar Header */}
        {isSidebarVisible && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">StudyTap AI</h1>
                <p className="text-xs text-gray-500">Smart Learning Assistant</p>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Sidebar Navigation */}
        {isSidebarVisible && (
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <button
                onClick={() => navigate('/home')}
                className="w-full bg-indigo-600 text-white rounded-xl px-4 py-3 font-semibold shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Conversation</span>
              </button>
            </div>

            {isLoadingChats ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-500">Loading your chats...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No chats yet</h3>
                <p className="text-sm text-gray-500">
                  Start your first conversation to begin learning
                </p>
              </div>
            ) : (
              <>
                {today.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">Today</h3>
                    <div className="space-y-1">
                      {today.map((chat) => {
                        const firstQuestion = chatFirstQuestions[chat.id] || chat.title || chat.subject_name || 'New chat';
                        return (
                          <button
                            key={chat.id}
                            onClick={() => navigate(`/chat/${chat.id}`)}
                            className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all group ${
                              Number(chatId) === chat.id
                                ? 'bg-indigo-600/10 text-indigo-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              Number(chatId) === chat.id 
                                ? 'bg-indigo-600' 
                                : 'bg-indigo-100'
                            }`}>
                              <MessageSquare className={`w-4 h-4 ${
                                Number(chatId) === chat.id ? 'text-white' : 'text-indigo-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={`text-sm truncate ${
                                Number(chatId) === chat.id ? 'font-semibold' : 'font-medium'
                              }`}>
                                {firstQuestion}
                              </p>
                              <p className={`text-xs truncate ${
                                Number(chatId) === chat.id ? 'text-indigo-600/70' : 'text-gray-500'
                              }`}>
                                {chat.subject_name || 'Branch Chat'} • {getRelativeTime(chat.created_at)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {yesterday.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">Yesterday</h3>
                    <div className="space-y-1">
                      {yesterday.map((chat) => {
                        const firstQuestion = chatFirstQuestions[chat.id] || chat.title || chat.subject_name || 'New chat';
                        return (
                          <button
                            key={chat.id}
                            onClick={() => navigate(`/chat/${chat.id}`)}
                            className="w-full flex items-start gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all group"
                          >
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-medium truncate">
                                {firstQuestion}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {chat.subject_name || 'Branch Chat'} • Yesterday
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {last7Days.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">Last 7 Days</h3>
                    <div className="space-y-1">
                      {last7Days.map((chat) => {
                        const firstQuestion = chatFirstQuestions[chat.id] || chat.title || chat.subject_name || 'New chat';
                        return (
                          <button
                            key={chat.id}
                            onClick={() => navigate(`/chat/${chat.id}`)}
                            className="w-full flex items-start gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all group"
                          >
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-medium truncate">
                                {firstQuestion}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {chat.subject_name || 'Branch Chat'} • {getRelativeTime(chat.created_at)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </nav>
        )}

        {/* Sidebar Footer */}
        {isSidebarVisible && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-all"
            >
              <div className="w-10 h-10 bg-indigo-600/20 rounded-full border-2 border-indigo-600/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-indigo-600">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">Premium Plan</p>
              </div>
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </aside>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarVisible(false)}
        />
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isSidebarVisible && (
                <button
                  onClick={() => setIsSidebarVisible(true)}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => navigate('/home')}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {currentChat?.title || currentChat?.subject_name || 'New Conversation'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {currentChat?.subject_name && (
                    <>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {currentChat.subject_name}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                    </>
                  )}
                  <span className="text-xs text-gray-500">
                    Started {currentChat ? getRelativeTime(currentChat.created_at) : 'recently'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all" title="Export Chat">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all" title="Share">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all" title="More Options">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {isLoadingMessages ? (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading conversation...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative mb-8"
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/50 to-purple-400/50 animate-pulse"></div>
                    <Brain className="w-16 h-16 text-white relative z-10" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="max-w-2xl"
                >
                  <h2 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Start Your Learning Journey
                  </h2>
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Ask your first question and begin an interactive learning session with your AI study companion
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl border border-indigo-200">
                      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">AI-Powered</h3>
                      <p className="text-xs text-gray-600">Advanced AI technology</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Course Materials</h3>
                      <p className="text-xs text-gray-600">Access your study resources</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl border border-cyan-200">
                      <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Interactive</h3>
                      <p className="text-xs text-gray-600">Real-time conversations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full inline-flex">
                    <Circle className="w-2 h-2 text-green-500 fill-current" />
                    <span>AI Ready • Powered by Gemini & Kendra</span>
                  </div>
                </motion.div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isUser = message.sender === 'USER';
                  const formattedTime = message.created_at
                    ? new Date(message.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })
                    : '';
                  const isLastBotMessage = index === messages.length - 1 && !isUser;
                  const hasSources = message.sources && message.sources.length > 0;
                  const sourcesExpanded = expandedSources.has(index);
                  const isLastUserMessage = index === messages.length - 1 && isUser;
                  const showLoader = isLastUserMessage && isLoading;

                  return (
                    <div key={message.id || `msg-${index}-${message.created_at || Date.now()}`}>
                      {isUser ? (
                        <div className="flex justify-end">
                          <div className="max-w-2xl">
                            <div className="bg-indigo-50 rounded-2xl rounded-tr-md px-5 py-4 shadow-sm">
                              <p className="text-gray-900 font-medium">{message.message}</p>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-2 px-2">
                              <span className="text-xs text-gray-500">{formattedTime}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-start">
                          <div className="max-w-3xl w-full">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Bot className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="bg-white rounded-2xl rounded-tl-md px-6 py-6 shadow-sm border border-gray-200">
                                  <div className="markdown-content prose prose-indigo max-w-none">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      rehypePlugins={[rehypeHighlight]}
                                      components={{
                                        // Headings
                                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 pb-2 border-b border-gray-200" {...props} />,
                                        h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-900 mt-5 mb-3" {...props} />,
                                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2" {...props} />,
                                        h4: ({node, ...props}) => <h4 className="text-base font-semibold text-gray-900 mt-3 mb-2" {...props} />,
                                        h5: ({node, ...props}) => <h5 className="text-sm font-semibold text-gray-900 mt-3 mb-2" {...props} />,
                                        h6: ({node, ...props}) => <h6 className="text-sm font-medium text-gray-700 mt-2 mb-2" {...props} />,
                                        
                                        // Paragraphs
                                        p: ({node, ...props}) => <p className="text-gray-700 leading-7 mb-4" {...props} />,
                                        
                                        // Bold and Italic
                                        strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                                        em: ({node, ...props}) => <em className="italic text-gray-800" {...props} />,
                                        
                                        // Lists
                                        ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-gray-700" {...props} />,
                                        ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-gray-700" {...props} />,
                                        li: ({node, ...props}) => <li className="leading-7 pl-1" {...props} />,
                                        
                                        // Code blocks
                                        code: ({node, inline, className, ...props}: any) => {
                                          const match = /language-(\w+)/.exec(className || '');
                                          if (inline) {
                                            return <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono font-medium" {...props} />;
                                          }
                                          return (
                                            <code className={className} {...props} />
                                          );
                                        },
                                        pre: ({node, children, ...props}: any) => {
                                          // Extract language from code element
                                          const codeProps = (children as any)?.props || {};
                                          const className = codeProps.className || '';
                                          const match = /language-(\w+)/.exec(className || '');
                                          const language = match ? match[1] : '';
                                          
                                          return (
                                            <div className="relative my-4 group">
                                              {language && (
                                                <div className="absolute top-2 right-2 z-10 text-xs text-gray-400 uppercase tracking-wider font-medium bg-gray-900/80 px-2 py-1 rounded">
                                                  {language}
                                                </div>
                                              )}
                                              <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm font-mono border border-gray-800" {...props}>
                                                {children}
                                              </pre>
                                            </div>
                                          );
                                        },
                                        
                                        // Blockquotes
                                        blockquote: ({node, ...props}) => (
                                          <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 my-4 bg-indigo-50/50 rounded-r-lg italic text-gray-700" {...props} />
                                        ),
                                        
                                        // Links
                                        a: ({node, ...props}: any) => (
                                          <a className="text-indigo-600 hover:text-indigo-700 underline font-medium transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
                                        ),
                                        
                                        // Tables
                                        table: ({node, ...props}) => (
                                          <div className="overflow-x-auto my-4">
                                            <table className="min-w-full border-collapse border border-gray-300 rounded-lg" {...props} />
                                          </div>
                                        ),
                                        thead: ({node, ...props}) => <thead className="bg-gray-100" {...props} />,
                                        tbody: ({node, ...props}) => <tbody className="bg-white" {...props} />,
                                        tr: ({node, ...props}) => <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors" {...props} />,
                                        th: ({node, ...props}) => <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300 last:border-r-0" {...props} />,
                                        td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 last:border-r-0" {...props} />,
                                        
                                        // Horizontal rule
                                        hr: ({node, ...props}) => <hr className="my-6 border-0 border-t border-gray-300" {...props} />,
                                        
                                        // Images
                                        img: ({node, ...props}: any) => (
                                          <img className="max-w-full h-auto rounded-lg my-4 shadow-md" {...props} />
                                        ),
                                      }}
                                    >
                                      {message.message}
                                    </ReactMarkdown>
                                  </div>

                                  {/* Display diagrams if available */}
                                  {message.diagrams && message.diagrams.length > 0 && (
                                    <DiagramDisplay diagrams={message.diagrams} />
                                  )}

                                  {hasSources && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <button
                                        onClick={() => toggleSources(index)}
                                        className="text-xs text-gray-500 hover:text-indigo-600 transition-all flex items-center gap-1"
                                      >
                                        <FileText className="w-3 h-3" />
                                        <span>View Sources ({(() => {
                                          // Count unique PDFs
                                          const uniquePDFs = new Set(message.sources?.map(src => src.title) || []);
                                          return uniquePDFs.size;
                                        })()})</span>
                                        <ChevronRight className={`w-3 h-3 transition-transform ${sourcesExpanded ? 'rotate-90' : ''}`} />
                                      </button>
                                      {sourcesExpanded && (() => {
                                        // Group sources by PDF title and collect unique pages
                                        const groupedSources = new Map<string, Set<number>>();
                                        
                                        message.sources?.forEach((src) => {
                                          if (!groupedSources.has(src.title)) {
                                            groupedSources.set(src.title, new Set());
                                          }
                                          if (src.page) {
                                            groupedSources.get(src.title)?.add(src.page);
                                          }
                                        });
                                        
                                        return (
                                          <div className="mt-3 space-y-3">
                                            {Array.from(groupedSources.entries()).map(([title, pages], pdfIndex) => {
                                              const sortedPages = Array.from(pages).sort((a, b) => a - b);
                                              return (
                                                <div key={pdfIndex} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                  <div className="flex items-start gap-2 mb-2">
                                                    <FileText className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                                                    </div>
                                                  </div>
                                                  {sortedPages.length > 0 && (
                                                    <div className="ml-6 mt-2">
                                                      <p className="text-xs font-medium text-gray-600 mb-1">Pages:</p>
                                                      <div className="flex flex-wrap gap-1.5">
                                                        {sortedPages.map((page, pageIndex) => (
                                                          <span
                                                            key={pageIndex}
                                                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-md"
                                                          >
                                                            Page {page}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mt-3 px-2">
                                  <span className="text-xs text-gray-500">{formattedTime}</span>
                                  <div className="flex items-center gap-1 ml-auto">
                                    <button
                                      onClick={() => copyToClipboard(message.message, message.id || index)}
                                      className={`p-1.5 rounded transition-all ${
                                        copiedMessageId === (message.id || index)
                                          ? 'text-green-600 bg-green-50'
                                          : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-600/5'
                                      }`}
                                      title={copiedMessageId === (message.id || index) ? 'Copied!' : 'Copy'}
                                    >
                                      {copiedMessageId === (message.id || index) ? (
                                        <Check className="w-4 h-4" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Follow-up Questions (after bot messages) */}
                      {isLastBotMessage && (
                        <div className="flex justify-start mt-4">
                          <div className="max-w-3xl w-full pl-14">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Follow-up Questions</p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleSendMessage('Can you explain this in more detail?')}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-indigo-600 transition-all"
                              >
                                Can you explain this in more detail?
                              </button>
                              <button
                                onClick={() => handleSendMessage('Show me an example')}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-indigo-600 transition-all"
                              >
                                Show me an example
                              </button>
                              <button
                                onClick={() => handleSendMessage('What are the prerequisites?')}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-indigo-600 transition-all"
                              >
                                What are the prerequisites?
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Loading indicator after user message */}
                      {showLoader && (
                        <div className="flex justify-start mt-4">
                          <div className="max-w-3xl w-full">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Bot className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="bg-white rounded-2xl rounded-tl-md px-6 py-5 shadow-sm border border-gray-200">
                                  <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <span className="text-sm text-gray-500">AI is thinking...</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVoiceModal(true)}
                className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-600/5 rounded-xl transition-all flex-shrink-0"
              >
                <Mic className="w-5 h-5" />
              </button>
              
              <button className="p-3 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all flex-shrink-0">
                <ImageIcon className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  id="message-input"
                  rows={1}
                  placeholder="Ask a question about your course materials..."
                  className="w-full px-5 py-3 pr-16 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all resize-none overflow-hidden"
                  style={{ 
                    minHeight: '48px',
                    maxHeight: '128px',
                    height: '48px',
                    lineHeight: '1.5'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const textarea = e.target as HTMLTextAreaElement;
                      if (textarea.value.trim() && !isLoading) {
                        handleSendMessage(textarea.value.trim());
                        textarea.value = '';
                        textarea.style.height = '48px';
                      }
                    }
                  }}
                  onChange={(e) => {
                    const textarea = e.target as HTMLTextAreaElement;
                    // Reset height to auto to get the correct scrollHeight
                    textarea.style.height = 'auto';
                    // Calculate new height, but cap it at maxHeight
                    const newHeight = Math.min(textarea.scrollHeight, 128);
                    textarea.style.height = `${newHeight}px`;
                    textarea.style.overflowY = newHeight >= 128 ? 'auto' : 'hidden';
                  }}
                  onInput={(e) => {
                    const textarea = e.target as HTMLTextAreaElement;
                    const charCount = textarea.value.length;
                    const charCountElement = document.getElementById('char-count');
                    if (charCountElement) {
                      charCountElement.textContent = charCount.toString();
                    }
                  }}
                  disabled={isLoading}
                />
                <div className="absolute right-3 bottom-3 text-xs text-gray-400 pointer-events-none">
                  <span id="char-count">0</span>/2000
                </div>
              </div>
              
              <button
                id="send-btn"
                onClick={() => {
                  const textarea = document.getElementById('message-input') as HTMLTextAreaElement;
                  if (textarea?.value.trim() && !isLoading) {
                    handleSendMessage(textarea.value.trim());
                    textarea.value = '';
                    textarea.style.height = 'auto';
                  }
                }}
                disabled={isLoading}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-3 px-2">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Circle className="w-2 h-2 text-green-500 fill-current" />
                  AI Ready
                </span>
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs text-gray-500 hover:text-indigo-600 transition-all">
                  <Keyboard className="w-3 h-3 mr-1 inline" />
                  Shortcuts
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Voice Recording Modal */}
      {showVoiceModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowVoiceModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center relative">
                  <Mic className="w-12 h-12 text-white" />
                  <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-75"></div>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Listening...</h3>
              <p className="text-gray-600 mb-6">Speak clearly into your microphone</p>
              
              <div className="flex items-center justify-center gap-1 mb-6 h-16">
                {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((delay, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-500 rounded-full animate-pulse"
                    style={{
                      height: `${20 + Math.random() * 35}px`,
                      animationDelay: `${delay}s`
                    }}
                  />
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowVoiceModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowVoiceModal(false);
                    // In a real implementation, this would process the voice input
                  }}
                  className="flex-1 px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Stop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;