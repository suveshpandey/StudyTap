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

export default apiClient;
