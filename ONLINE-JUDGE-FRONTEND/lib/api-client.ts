/**
 * COMPREHENSIVE API CLIENT
 * 
 * Enhanced API client with real-time communication, proper error handling,
 * automatic retries, and comprehensive type safety for all backend operations.
 */

import axios, { AxiosError, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';

// Enhanced axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = Cookies.get('refreshToken') || localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/tokens/refresh`, {
            refreshToken
          });
          
          const { accessToken } = response.data.data;
          Cookies.set('accessToken', accessToken);
          localStorage.setItem('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Type Definitions
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ msg: string; param?: string }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface Problem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  isFeatured: boolean;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
  timeLimit: number;
  memoryLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  _id: string;
  problemId: string | Problem;
  userId: string;
  code: string;
  language: string;
  status: 'Pending' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  executionTime?: number;
  memoryUsed?: number;
  testResults?: Array<{
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    executionTime?: number;
  }>;
  submittedAt: string;
  completedAt?: string;
  error?: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface ExecutionResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  executionTime?: number;
  memoryUsed?: number;
  error?: string;
}

export interface CodeExecutionResponse {
  success: boolean;
  data?: {
    results: ExecutionResult[];
    totalTests: number;
    passedTests: number;
    executionTime: number;
    memoryUsed: number;
    overallResult: string;
    compilationError?: string;
  };
  message?: string;
  jobId?: string;
}

// API Client Class
export class OnlineJudgeAPI {
  
  // Problem Operations
  async getProblems(params?: {
    page?: number;
    limit?: number;
    difficulty?: string;
    tags?: string;
    search?: string;
    sort?: string;
  }): Promise<ApiResponse<PaginatedResponse<Problem>>> {
    try {
      const response = await apiClient.get('/problems', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getProblem(slug: string): Promise<ApiResponse<Problem>> {
    try {
      const response = await apiClient.get(`/problems/${slug}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Code Execution
  async executeCode(
    code: string,
    language: string,
    testCases: TestCase[]
  ): Promise<CodeExecutionResponse> {
    try {
      const response = await apiClient.post('/problems/execute', {
        code,
        language,
        testCases
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Submission Operations
  async submitCode(
    problemId: string,
    code: string,
    language: string
  ): Promise<ApiResponse<Submission>> {
    try {
      const response = await apiClient.post('/submissions', {
        problemId,
        code,
        language
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSubmission(submissionId: string): Promise<ApiResponse<Submission>> {
    try {
      const response = await apiClient.get(`/submissions/${submissionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserSubmissions(params?: {
    problemId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Submission>>> {
    try {
      const response = await apiClient.get('/submissions/user', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Real-time Submission Tracking
  trackSubmission(
    submissionId: string,
    onUpdate: (submission: Submission) => void
  ): () => void {
    let intervalId: NodeJS.Timeout;
    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;
      
      try {
        const response = await this.getSubmission(submissionId);
        if (response.success && response.data) {
          onUpdate(response.data);
          
          // Stop polling if submission is completed
          if (['Accepted', 'Wrong Answer', 'Runtime Error', 'Compilation Error', 'Time Limit Exceeded', 'Memory Limit Exceeded'].includes(response.data.status)) {
            isPolling = false;
            clearInterval(intervalId);
          }
        }
      } catch (error) {
        console.error('Error polling submission:', error);
      }
    };

    // Start polling immediately, then every 2 seconds
    poll();
    intervalId = setInterval(poll, 2000);

    // Return cleanup function
    return () => {
      isPolling = false;
      clearInterval(intervalId);
    };
  }

  // User Profile Operations
  async getUserProfile(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/user/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserStatistics(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/user/statistics');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Utility Methods
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      const status = error.response?.status;
      
      switch (status) {
        case 400:
          return new Error(`Bad Request: ${message}`);
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Access denied');
        case 404:
          return new Error('Resource not found');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Server error. Please try again.');
        default:
          return new Error(message || 'An unexpected error occurred');
      }
    }
    
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }

  // Retry mechanism for failed requests
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
    
    throw lastError!;
  }
}

// Create singleton instance
export const apiClient = new OnlineJudgeAPI();
export default apiClient;
