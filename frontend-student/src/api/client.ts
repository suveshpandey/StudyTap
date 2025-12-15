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
export const startChat = async (subjectId?: number, title?: string): Promise<Chat> => {
  const response = await apiClient.post<Chat>('/chat/start', {
    subject_id: subjectId || undefined,
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

// Branch, Semester, and Subject types
export type Branch = {
  id: number;
  name: string;
  university_id: number;
};

export type Semester = {
  id: number;
  branch_id: number;
  semester_number: number;
  name: string;
};

export type Subject = {
  id: number;
  semester_id: number;
  name: string;
};

// Branch, Semester, and Subject API functions
export const getBranches = async (): Promise<Branch[]> => {
  const response = await apiClient.get<Branch[]>('/courses/branches');
  return response.data;
};

export const getSemesters = async (branchId: number): Promise<Semester[]> => {
  const response = await apiClient.get<Semester[]>(`/courses/semesters?branch_id=${branchId}`);
  return response.data;
};

export const getSubjects = async (semesterId: number): Promise<Subject[]> => {
  const response = await apiClient.get<Subject[]>(`/courses/subjects?semester_id=${semesterId}`);
  return response.data;
};

// Alias for consistency
export const getSubjectsBySemester = async (semesterId: number): Promise<Subject[]> => {
  return getSubjects(semesterId);
};

// Admin Branch Management API functions
export const adminGetBranches = async (): Promise<Branch[]> => {
  const response = await apiClient.get<Branch[]>('/admin/branches');
  return response.data;
};

export const adminCreateBranch = async (name: string): Promise<Branch> => {
  const response = await apiClient.post<Branch>('/admin/branches', { name });
  return response.data;
};

export const adminDeleteBranch = async (branchId: number): Promise<void> => {
  await apiClient.delete(`/admin/branches/${branchId}`);
};

// Admin Semester Management API functions
export const adminGetSemesters = async (branchId?: number): Promise<Semester[]> => {
  const response = await apiClient.get<Semester[]>('/admin/semesters', {
    params: branchId ? { branch_id: branchId } : {},
  });
  return response.data;
};

export const adminCreateSemester = async (data: {
  branch_id: number;
  semester_number: number;
  name: string;
}): Promise<Semester> => {
  const response = await apiClient.post<Semester>('/admin/semesters', data);
  return response.data;
};

export const adminDeleteSemester = async (semesterId: number): Promise<void> => {
  await apiClient.delete(`/admin/semesters/${semesterId}`);
};

// Admin Subject Management API functions
export const adminGetSubjects = async (semesterId?: number): Promise<Subject[]> => {
  const response = await apiClient.get<Subject[]>('/admin/subjects', {
    params: semesterId ? { semester_id: semesterId } : {},
  });
  return response.data;
};

export const adminCreateSubject = async (data: {
  semester_id: number;
  name: string;
}): Promise<Subject> => {
  const response = await apiClient.post<Subject>('/admin/subjects', data);
  return response.data;
};

export const adminDeleteSubject = async (subjectId: number): Promise<void> => {
  await apiClient.delete(`/admin/subjects/${subjectId}`);
};

// Student types
export type Student = {
  id: number;
  user_id: number | null;
  university_id: number;
  branch_id: number | null;
  batch_year: number | null;
  is_active: boolean;
  name: string;
  email: string;
  created_at: string;
};

export type StudentBulkCreateResponse = {
  success: number;
  errors: string[];
  students: Array<{
    name: string;
    email: string;
    password: string;
  }>;
};

// Admin Student Management API functions
export const adminGetStudents = async (
  branchId?: number,
  batchYear?: number
): Promise<Student[]> => {
  const params: any = {};
  if (branchId !== undefined) params.branch_id = branchId;
  if (batchYear !== undefined) params.batch_year = batchYear;
  const response = await apiClient.get<Student[]>('/admin/students', { params });
  return response.data;
};

export const adminUploadStudentsCSV = async (
  file: File,
  branchId: number,
  batchYear: number
): Promise<StudentBulkCreateResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('branch_id', branchId.toString());
  formData.append('batch_year', batchYear.toString());
  const response = await apiClient.post<StudentBulkCreateResponse>(
    '/admin/students/upload-csv',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const adminDeleteStudent = async (studentId: number): Promise<void> => {
  await apiClient.delete(`/admin/students/${studentId}`);
};

export const adminActivateStudent = async (studentId: number): Promise<Student> => {
  const response = await apiClient.post<Student>(`/admin/students/${studentId}/activate`);
  return response.data;
};

export const adminDeactivateStudent = async (studentId: number): Promise<Student> => {
  const response = await apiClient.post<Student>(`/admin/students/${studentId}/deactivate`);
  return response.data;
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

// University types
export type University = {
  id: number;
  name: string;
  code?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  is_active: boolean;
  created_at: string;
};

// Public API functions (no auth required)
export const getUniversities = async (): Promise<University[]> => {
  const response = await apiClient.get<University[]>('/courses/universities');
  return response.data;
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

// Master Admin University Management API functions
export const masterGetUniversities = async (): Promise<University[]> => {
  const res = await apiClient.get<University[]>("/master/universities");
  return res.data;
};

export const masterCreateUniversity = async (data: {
  name: string;
  code?: string;
  city?: string;
  state?: string;
  country?: string;
}): Promise<University> => {
  const res = await apiClient.post<University>("/master/universities", data);
  return res.data;
};

export const masterDeleteUniversity = async (id: number): Promise<void> => {
  await apiClient.delete(`/master/universities/${id}`);
};

export const masterAssignAdmin = async (
  universityId: number,
  userId: number
): Promise<void> => {
  await apiClient.post(`/master/universities/${universityId}/assign-admin`, null, {
    params: { user_id: userId },
  });
};

export const masterActivateUniversity = async (id: number): Promise<University> => {
  const res = await apiClient.post<University>(`/master/universities/${id}/activate`);
  return res.data;
};

export const masterDeactivateUniversity = async (id: number): Promise<University> => {
  const res = await apiClient.post<University>(`/master/universities/${id}/deactivate`);
  return res.data;
};

// Create university admin for a university.
// We don't strictly care about response shape, we only need to know when it succeeds.
export const masterCreateUniversityAdmin = async (
  universityId: number,
  data: { name: string; email: string; password: string }
): Promise<any> => {
  const res = await apiClient.post<any>(
    `/master/universities/${universityId}/create-admin`,
    data
  );
  return res.data;
};

// University Admin Management types
export type UniversityAdmin = {
  id: number;
  university_id: number;
  is_active: boolean;
  name: string;
  email: string;
};

// University Admin Management API functions
export const masterGetUniversityAdmins = async (universityId?: number): Promise<UniversityAdmin[]> => {
  const params = universityId ? { university_id: universityId } : {};
  const res = await apiClient.get<UniversityAdmin[]>('/master/university-admins', { params });
  return res.data;
};

export const masterActivateUniversityAdmin = async (adminId: number): Promise<UniversityAdmin> => {
  const res = await apiClient.post<UniversityAdmin>(`/master/university-admins/${adminId}/activate`);
  return res.data;
};

export const masterDeactivateUniversityAdmin = async (adminId: number): Promise<UniversityAdmin> => {
  const res = await apiClient.post<UniversityAdmin>(`/master/university-admins/${adminId}/deactivate`);
  return res.data;
};

export const masterDeleteUniversityAdmin = async (adminId: number): Promise<void> => {
  await apiClient.delete(`/master/university-admins/${adminId}`);
};

// Student Management API functions
export const masterGetStudents = async (universityId?: number): Promise<Student[]> => {
  const params = universityId ? { university_id: universityId } : {};
  const res = await apiClient.get<Student[]>('/master/students', { params });
  return res.data;
};

export const masterActivateStudent = async (studentId: number): Promise<Student> => {
  const res = await apiClient.post<Student>(`/master/students/${studentId}/activate`);
  return res.data;
};

export const masterDeactivateStudent = async (studentId: number): Promise<Student> => {
  const res = await apiClient.post<Student>(`/master/students/${studentId}/deactivate`);
  return res.data;
};

export const masterDeleteStudent = async (studentId: number): Promise<void> => {
  await apiClient.delete(`/master/students/${studentId}`);
};

// University Analytics
export type UniversityAnalytics = {
  id: number;
  name: string;
  code: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_active: boolean;
  created_at: string;
  total_students: number;
  total_branches: number;
  total_semesters: number;
  total_subjects: number;
  active_students: number;
  inactive_students: number;
  total_university_admins: number;
  active_university_admins: number;
  inactive_university_admins: number;
};

export const masterGetUniversityAnalytics = async (universityId: number): Promise<UniversityAnalytics> => {
  const res = await apiClient.get<UniversityAnalytics>(`/master/universities/${universityId}/analytics`);
  return res.data;
};

// Student Profile APIs
export const getStudentProfile = async (): Promise<Student> => {
  const res = await apiClient.get<Student>('/student/profile');
  return res.data;
};

export const updateStudentProfile = async (data: { name?: string; email?: string }): Promise<Student> => {
  const res = await apiClient.put<Student>('/student/profile', data);
  return res.data;
};

export const changeStudentPassword = async (data: { current_password: string; new_password: string }): Promise<{ message: string }> => {
  const res = await apiClient.post<{ message: string }>('/student/change-password', data);
  return res.data;
};

export const getQuestionsToday = async (): Promise<{ questions_today: number }> => {
  const res = await apiClient.get<{ questions_today: number }>('/student/questions-today');
  return res.data;
};

// University Admin Profile APIs
export type UniversityAdminProfile = {
  id: number;
  name: string;
  email: string;
  university_id: number;
  is_active: boolean;
};

export const getUniversityAdminProfile = async (): Promise<UniversityAdminProfile> => {
  const res = await apiClient.get<UniversityAdminProfile>('/university-admin/profile');
  return res.data;
};

export const updateUniversityAdminProfile = async (data: { name?: string; email?: string }): Promise<UniversityAdminProfile> => {
  const res = await apiClient.put<UniversityAdminProfile>('/university-admin/profile', data);
  return res.data;
};

export const changeUniversityAdminPassword = async (data: { current_password: string; new_password: string }): Promise<{ message: string }> => {
  const res = await apiClient.post<{ message: string }>('/university-admin/change-password', data);
  return res.data;
};

// University Details API
export type UniversityDetails = {
  id: number;
  name: string;
  code: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_active: boolean;
  created_at: string;
  total_students: number;
  total_branches: number;
  total_semesters: number;
  total_subjects: number;
  active_students: number;
  inactive_students: number;
};

export const getUniversityDetails = async (): Promise<UniversityDetails> => {
  const res = await apiClient.get<UniversityDetails>('/admin/university/details');
  return res.data;
};

// Master Admin Profile APIs
export type MasterAdminProfile = {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
};

export const getMasterAdminProfile = async (): Promise<MasterAdminProfile> => {
  const res = await apiClient.get<MasterAdminProfile>('/master-admin/profile');
  return res.data;
};

export const changeMasterAdminPassword = async (data: { current_password: string; new_password: string }): Promise<{ message: string }> => {
  const res = await apiClient.post<{ message: string }>('/master-admin/change-password', data);
  return res.data;
};

export default apiClient;
