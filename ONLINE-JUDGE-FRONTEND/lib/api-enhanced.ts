/**
 * ENHANCED API CLIENT
 * 
 * Professional API client with TypeScript interfaces, error handling,
 * job queue support, and comprehensive type safety.
 */

import axios, { AxiosError, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// Base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Try cookie first, then localStorage
      const token = Cookies.get('authToken') || localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle specific HTTP status codes
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        Cookies.remove('authToken');
        localStorage.removeItem('authToken');
        window.location.href = '/auth';
      }
    } else if (error.response?.status === 429) {
      // Rate limited
      console.warn('Rate limited:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// TypeScript Interfaces
export interface TestCase {
  input: string;
  expectedOutput: string;
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
    compilationError?: string;
    overallResult: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
    executionTime: number;
    memoryUsed: number;
    score?: number;
  };
  jobId?: string;
  status?: 'completed' | 'queued' | 'running' | 'failed';
  message?: string;
  pollInterval?: number;
  error?: string;
  errors?: Array<{ msg: string; param?: string }>;
}

export interface JobResultResponse {
  success: boolean;
  status: 'completed' | 'running' | 'failed' | 'not_found';
  data?: any;
  progress?: number;
  message?: string;
  error?: string;
}

export interface LanguageInfo {
  value: string;
  label: string;
  extension: string;
  version?: string;
  features?: string[];
}

export interface ProblemExecutionRequest {
  code: string;
  language: string;
  problemId: string;
}

export interface ExecutionStatsResponse {
  success: boolean;
  data?: {
    queue: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
    system: {
      redisAvailable: boolean;
      nodeVersion: string;
      uptime: number;
      memory: {
        rss: number;
        heapUsed: number;
        heapTotal: number;
        external: number;
      };
    };
  };
}

export interface HealthCheckResponse {
  success: boolean;
  data: {
    status: string;
    timestamp: string;
    services: {
      redis: boolean;
      queue: boolean;
    };
    version: string;
  };
}

// Legacy API interfaces (keeping existing functionality)
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
  description?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[] | { timeLimit: number; memoryLimit: number };
  timeLimit?: number;
  memoryLimit?: number;
  tags: string[];
  createdBy?: { _id: string; name: string; username: string };
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  solved?: boolean;
}

export interface CustomProblemList {
  _id: string;
  name: string;
  description?: string;
  problems: Problem[];
  isPublic: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  page?: number;
  limit?: number;
  difficulty?: string;
  search?: string;
  tags?: string[];
  acceptanceRateMin?: number;
  acceptanceRateMax?: number;
  sortBy?: string;
  sortOrder?: string;
  solved?: boolean;
}

