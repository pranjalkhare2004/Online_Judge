'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
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
}

interface SimpleAuthContextType {
  user: User | null;
  loading: boolean;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔥 SimpleAuthProvider initialized');
  console.log('🔥 User:', user);
  console.log('🔥 Loading:', loading);

  useEffect(() => {
    console.log('🔥 SimpleAuth useEffect triggered');
    
    const loadUser = async () => {
      console.log('🔥 loadUser function started');
      
      try {
        // Check for token
        const token = Cookies.get('authToken');
        console.log('🔥 Token found:', !!token);
        console.log('🔥 Token value:', token ? 'EXISTS' : 'NULL');
        
        if (token) {
          console.log('🔥 Making API call to /user/profile');
          
          // Set authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const response = await api.get('/user/profile');
          console.log('🔥 API response:', response.data);
          
          if (response.data.success) {
            const userData = response.data.data.user;
            setUser({
              id: userData.id,
              name: userData.FullName || userData.name || 'User',
              email: userData.Email || userData.email || '',
              username: userData.username,
              avatar: userData.avatarUrl,
              rating: userData.rating || 1200,
              isVerified: userData.isVerified || false,
              role: userData.role || 'user'
            });
            console.log('🔥 User set successfully');
          }
        } else {
          console.log('🔥 No token found');
        }
      } catch (error) {
        console.error('🔥 Error loading user:', error);
      } finally {
        setLoading(false);
        console.log('🔥 Loading set to false');
      }
    };

    loadUser();
  }, []);

  return (
    <SimpleAuthContext.Provider value={{ user, loading }}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
}
