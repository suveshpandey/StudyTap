// -----------------------------------------------------------------------------
// File: CourseSubjectSelector.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Reusable component for selecting course and subject from dropdowns
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCourses, getSubjects, type Course, type Subject } from '../api/client';
import {
  BookOpen,
  GraduationCap,
} from 'lucide-react';

interface Course {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  semester?: number | null;
}

interface CourseSubjectSelectorProps {
  onStartChat: (subjectId: number, subjectName: string) => void;
  isLoading?: boolean;
  userName?: string;
}

// Note: Icons are now generic since courses and subjects are dynamic

// Note: Courses and subjects are now fetched from the API

const CourseSubjectSelector = ({
  onStartChat,
  isLoading = false,
  userName,
}: CourseSubjectSelectorProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [greeting, setGreeting] = useState('');
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const PRIMARY_COLOR = 'indigo';

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Get time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Load courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoadingCourses(true);
        const data = await getCourses();
        setCourses(data);
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setIsLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  // Load subjects when course is selected
  useEffect(() => {
    if (selectedCourseId) {
      const loadSubjects = async () => {
        try {
          setIsLoadingSubjects(true);
          setSelectedSubjectId(null); // Reset subject selection
          const data = await getSubjects(selectedCourseId);
          setSubjects(data);
        } catch (error) {
          console.error('Failed to load subjects:', error);
          setSubjects([]);
        } finally {
          setIsLoadingSubjects(false);
        }
      };
      loadSubjects();
    } else {
      setSubjects([]);
      setSelectedSubjectId(null);
    }
  }, [selectedCourseId]);

  const handleStartChat = () => {
    if (selectedSubject) {
      // Pass subject ID instead of name for API call
      onStartChat(selectedSubject.id, selectedSubject.name);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-xl px-8 py-8 w-full max-w-6xl mx-auto space-y-8"
    >
      {/* Elegant Greeting Section */}
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="h-1 w-12 bg-indigo-200 rounded-full"></div>
          <span className="text-sm font-medium text-indigo-600 uppercase tracking-wider">
            Welcome Back
          </span>
          <div className="h-1 w-12 bg-indigo-200 rounded-full"></div>
        </div>
        
        <h2 className="text-4xl font-light text-blue-600">
          {greeting}, <span className="font-semibold">{userName || 'there'}</span>
        </h2>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Choose your course and subject to start a focused AI chat tailored to your syllabus.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
          <span className="px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700">
            Total courses: <span className="font-semibold">{courses.length}</span>
          </span>
          {selectedCourseId && (
            <span className="px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
              Subjects available:{" "}
              <span className="font-semibold">{subjects.length}</span>
            </span>
          )}
          {selectedCourse && selectedSubject && (
            <span className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium">
              Selected: {selectedCourse.name.split('(')[0].trim()} · {selectedSubject.name}
            </span>
          )}
        </div>
      </div>

      {/* Course Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Select Course
          </label>
          <p className="text-gray-600">
            Pick your degree program to see its mapped subjects.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {isLoadingCourses ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Loading courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No courses available. Please contact an administrator.
            </div>
          ) : (
            courses.map((course) => {
            const isActive = selectedCourseId === course.id;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setSelectedSubjectId(null);
                }}
                className={`relative flex items-start gap-4 rounded-2xl px-6 py-4 text-left border-2 transition-all
                  ${
                    isActive
                      ? `border-blue-500 bg-blue-50/70 shadow-lg`
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                  }`}
              >
                <div className={`p-2 rounded-xl ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-base font-semibold text-gray-900">{course.name}</p>
                  <p className="text-sm text-gray-600">
                    {course.name.includes('Tech') || course.name.includes('Engineering')
                      ? 'Core CS/IT & engineering subjects'
                      : 'Mapped core semester-wise subjects'}
                  </p>
                </div>
                {isActive && (
                  <span className="ml-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-blue-600 text-white">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Select Subject
          </label>
          <p className="text-gray-600">
            Choose the subject you want to chat about. Each chat stays attached to this subject.
          </p>
        </div>

        {!selectedCourseId && (
          <div className="text-gray-600 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl px-6 py-8 text-center text-lg">
            Pick a course above to see its subjects.
          </div>
        )}

        {isLoadingSubjects && selectedCourseId && (
          <div className="text-gray-600 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl px-6 py-8 text-center text-lg">
            Loading subjects...
          </div>
        )}

        {selectedCourseId && !isLoadingSubjects && subjects.length === 0 && (
          <div className="text-gray-600 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl px-6 py-8 text-center text-lg">
            No subjects available for this course. Please contact an administrator.
          </div>
        )}

        {selectedCourseId && !isLoadingSubjects && subjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="max-h-80 overflow-y-auto pr-2 space-y-3"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => {
                const isActive = selectedSubjectId === subject.id;
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(subject.id)}
                    className={`flex items-start gap-4 rounded-2xl px-6 py-4 border-2 text-left transition-all
                      ${
                        isActive
                          ? `border-blue-500 bg-white shadow-lg`
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                  >
                    <div className={`p-2 rounded-xl ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-900 mb-2">
                        {subject.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {subject.semester && (
                          <span className="inline-flex items-center rounded-full bg-gray-900 text-gray-50 px-3 py-1">
                            Sem {subject.semester}
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1">
                          AI-ready syllabus
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {selectedCourseId && subjects.length === 0 && (
          <div className="text-gray-600 text-lg text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            No subjects available for this course yet. Please contact your admin.
          </div>
        )}
      </div>

      {/* Context Summary + CTA */}
      <div className="space-y-4">
        <div className="text-gray-600 bg-gray-50 rounded-2xl border border-gray-200 px-6 py-4 text-lg">
          {selectedCourse && selectedSubject ? (
            <>
              <span className="font-semibold text-gray-800">Ready to start: </span>
              You're about to start a chat for{' '}
              <span className="font-semibold text-gray-800">
                {selectedSubject.name}
              </span>{' '}
              under{' '}
              <span className="font-semibold text-gray-800">
                {selectedCourse.name}
              </span>
              . Your questions and AI responses will be stored in this subject's history.
            </>
          ) : (
            <>
              Select both a course and a subject to unlock an AI chat tailored to that subject's
              exam pattern and syllabus.
            </>
          )}
        </div>

        <motion.button
          whileHover={!isLoading && selectedSubjectId ? { scale: 1.02 } : {}}
          whileTap={!isLoading && selectedSubjectId ? { scale: 0.98 } : {}}
          onClick={handleStartChat}
          disabled={!selectedSubjectId || isLoading}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full 
                    hover:from-blue-700 hover:to-blue-800 
                    disabled:opacity-50 disabled:cursor-not-allowed 
                    transition-all font-bold text-lg shadow-lg hover:shadow-xl
                    flex items-center justify-center gap-3"
        >
          {isLoading && (
            <span className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          <span>{isLoading ? 'Starting Chat...' : 'Start Chat'}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CourseSubjectSelector;