export interface TagData {
  _id: string;
  name: string;
  count: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error handling utility
const handleApiError = (error: AxiosError): never => {
  if (error.response?.data) {
    const errorData = error.response.data as any;
    throw new Error(errorData.message || errorData.error || 'API request failed');
  }
  throw new Error(error.message || 'Network error occurred');
};

// Enhanced Compiler API Functions

/**
 * Execute code with custom test cases (async with job queue)
 */
export const executeCode = async (
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<CodeExecutionResponse> => {
  try {
    const response: AxiosResponse<CodeExecutionResponse> = await api.post('/compiler/execute', {
      code,
      language,
      testCases
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
  }
};

/**
 * Execute code synchronously (immediate results)
 */
export const executeCodeSync = async (
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<CodeExecutionResponse> => {
  try {
    const response: AxiosResponse<CodeExecutionResponse> = await api.post('/compiler/execute-sync', {
      code,
      language,
      testCases
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
  }
};

/**
 * Get execution result by job ID
 */
export const getJobResult = async (jobId: string): Promise<JobResultResponse> => {
  try {
    const response: AxiosResponse<JobResultResponse> = await api.get(`/compiler/result/${jobId}`);
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
  }
};

/**
 * Execute code against a specific problem
 */
export const runProblem = async (
  code: string,
  language: string,
  problemId: string
): Promise<CodeExecutionResponse> => {
  try {
    const response: AxiosResponse<CodeExecutionResponse> = await api.post('/compiler/run-problem', {
      code,
      language,
      problemId
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
  }
};

/**
 * Get supported programming languages
 */
export const getSupportedLanguages = async (): Promise<LanguageInfo[]> => {
  try {
    const response = await api.get('/compiler/languages');
    return response.data.data;
  } catch (error) {
    console.error('Failed to get supported languages:', error);
    // Return fallback languages if API fails
    return [
      { value: 'cpp', label: 'C++', extension: 'cpp' },
      { value: 'java', label: 'Java', extension: 'java' },
      { value: 'python', label: 'Python', extension: 'py' },
      { value: 'javascript', label: 'JavaScript', extension: 'js' }
    ];
  }
};

/**
 * Get execution queue statistics (admin only)
 */
export const getExecutionStats = async (): Promise<ExecutionStatsResponse> => {
  try {
    const response: AxiosResponse<ExecutionStatsResponse> = await api.get('/compiler/stats');
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
  }
};

/**
 * Health check
 */
export const healthCheck = async (): Promise<HealthCheckResponse> => {
  try {
    const response: AxiosResponse<HealthCheckResponse> = await api.get('/compiler/health');
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
  }
};

// Polling utility for job results
export const pollJobResult = async (
  jobId: string,
  onUpdate?: (result: JobResultResponse) => void,
  maxAttempts: number = 60,
  interval: number = 1000
): Promise<JobResultResponse> => {
  let attempts = 0;
  
  const poll = async (): Promise<JobResultResponse> => {
    if (attempts >= maxAttempts) {
      throw new Error('Job polling timeout - maximum attempts reached');
    }
    
    attempts++;
    const result = await getJobResult(jobId);
    
    if (onUpdate) {
      onUpdate(result);
    }
    
    if (result.status === 'completed' || result.status === 'failed') {
      return result;
    }
    
    // Continue polling
    await new Promise(resolve => setTimeout(resolve, interval));
    return poll();
  };
  
  return poll();
};

// Utility function for handling execution with automatic job polling
export const executeCodeWithPolling = async (
  code: string,
  language: string,
  testCases: TestCase[],
  onProgress?: (progress: { status: string; message?: string; progress?: number }) => void
): Promise<CodeExecutionResponse> => {
  // Start execution
  const executionResponse = await executeCode(code, language, testCases);
  
  // If completed immediately, return result
  if (executionResponse.status === 'completed') {
    return executionResponse;
  }
  
  // If queued, start polling
  if (executionResponse.jobId) {
    if (onProgress) {
      onProgress({ 
        status: 'queued', 
        message: 'Code execution queued...' 
      });
    }
    
    const jobResult = await pollJobResult(
      executionResponse.jobId,
      (result) => {
        if (onProgress && result.status === 'running') {
          onProgress({
            status: 'running',
            message: 'Executing code...',
            progress: result.progress
          });
        }
      }
    );
    
    if (jobResult.success && jobResult.data) {
      return {
        success: true,
        data: jobResult.data,
        status: 'completed',
        message: 'Execution completed successfully'
      };
    } else {
      return {
        success: false,
        message: jobResult.message || 'Execution failed',
        error: jobResult.error
      };
    }
  }
  
  return executionResponse;
};

// Legacy API Functions for Problems (keeping existing functionality)
export const problemAPI = {
  // Get problems with filtering and pagination
  async getProblems(params: FilterOptions = {}): Promise<ApiResponse<{ problems: Problem[]; pagination: PaginationInfo; totalCount: number }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'All') {
        if (Array.isArray(value) && value.length > 0) {
          queryParams.append(key, value.join(','));
        } else if (!Array.isArray(value)) {
          queryParams.append(key, value.toString());
        }
      }
    });
    
    console.log('Fetching problems with params:', queryParams.toString());
    const response = await api.get(`/problems?${queryParams.toString()}`);
    return response.data;
  },

  // Get single problem by ID or slug
  async getProblem(identifier: string): Promise<ApiResponse<{ problem: Problem }>> {
    const response = await api.get(`/problems/${identifier}`);
    return response.data;
  },

  // Get problem tags
  async getTags(): Promise<ApiResponse<TagData[]>> {
    const response = await api.get('/problems/tags');
    return response.data;
  },

  // Create custom problem list
  async createCustomList(data: { name: string; description?: string; problemIds: string[]; isPublic: boolean }): Promise<ApiResponse<CustomProblemList>> {
    const response = await api.post('/problems/lists', data);
    return response.data;
  },

  // Get custom problem lists
  async getCustomLists(): Promise<ApiResponse<CustomProblemList[]>> {
    const response = await api.get('/problems/lists');
    return response.data;
  },

  // Get single custom list
  async getCustomList(listId: string): Promise<ApiResponse<CustomProblemList>> {
    const response = await api.get(`/problems/lists/${listId}`);
    return response.data;
  },

  // Update custom list
  async updateCustomList(listId: string, data: Partial<CustomProblemList>): Promise<ApiResponse<CustomProblemList>> {
    const response = await api.put(`/problems/lists/${listId}`, data);
    return response.data;
  },

  // Delete custom list
  async deleteCustomList(listId: string): Promise<ApiResponse<{}>> {
    const response = await api.delete(`/problems/lists/${listId}`);
    return response.data;
  }
};

// Authentication API
export const authAPI = {
  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(userData: { name: string; username: string; email: string; password: string }): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      Cookies.remove('authToken');
      localStorage.removeItem('authToken');
    }
  }
};

// Export the axios instance for direct use if needed
export { api };

// Re-export common types
export type { AxiosResponse, AxiosError };
