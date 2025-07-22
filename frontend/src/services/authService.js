/**
 * AUTHENTICATION SERVICE
 * 
 * Purpose: Handles all HTTP communication with the backend authentication API.
 * This service provides a clean interface for authentication operations and
 * automatically manages JWT tokens for authenticated requests.
 * 
 * Key Responsibilities:
 * - Configure Axios instance with proper base URL and headers
 * - Automatically attach JWT tokens to authenticated requests
 * - Provide methods for login, register, logout operations
 * - Handle token verification and refresh
 * - Interface with admin and user management endpoints
 * 
 * Why this exists: Separating API communication logic from components makes
 * the code more maintainable and testable. This service centralizes all
 * authentication-related HTTP requests and token management.
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  verifyToken: async (token) => {
    try {
      const response = await api.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      // Clear the token locally
      localStorage.removeItem('token');
      return Promise.resolve();
    } catch (error) {
      throw error;
    }
  },

  // Admin-specific methods
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  createProblem: async (problemData) => {
    const response = await api.post('/admin/problems', problemData);
    return response.data;
  },

  getAdminProblems: async () => {
    const response = await api.get('/admin/problems');
    return response.data;
  },

  // Public problem methods
  getProblems: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/problems?${params}`);
    return response.data;
  },

  getProblem: async (slug) => {
    const response = await api.get(`/problems/${slug}`);
    return response.data;
  }
};
