// -----------------------------------------------------------------------------
// File: LandingPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Modern landing page for student portal with hero section and features
// -----------------------------------------------------------------------------

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { 
  GraduationCap,
  LogIn,
  Brain,
  BookOpen,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Sparkles,
  FileText,
  Clock
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
      },
    },
  };

  const features = [
    {
      icon: Brain,
      title: 'Instant AI Answers',
      description: 'Get clear, exam-oriented explanations to your questions in seconds — from theory doubts to numerical problems.',
      color: 'blue',
    },
    {
      icon: BookOpen,
      title: 'Subject-wise Organization',
      description: 'Switch between courses and subjects without losing context. Every chat stays attached to a subject.',
      color: 'indigo',
    },
    {
      icon: MessageSquare,
      title: 'Smart Conversations',
      description: 'Contextual AI that understands your course structure, units, and exam pattern — not just generic answers.',
      color: 'purple',
    },
    {
      icon: FileText,
      title: 'Course Materials',
      description: 'Access your university\'s course materials and PDFs directly within the platform for seamless learning.',
      color: 'green',
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Study anytime, anywhere. Your AI study assistant is always ready to help with your academic questions.',
      color: 'orange',
    },
    {
      icon: CheckCircle,
      title: 'Exam-Focused',
      description: 'Answers structured like your exam papers — pointwise, short notes, and long answers when needed.',
      color: 'red',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        {/* Background Gradient */}
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-400 to-indigo-400 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        {/* Navigation Bar */}
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">StudyTap AI</h1>
                <p className="text-xs text-gray-500">Student Portal</p>
              </div>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Start Learning
            </Link>
          </div>
        </nav>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 shadow-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Study Assistant</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Your AI-Powered
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Study Co-pilot
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Get instant, exam-oriented explanations and answers tailored to your university syllabus. Ask doubts, revise faster, and stay ahead.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <LogIn className="w-5 h-5" />
                Start Learning Now
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-blue-700 bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
              >
                Explore Features
              </Link>
            </div>

            {/* Key Benefits */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <span>Subject-wise chats</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span>Exam-focused answers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
                <span>Chat history always saved</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Features designed for{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                University Students
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              StudyTap AI fits perfectly into your course structure, units, and exam pattern — not just generic answers.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                blue: 'bg-blue-50 text-blue-600',
                indigo: 'bg-indigo-50 text-indigo-600',
                purple: 'bg-purple-50 text-purple-600',
                green: 'bg-green-50 text-green-600',
                orange: 'bg-orange-50 text-orange-600',
                red: 'bg-red-50 text-red-600',
              };

              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className={`w-12 h-12 ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat Preview Section */}
      <div className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              See It In Action
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience how StudyTap AI helps you study smarter, not harder.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white">
                    AI
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">DBMS - Unit 3</p>
                    <p className="text-xs text-gray-500">AI Assistant · Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
                  <span className="h-2 w-2 rounded-full bg-red-400"></span>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-blue-600 text-white px-4 py-3 text-sm">
                    Explain 2NF with a simple example for exams.
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0">
                      AI
                    </div>
                    <div className="space-y-2">
                      <div className="rounded-2xl rounded-bl-sm bg-gray-50 text-gray-800 px-4 py-3 border border-gray-200">
                        <p className="font-semibold mb-1">2NF in one line:</p>
                        <p className="text-sm">Every non-key attribute should depend on the whole primary key, not just part of it.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                          Exam ready
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
                          DBMS notes.pdf
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex-1 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse"></span>
                  <p className="text-xs text-gray-500">StudyTap AI is typing exam-oriented notes...</p>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-blue-50 text-xs text-blue-700 font-medium border border-blue-100">
                  Auto-saved
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to Excel in Your Studies?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students using StudyTap AI to enhance their learning experience and ace their exams.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-blue-600 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <LogIn className="w-5 h-5" />
              Start Learning Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">StudyTap AI</h3>
                <p className="text-xs">Student Portal</p>
              </div>
            </div>
            <div className="text-sm">
              © {new Date().getFullYear()} StudyTap AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
