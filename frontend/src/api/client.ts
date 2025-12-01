// -----------------------------------------------------------------------------
// File: client.ts
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: API client with axios configuration and all API endpoint functions for frontend
// -----------------------------------------------------------------------------

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Chat types
export type Chat = {
  id: number;
  title: string | null;
  subject_name: string | null;
  created_at: string;
};

export type ChatMessage = {
  id?: number;
  sender: 'USER' | 'BOT';
  message: string;
  created_at?: string;
  sources?: { title: string; page: number }[];
};

// Chat API functions
export const startChat = async (subjectId: number, title?: string): Promise<Chat> => {
  const response = await apiClient.post<Chat>('/chat/start', {
    subject_id: subjectId,
    title: title || undefined,
  });
  return response.data;
};

export const getChats = async (): Promise<Chat[]> => {
  const response = await apiClient.get<Chat[]>('/chat');
  return response.data;
};

export const getChatMessages = async (chatId: number): Promise<ChatMessage[]> => {
  const response = await apiClient.get<ChatMessage[]>(`/chat/${chatId}/messages`);
  return response.data;
};

export const sendChatMessage = async (
  chatId: number,
  question: string
): Promise<{ answer: string; sources: any[] }> => {
  const response = await apiClient.post<{ answer: string; sources: any[] }>(
    `/chat/${chatId}/message`,
    { question }
  );
  return response.data;
};

// Course and Subject types
export type Course = {
  id: number;
  name: string;
};

export type Subject = {
  id: number;
  course_id: number;
  name: string;
  semester?: number | null;
};

// Course and Subject API functions
export const getCourses = async (): Promise<Course[]> => {
  const response = await apiClient.get<Course[]>('/courses');
  return response.data;
};

export const getSubjects = async (courseId: number): Promise<Subject[]> => {
  const response = await apiClient.get<Subject[]>(`/courses/subjects?course_id=${courseId}`);
  return response.data;
};

// Alias for consistency with user's naming
export const getSubjectsByCourse = async (courseId: number): Promise<Subject[]> => {
  return getSubjects(courseId);
};

// Admin Course Management API functions
export const adminGetCourses = async (): Promise<Course[]> => {
  const response = await apiClient.get<Course[]>('/admin/courses');
  return response.data;
};

export const adminCreateCourse = async (name: string): Promise<Course> => {
  const response = await apiClient.post<Course>('/admin/courses', { name });
  return response.data;
};

export const adminDeleteCourse = async (courseId: number): Promise<void> => {
  await apiClient.delete(`/admin/courses/${courseId}`);
};

// Admin Subject Management API functions
export const adminGetSubjects = async (courseId?: number): Promise<Subject[]> => {
  const response = await apiClient.get<Subject[]>('/admin/subjects', {
    params: courseId ? { course_id: courseId } : {},
  });
  return response.data;
};

export const adminCreateSubject = async (data: {
  course_id: number;
  name: string;
  semester?: number;
}): Promise<Subject> => {
  const response = await apiClient.post<Subject>('/admin/subjects', data);
  return response.data;
};

export const adminDeleteSubject = async (subjectId: number): Promise<void> => {
  await apiClient.delete(`/admin/subjects/${subjectId}`);
};

// Materials types
export type MaterialDocument = {
  id: number;
  subject_id: number;
  title: string;
  s3_key: string | null;
  source_type: string;
  created_at: string;
};

export type MaterialChunk = {
  id: number;
  document_id: number;
  page_number: number | null;
  heading: string | null;
  keywords: string;
  text: string;
  created_at: string;
};

// Materials API functions
export const createMaterialDocument = async (
  subjectId: number,
  title: string
): Promise<MaterialDocument> => {
  const response = await apiClient.post<MaterialDocument>('/materials/documents', {
    subject_id: subjectId,
    title,
  });
  return response.data;
};

export const getMaterialDocuments = async (subjectId: number): Promise<MaterialDocument[]> => {
  const response = await apiClient.get<MaterialDocument[]>(`/materials/documents/${subjectId}`);
  return response.data;
};

export const createMaterialChunk = async (
  documentId: number,
  pageNumber: number | null,
  heading: string | null,
  keywords: string,
  text: string
): Promise<MaterialChunk> => {
  const response = await apiClient.post<MaterialChunk>('/materials/chunks', {
    document_id: documentId,
    page_number: pageNumber,
    heading: heading,
    keywords: keywords,
    text: text,
  });
  return response.data;
};

export const getMaterialChunks = async (documentId: number): Promise<MaterialChunk[]> => {
  const response = await apiClient.get<MaterialChunk[]>(`/materials/chunks/${documentId}`);
  return response.data;
};

export default apiClient;
