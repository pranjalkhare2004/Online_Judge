'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  rating: number;
  isVerified: boolean;
  role: string;
  solvedProblems?: number;
  totalSubmissions?: number;
  successfulSubmissions?: number;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const isApiError = (error: unknown): error is ApiError => {
  return typeof error === 'object' && error !== null && 'response' in error;
};

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<ApiResponse<LoginResponse>>;
  register: (userData: { name: string; email: string; password: string; username?: string }) => Promise<ApiResponse<LoginResponse>>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<ApiResponse<{ token: string }>>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Secure token management
  const getToken = (): string | undefined => {
    return Cookies.get('authToken');
  };

  const setToken = (token: string): void => {
    Cookies.set('authToken', token, {
      expires: 7, // 7 days
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  };

  const removeToken = (): void => {
    Cookies.remove('authToken', { path: '/' });
  };

  // Set up axios interceptor for automatic token inclusion
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If token expired, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await refreshToken();
            const newToken = getToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            await logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken();
        if (token) {
          const response = await api.get('/auth/tokens/profile');
          if (response.data.success) {
            setUser(response.data.data.user);
          } else {
            removeToken();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        removeToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Cross-tab authentication sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_sync') {
        if (e.newValue === 'logout') {
          setUser(null);
          removeToken();
        } else if (e.newValue === 'login') {
          // Refresh user data when login detected in another tab
          const token = getToken();
          if (token) {
            api.get('/auth/tokens/profile')
              .then(response => {
                if (response.data.success) {
                  setUser(response.data.data.user);
                }
              })
              .catch(console.error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { token, user: userData } = response.data.data;
        setToken(token);
        setUser(userData);
        
        // Sync across tabs
        localStorage.setItem('auth_sync', 'login');
        setTimeout(() => localStorage.removeItem('auth_sync'), 100);
        
        toast({
          title: 'Welcome back!',
          description: `Hello ${userData.name}, you're successfully logged in.`
        });
      }
      
      return response.data;
    } catch (error: unknown) {
      const message = isApiError(error) ? error.response?.data?.message : 'Login failed';
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: message
      });
      throw error;
    }
  };

  const register = async (userData: { name: string; email: string; password: string; username?: string }) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token, user: newUser } = response.data.data;
        setToken(token);
        setUser(newUser);
        
        // Sync across tabs
        localStorage.setItem('auth_sync', 'login');
        setTimeout(() => localStorage.removeItem('auth_sync'), 100);
        
        toast({
          title: 'Account Created!',
          description: `Welcome ${newUser.name}! Your account has been created successfully.`
        });
      }
      
      return response.data;
    } catch (error) {
      const message = isApiError(error) ? error.response?.data?.message : 'Registration failed';
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: message
      });
      throw error;
    }
  };

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      removeToken();
      setUser(null);
      
      // Sync across tabs
      localStorage.setItem('auth_sync', 'logout');
      setTimeout(() => localStorage.removeItem('auth_sync'), 100);
      
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.'
      });
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await api.post('/auth/tokens/refresh');
      
      if (response.data.success) {
        const { token } = response.data.data;
        setToken(token);
        return response.data;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      removeToken();
      setUser(null);
      throw error;
    }
  }, []);

  const updateUser = (userData: Partial<User>): void => {
    setUser(prevUser => prevUser ? { ...prevUser, ...userData } : null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
