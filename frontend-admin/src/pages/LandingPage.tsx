// -----------------------------------------------------------------------------
// File: LandingPage.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Landing page component with hero section and feature highlights
// -----------------------------------------------------------------------------

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { 
  Brain,
  LogIn
} from 'lucide-react';

// --- Reusable SVG Icons ---

const IconZap = ({ color }: { color: string }) => (
  <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

const IconBook = ({ color }: { color: string }) => (
  <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const IconCheck = ({ color }: { color: string }) => (
  <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// --- Animation Variants ---
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

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const PRIMARY_COLOR = 'blue';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-gray-800 flex flex-col">

      {/* Hero Section */}
      <div className="relative isolate pt-12 pb-24 sm:pt-20 sm:pb-32 flex-1">
        {/* Background Visual */}
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#a6c1ee] to-[#7f8ff4] opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center"
          >
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm mb-4">
                <span className={`h-2 w-2 rounded-full bg-${PRIMARY_COLOR}-500 animate-pulse`} />
                Built for universities • Powered by AI
              </div>

              <p className={`text-sm font-semibold leading-6 text-${PRIMARY_COLOR}-600 mb-2 uppercase tracking-[0.2em]`}>
                Excel in University
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-4 leading-[1.05]">
                Your AI-Powered
                <span
                  className={`block bg-gradient-to-r from-${PRIMARY_COLOR}-600 to-indigo-600 bg-clip-text text-transparent`}
                >
                  Study Co-pilot
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-xl">
                Get
                <span className="font-semibold text-slate-800"> instant, exam-oriented</span> explanations and answers
                tailored to your university syllabus. Ask doubts, revise faster, and stay ahead.
              </p>

              {!isAuthenticated && (
                <div className="mb-6">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl cursor-pointer
                               text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600
                               hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl
                               transition-all duration-200 transform hover:scale-105"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign in as admin
                  </Link>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-${PRIMARY_COLOR}-50`}>
                    <span className={`h-1.5 w-1.5 rounded-full bg-${PRIMARY_COLOR}-500`} />
                  </span>
                  <span>Subject-wise chats</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span>Exam-focused answers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  </span>
                  <span>Chat history always saved</span>
                </div>
              </div>
            </div>

            {/* Right: Chat Preview Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
              className="relative"
            >
              <div
                className={`absolute -top-6 -right-2 sm:-right-6 h-20 w-20 rounded-3xl bg-gradient-to-tr from-${PRIMARY_COLOR}-400/60 to-indigo-400/70 blur-2xl opacity-70`}
              />
              <div className="relative mx-auto max-w-md">
                <div className="rounded-3xl bg-white/90 border border-slate-100 shadow-2xl shadow-slate-200/80 p-4 sm:p-5 backdrop-blur">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-2xl bg-gradient-to-tr from-${PRIMARY_COLOR}-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white`}>
                        AI
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">DBMS - Unit 3</p>
                        <p className="text-xs text-slate-500">AI Assistant · Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 text-xs sm:text-sm">
                    <div className="flex justify-end">
                      <div className={`max-w-[80%] rounded-2xl rounded-br-sm bg-${PRIMARY_COLOR}-600 text-white px-3 py-2 shadow-sm text-xs sm:text-sm`}>
                        Explain 2NF with a simple example for exams.
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="flex gap-2 max-w-[88%]">
                        <div className="mt-1 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-700">
                          AI
                        </div>
                        <div className="space-y-2">
                          <div className="rounded-2xl rounded-bl-sm bg-slate-50 text-slate-800 px-3 py-2 border border-slate-100">
                            <p className="font-semibold mb-1">2NF in one line:</p>
                            <p>Every non-key attribute should depend on the whole primary key, not just part of it.</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Exam ready
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100">
                              DBMS notes.pdf
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-slate-900 text-slate-50 px-3 py-2 text-[11px] sm:text-xs">
                        Got it! Give me a quick revision summary for 1NF, 2NF, 3NF.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
                      <p className="text-[11px] sm:text-xs text-slate-500">StudyTap AI is typing exam-oriented notes...</p>
                    </div>
                    <div className={`hidden sm:inline-flex px-2.5 py-1 rounded-full bg-${PRIMARY_COLOR}-50 text-[10px] text-${PRIMARY_COLOR}-700 font-medium border border-${PRIMARY_COLOR}-100`}>
                      Auto-saved
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex mt-4 items-center justify-center gap-4 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Always on</span>
                  </div>
                  <span className="h-0.5 w-8 rounded-full bg-slate-200" />
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <span>Made for your syllabus</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Divider */}
      <hr className="max-w-6xl mx-auto border-t border-slate-100" />

      {/* Features Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24"
      >
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3">
            Features designed for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              University Students
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
            StudyTap AI fits perfectly into your course structure, units, and exam pattern — not just generic answers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-7 lg:gap-10">
          {/* Feature 1 */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl transition-shadow duration-300"
          >
            <div className={`w-12 h-12 bg-${PRIMARY_COLOR}-50 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-${PRIMARY_COLOR}-100`}>
              <IconZap color={`text-${PRIMARY_COLOR}-600`} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Instant AI Answers</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-3">
              Get clear, university-level explanations to your questions in seconds — from theory doubts to numerical
              problems.
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-500">
              <li>• Contextual to your selected course & subject</li>
              <li>• Follow-up questions stay in the same chat</li>
              <li>• Clean, readable answer formatting</li>
            </ul>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-indigo-100">
              <IconBook color="text-indigo-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Subject-wise Organization</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-3">
              Switch between courses and subjects without losing context. Every chat stays attached to a subject.
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-500">
              <li>• Separate chats for each subject/unit</li>
              <li>• Quick access to previous doubts</li>
              <li>• Perfect for mid-sem & end-sem prep</li>
            </ul>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-purple-100">
              <IconCheck color="text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Exam-oriented Output</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-3">
              Answers are structured like your exam papers — pointwise, short notes, and long answers when needed.
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-500">
              <li>• Bullet and paragraph style explanations</li>
              <li>• Perfect for last-minute revision</li>
              <li>• Sources shown for transparency</li>
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;