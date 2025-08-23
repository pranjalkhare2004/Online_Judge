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
  }
};

export default api;
