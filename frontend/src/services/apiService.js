// Enhanced API service for frontend CRUD operations
const API_BASE_URL = 'http://localhost:8080/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  return handleResponse(response);
};

// ================================
// AUTH SERVICE
// ================================
export const authService = {
  register: async (userData) => {
    return apiCall('/register', {
      method: 'POST',
      body: userData,
    });
  },

  login: async (credentials) => {
    const response = await apiCall('/login', {
      method: 'POST',
      body: credentials,
    });
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  verifyToken: async () => {
    return apiCall('/verify');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user?.role === 'admin';
  }
};

// ================================
// USER CRUD SERVICE
// ================================
export const userService = {
  // Get all users (Admin only)
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/admin/users/all?${queryString}`);
  },

  // Get single user
  getById: async (userId) => {
    return apiCall(`/admin/users/${userId}`);
  },

  // Update user
  update: async (userId, userData) => {
    return apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: userData,
    });
  },

  // Delete user (Admin only)
  delete: async (userId) => {
    return apiCall(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Update user role (Admin only)
  updateRole: async (userId, role) => {
    return apiCall(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: { role },
    });
  },

  // Get user profile
  getProfile: async (userId) => {
    return apiCall(`/profile/${userId}`);
  },
};

// ================================
// PROBLEM CRUD SERVICE
// ================================
export const problemService = {
  // Get all problems with filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/problems/all?${queryString}`);
  },

  // Get single problem
  getBySlug: async (slug) => {
    return apiCall(`/problems/${slug}`);
  },

  // Create problem (Admin only)
  create: async (problemData) => {
    return apiCall('/admin/problems', {
      method: 'POST',
      body: problemData,
    });
  },

  // Update problem (Admin only)
  update: async (problemId, problemData) => {
    return apiCall(`/admin/problems/${problemId}`, {
      method: 'PUT',
      body: problemData,
    });
  },

  // Delete problem (Admin only)
  delete: async (problemId) => {
    return apiCall(`/admin/problems/${problemId}`, {
      method: 'DELETE',
    });
  },

  // Get admin problems
  getAdminProblems: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/admin/problems?${queryString}`);
  },
};

// ================================
// SUBMISSION CRUD SERVICE
// ================================
export const submissionService = {
  // Create submission
  create: async (submissionData) => {
    return apiCall('/submissions', {
      method: 'POST',
      body: submissionData,
    });
  },

  // Get user's submissions
  getMy: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/submissions/my?${queryString}`);
  },

  // Get all submissions (Admin only)
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/admin/submissions?${queryString}`);
  },

  // Get single submission
  getById: async (submissionId) => {
    return apiCall(`/submissions/${submissionId}`);
  },
};

// ================================
// CONTEST CRUD SERVICE
// ================================
export const contestService = {
  // Get all contests
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/contests?${queryString}`);
  },

  // Get single contest
  getById: async (contestId) => {
    return apiCall(`/contests/${contestId}`);
  },

  // Create contest (Admin only)
  create: async (contestData) => {
    return apiCall('/admin/contests', {
      method: 'POST',
      body: contestData,
    });
  },

  // Update contest (Admin only)
  update: async (contestId, contestData) => {
    return apiCall(`/admin/contests/${contestId}`, {
      method: 'PUT',
      body: contestData,
    });
  },

  // Delete contest (Admin only)
  delete: async (contestId) => {
    return apiCall(`/admin/contests/${contestId}`, {
      method: 'DELETE',
    });
  },

  // Register for contest
  register: async (contestId) => {
    return apiCall(`/contests/${contestId}/register`, {
      method: 'POST',
    });
  },
};

// ================================
// ANALYTICS SERVICE
// ================================
export const analyticsService = {
  // Get platform analytics (Admin only)
  getPlatformStats: async () => {
    return apiCall('/admin/analytics');
  },
};

// ================================
// UTILITY FUNCTIONS
// ================================
export const utils = {
  // Format date
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Get status color
  getStatusColor: (status) => {
    const colors = {
      'Accepted': 'text-green-600',
      'Wrong Answer': 'text-red-600',
      'Time Limit Exceeded': 'text-yellow-600',
      'Runtime Error': 'text-purple-600',
      'Compilation Error': 'text-pink-600',
      'Pending': 'text-blue-600',
    };
    return colors[status] || 'text-gray-600';
  },

  // Get difficulty color
  getDifficultyColor: (difficulty) => {
    const colors = {
      'Easy': 'text-green-600',
      'Medium': 'text-yellow-600',
      'Hard': 'text-red-600',
    };
    return colors[difficulty] || 'text-gray-600';
  },

  // Truncate text
  truncateText: (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Validate form data
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword: (password) => {
    return password.length >= 6;
  },

  // Handle API errors
  handleApiError: (error, setError = null) => {
    console.error('API Error:', error);
    const errorMessage = error.message || 'Something went wrong. Please try again.';
    
    if (setError) {
      setError(errorMessage);
    }
    
    // If unauthorized, redirect to login
    if (error.message?.includes('Unauthorized') || error.message?.includes('Invalid token')) {
      authService.logout();
      window.location.href = '/login';
    }
    
    return errorMessage;
  },
};

// ================================
// EXAMPLE USAGE COMPONENTS
// ================================

// Example React hook for problems
export const useProblemsCRUD = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  const loadProblems = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await problemService.getAll(params);
      setProblems(response.problems);
      setPagination(response.pagination);
    } catch (err) {
      utils.handleApiError(err, setError);
    } finally {
      setLoading(false);
    }
  };

  const createProblem = async (problemData) => {
    try {
      setLoading(true);
      const response = await problemService.create(problemData);
      await loadProblems(); // Refresh list
      return response;
    } catch (err) {
      utils.handleApiError(err, setError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProblem = async (problemId, problemData) => {
    try {
      setLoading(true);
      const response = await problemService.update(problemId, problemData);
      await loadProblems(); // Refresh list
      return response;
    } catch (err) {
      utils.handleApiError(err, setError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProblem = async (problemId) => {
    try {
      setLoading(true);
      await problemService.delete(problemId);
      await loadProblems(); // Refresh list
    } catch (err) {
      utils.handleApiError(err, setError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    problems,
    loading,
    error,
    pagination,
    loadProblems,
    createProblem,
    updateProblem,
    deleteProblem,
  };
};

// Default export with all services
const apiService = {
  auth: authService,
  users: userService,
  problems: problemService,
  submissions: submissionService,
  contests: contestService,
  analytics: analyticsService,
  utils,
};

export default apiService;
