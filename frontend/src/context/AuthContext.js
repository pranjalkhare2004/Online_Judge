/**
 * AUTHENTICATION CONTEXT
 * 
 * Purpose: Provides global authentication state management using React Context API.
 * This context handles user authentication state, login/logout operations, and
 * provides authentication-related utilities throughout the application.
 * 
 * Key Responsibilities:
 * - Manage global user authentication state
 * - Handle login and logout operations
 * - Persist authentication state across page reloads
 * - Provide user role checking utilities
 * - Token verification and automatic logout on invalid tokens
 * 
 * Why this exists: Authentication state needs to be accessible throughout the
 * application. React Context provides a clean way to share authentication state
 * and operations without prop drilling, making the app more maintainable.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      authService.verifyToken(token)
        .then(response => {
          if (response.success && response.user) {
            setUser(response.user);
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authService.logout();
  };

  // Helper functions for role checking
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isUser = () => {
    return user && user.role === 'user';
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAdmin,
    isUser,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
