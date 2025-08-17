// ONLINE-JUDGE-FRONTEND/lib/api-clean.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Try cookie first, then localStorage
      const token = Cookies.get('token') || localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        Cookies.remove('token');
        localStorage.removeItem('authToken');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  rating: number;
  avatar?: string;
  createdAt: string;
}

export interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string;
  timeLimit: number;
  memoryLimit: number;
  tags: string[];
  author: string;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  createdAt: string;
}

export interface Submission {
  _id: string;
  problem: Problem;
  user: User;
  code: string;
  language: string;
  status: 'Pending' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  executionTime?: number;
  memoryUsed?: number;
  createdAt: string;
}

// Export the api instance for direct use
export { api as default };
