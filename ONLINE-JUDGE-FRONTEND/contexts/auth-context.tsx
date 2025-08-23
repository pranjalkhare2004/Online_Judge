'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<ApiResponse<LoginResponse>>;
  register: (userData: { name: string; email: string; password: string; username?: string; dateOfBirth?: string }) => Promise<ApiResponse<LoginResponse>>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<ApiResponse<RefreshResponse>>;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Token management utilities
const TOKEN_STORAGE_KEY = 'accessToken';
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
const USER_STORAGE_KEY = 'user';

interface AuthProvider {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProvider) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isDev = process.env.NODE_ENV === 'development';

  // Token management functions
  const getAccessToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return Cookies.get(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
  }, []);

  const getRefreshToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return Cookies.get(REFRESH_TOKEN_STORAGE_KEY) || localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  }, []);

  const setTokens = useCallback((accessToken: string, refreshToken: string, expiresIn?: number) => {
    if (typeof window === 'undefined') return;
    
    // Calculate expiry date for access token (default 15 minutes)
    const expiryMinutes = expiresIn ? Math.floor(expiresIn / 60) : 15;
    const accessTokenExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
    
    // Store access token with expiry
    Cookies.set(TOKEN_STORAGE_KEY, accessToken, { 
      expires: accessTokenExpiry,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Store refresh token for 30 days
    Cookies.set(REFRESH_TOKEN_STORAGE_KEY, refreshToken, { 
      expires: 30,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Fallback to localStorage
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    
    if (isDev) console.log('🔑 Tokens stored successfully');
  }, [isDev]);

  const clearTokens = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Clear cookies
    Cookies.remove(TOKEN_STORAGE_KEY);
    Cookies.remove(REFRESH_TOKEN_STORAGE_KEY);
    
    // Clear localStorage
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    
    if (isDev) console.log('🧹 Tokens cleared');
  }, [isDev]);

  const setUserData = useCallback((userData: User) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    }
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }): Promise<ApiResponse<LoginResponse>> => {
    try {
      setLoading(true);
      
      const response = await api.post('/auth/login', credentials);
      const data = response.data as ApiResponse<LoginResponse>;
      
      if (data.success && data.data) {
        const { accessToken, refreshToken, expiresIn, user: userData } = data.data;
        
        // Store tokens and user data
        setTokens(accessToken, refreshToken, expiresIn);
        setUserData(userData);
        
        if (isDev) console.log('✅ Login successful:', userData.email);
        
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${userData.name || userData.email}`,
        });
        
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Login failed';
      
      if (isDev) console.error('❌ Login error:', errorMessage);
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setTokens, setUserData, isDev]);

  const register = useCallback(async (userData: { 
    name: string; 
    email: string; 
    password: string; 
    username?: string; 
    dateOfBirth?: string;
    confirmPassword?: string;
    dob?: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    try {
      setLoading(true);
      
      // Transform data to match backend expectations
      const registrationData = {
        fullName: userData.name,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword || userData.password,
        username: userData.username,
        dateOfBirth: userData.dateOfBirth || userData.dob || '1990-01-01'
      };
      
      console.log('🔍 Auth context - userData received:', userData);
      console.log('🔍 Auth context - registrationData being sent:', registrationData);
      
      const response = await api.post('/auth/register', registrationData);
      const data = response.data as ApiResponse<LoginResponse>;
      
      if (data.success && data.data) {
        const { accessToken, refreshToken, expiresIn, user: newUser } = data.data;
        
        // Store tokens and user data
        setTokens(accessToken, refreshToken, expiresIn);
        setUserData(newUser);
        
        if (isDev) console.log('✅ Registration successful:', newUser.email);
        
        toast({
          title: 'Welcome!',
          description: `Account created successfully for ${newUser.name || newUser.email}`,
        });
        
        return data;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.message || 'Registration failed';
      
      if (isDev) console.error('❌ Registration error:', errorMessage);
      
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setTokens, setUserData, isDev]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      
      // Attempt to revoke tokens on the server
      if (refreshToken) {
        try {
          await api.post('/auth/logout', { 
            refreshToken,
            revokeAll: false 
          });
          if (isDev) console.log('🔐 Tokens revoked on server');
        } catch (error) {
          if (isDev) console.warn('⚠️ Server logout failed, proceeding with client logout');
        }
      }
      
      // Clear local storage
      clearTokens();
      setUser(null);
      
      if (isDev) console.log('🚪 User logged out');
      
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.'
      });
      
    } catch (error) {
      if (isDev) console.error('❌ Logout error:', error);
      // Still clear tokens locally even if server logout fails
      clearTokens();
      setUser(null);
    }
  }, [getRefreshToken, clearTokens, isDev]);

  const refreshTokens = useCallback(async (): Promise<ApiResponse<RefreshResponse>> => {
    try {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/auth/tokens/refresh', { refreshToken });
      const data = response.data as ApiResponse<RefreshResponse>;
      
      if (data.success && data.data) {
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = data.data;
        
        // Update stored tokens
        setTokens(accessToken, newRefreshToken, expiresIn);
        
        if (isDev) console.log('🔄 Tokens refreshed successfully');
        
        return data;
      } else {
        throw new Error(data.message || 'Token refresh failed');
      }
    } catch (error) {
      if (isDev) console.error('❌ Token refresh failed:', error);
      
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  }, [getRefreshToken, setTokens, logout, isDev]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...userData };
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
      return updatedUser;
    });
  }, []);

  // Set up axios interceptors for automatic token management
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const accessToken = getAccessToken();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
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

        // If access token expired, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshResult = await refreshTokens();
            
            if (refreshResult.success && refreshResult.data) {
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${refreshResult.data.accessToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, user will be logged out by refreshTokens function
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
  }, [getAccessToken, refreshTokens]);

  // Check authentication status on mount
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      if (isDev) console.log('🔧 Checking authentication status...');
      
      try {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        
        if (accessToken && refreshToken && storedUser) {
          // Try to verify token with server
          try {
            const response = await api.get('/auth/tokens/profile');
            
            if (response.data.success && response.data.data.user) {
              if (isMounted) {
                setUser(response.data.data.user);
                if (isDev) console.log('✅ Authentication verified');
              }
            } else {
              throw new Error('Profile verification failed');
            }
          } catch (error) {
            if (isDev) console.log('🔄 Attempting token refresh...');
            
            // Try to refresh tokens
            try {
              await refreshTokens();
              
              // Retry profile fetch
              const retryResponse = await api.get('/auth/tokens/profile');
              if (retryResponse.data.success && isMounted) {
                setUser(retryResponse.data.data.user);
                if (isDev) console.log('✅ Authentication restored via refresh');
              }
            } catch (refreshError) {
              if (isDev) console.log('❌ Token refresh failed, clearing auth');
              clearTokens();
            }
          }
        } else if (storedUser && accessToken) {
          // Fallback to stored user data if available
          try {
            const parsedUser = JSON.parse(storedUser);
            if (isMounted) {
              setUser(parsedUser);
              if (isDev) console.log('📋 Using cached user data');
            }
          } catch (error) {
            if (isDev) console.error('❌ Invalid stored user data');
            clearTokens();
          }
        }
      } catch (error) {
        if (isDev) console.error('❌ Auth check error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [getAccessToken, getRefreshToken, refreshTokens, clearTokens, isDev]);

  const isAuthenticated = !!user && !!getAccessToken();

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshTokens,
    updateUser,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
