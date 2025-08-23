// ONLINE-JUDGE-FRONTEND/lib/api-refreshtoken.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Token management utilities
const TOKEN_STORAGE_KEY = 'accessToken';
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';

const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return Cookies.get(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return Cookies.get(REFRESH_TOKEN_STORAGE_KEY) || localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
};

const setTokens = (accessToken: string, refreshToken: string, expiresIn?: number) => {
  if (typeof window === 'undefined') return;
  
  // Calculate expiry for access token (default 15 minutes)
  const expiryMinutes = expiresIn ? Math.floor(expiresIn / 60) : 15;
  const accessTokenExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  // Store in cookies with appropriate expiry
  Cookies.set(TOKEN_STORAGE_KEY, accessToken, { 
    expires: accessTokenExpiry,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  Cookies.set(REFRESH_TOKEN_STORAGE_KEY, refreshToken, { 
    expires: 30, // 30 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  // Fallback to localStorage
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
};

const clearTokens = () => {
  if (typeof window === 'undefined') return;
  
  Cookies.remove(TOKEN_STORAGE_KEY);
  Cookies.remove(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem('user');
};

// Request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      
      if (refreshToken) {
        try {
          // Attempt to refresh tokens
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/tokens/refresh`, {
            refreshToken: refreshToken
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (refreshResponse.data.success && refreshResponse.data.data) {
            const { accessToken, refreshToken: newRefreshToken, expiresIn } = refreshResponse.data.data;
            
            // Update stored tokens
            setTokens(accessToken, newRefreshToken, expiresIn);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          clearTokens();
          
          if (typeof window !== 'undefined') {
            // Only redirect if we're not already on an auth page
            if (!window.location.pathname.includes('/auth')) {
              window.location.href = '/auth';
            }
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, clear everything and redirect
        clearTokens();
        
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
          window.location.href = '/auth';
        }
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API utility functions
export const apiUtils = {
  // Token management
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  
  // Common request patterns
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await api.get(url, { params });
    return response.data;
  },

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await api.post(url, data);
    return response.data;
  },

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await api.put(url, data);
    return response.data;
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await api.delete(url);
    return response.data;
  },

  // Upload files
  async upload<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Health check
  async health(): Promise<ApiResponse<{ status: string; environment: string; uptime: string }>> {
    const response = await api.get('/health');
    return response.data;
  },

  // Authentication specific endpoints
  auth: {
    async login(credentials: { email: string; password: string }) {
      return apiUtils.post('/auth/login', credentials);
    },

    async register(userData: any) {
      return apiUtils.post('/auth/register', userData);
    },

    async logout(refreshToken?: string) {
      return apiUtils.post('/auth/logout', { refreshToken });
    },

    async refreshTokens(refreshToken: string) {
      return apiUtils.post('/auth/tokens/refresh', { refreshToken });
    },

    async getProfile() {
      return apiUtils.get('/auth/tokens/profile');
    },

    async getActiveTokens() {
      return apiUtils.get('/auth/tokens/active');
    },

    async revokeToken(refreshToken: string) {
      return apiUtils.post('/auth/tokens/revoke', { refreshToken });
    },

    async revokeAllTokens() {
      return apiUtils.post('/auth/tokens/revoke', { revokeAll: true });
    }
  },

  // Problems API
  problems: {
    async getAll(params?: { page?: number; limit?: number; difficulty?: string; tags?: string[] }) {
      return apiUtils.get('/problems', params);
    },

    async getById(id: string) {
      return apiUtils.get(`/problems/${id}`);
    },

    async create(problemData: any) {
      return apiUtils.post('/problems', problemData);
    },

    async update(id: string, problemData: any) {
      return apiUtils.put(`/problems/${id}`, problemData);
    },

    async delete(id: string) {
      return apiUtils.delete(`/problems/${id}`);
    }
  },

  // Submissions API
  submissions: {
    async submit(submissionData: { problemId: string; code: string; language: string }) {
      return apiUtils.post('/submissions', submissionData);
    },

    async getAll(params?: { page?: number; limit?: number; problemId?: string; status?: string }) {
      return apiUtils.get('/submissions', params);
    },

    async getById(id: string) {
      return apiUtils.get(`/submissions/${id}`);
    }
  },

  // Leaderboard API
  leaderboard: {
    async get(params?: { page?: number; limit?: number }) {
      return apiUtils.get('/leaderboard', params);
    }
  },

  // Contests API
  contests: {
    async getAll(params?: { page?: number; limit?: number; status?: string; search?: string }) {
      return apiUtils.get('/contests', params);
    },

    async getById(id: string) {
      return apiUtils.get(`/contests/${id}`);
    },

    async join(id: string) {
      return apiUtils.post(`/contests/${id}/join`);
    },

    async leave(id: string) {
      return apiUtils.post(`/contests/${id}/leave`);
    },

    async getLeaderboard(id: string, params?: { page?: number; limit?: number }) {
      return apiUtils.get(`/contests/${id}/leaderboard`, params);
    },

    async getProblems(id: string) {
      return apiUtils.get(`/contests/${id}/problems`);
    }
  }
};

// User API for dashboard and profile functionality
export const userAPI = {
  async getUserStats(userId: string) {
    return api.get(`/users/${userId}/stats`);
  },

  async getRecentSubmissions(userId: string, limit: number = 10) {
    return api.get(`/users/${userId}/submissions/recent?limit=${limit}`);
  },

  async updateProfile(userId: string, profileData: any) {
    return api.put(`/users/${userId}/profile`, profileData);
  }
};

// Compiler API for code execution and submission
export const compilerAPI = {
  async execute(data: { code: string; language: string; testCases: Array<{ input: string; expectedOutput: string }> }) {
    const response = await api.post('/compiler/execute', data);
    return response.data;
  },

  async runProblem(data: { code: string; language: string; problemId: string }) {
    // Use the submissions endpoint for problem submissions
    const response = await api.post('/submissions', {
      problemId: data.problemId,
      code: data.code,
      language: data.language
    });
    return response.data;
  }
};

// Problem API for problems page functionality
export const problemAPI = {
  async getProblems(params: any = {}) {
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
    
    const response = await api.get(`/problems?${queryParams.toString()}`);
    return response.data;
  },

  async getProblem(identifier: string) {
    const response = await api.get(`/problems/${identifier}`);
    return response.data;
  },

  async getTags() {
    const response = await api.get('/problems/tags');
    return response.data;
  },

  async getPopularTags() {
    try {
      const response = await api.get('/problems/tags/popular');
      return response.data;
    } catch {
      console.warn('getPopularTags endpoint not available, falling back to getTags');
      return this.getTags();
    }
  },

  async getSolvedProblems(userId?: string) {
    try {
      const endpoint = userId ? `/users/${userId}/solved-problems` : '/user/solved-problems';
      const response = await api.get(endpoint);
      return response.data;
    } catch {
      console.warn('getSolvedProblems endpoint not available, returning empty array');
      return { data: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 } };
    }
  },

  async getRecommendedProblems(userId?: string) {
    try {
      const endpoint = userId ? `/users/${userId}/recommended-problems` : '/problems/recommended';
      const response = await api.get(endpoint);
      return response.data;
    } catch {
      console.warn('getRecommendedProblems endpoint not available, returning empty array');
      return { data: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 } };
    }
  }
};

// Export TypeScript interfaces for the components
export interface UserStats {
  solvedProblems: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  rank: number;
  recentActivity: any[];
}

export interface Problem {
  _id: string;
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  description: string;
  examples: any[];
  constraints: string;
  status?: 'Solved' | 'Attempted' | 'Not Attempted';
}

export interface RecentSubmission {
  _id: string;
  problemId: string;
  problemTitle: string;
  status: string;
  language: string;
  submittedAt: string;
  executionTime?: number;
  memoryUsed?: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface TagData {
  name: string;
  count: number;
}

export interface FilterOptions {
  page?: number;
  limit?: number;
  difficulty?: string;
  tags?: string[];
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface Contest {
  _id: string;
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  participantCount: number;
  maxParticipants?: number;
  scoringType: string;
  status: 'upcoming' | 'live' | 'ended';
  createdBy: {
    _id: string;
    name: string;
    username: string;
  };
  problems?: string[];
  participants?: string[];
}

export default api;

// Export apiClient alias for backward compatibility
export const apiClient = {
  ...api,
  ...apiUtils,
  // Add contest methods for backward compatibility
  async getContests(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    return apiUtils.get('/contests', params);
  }
};
