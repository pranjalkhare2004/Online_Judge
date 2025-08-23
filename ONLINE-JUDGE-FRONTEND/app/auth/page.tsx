/**
 * AUTHENTICATION PAGE COMPONENT
 * 
 * DESCRIPTION:
 * This is the comprehensive authentication page that handles both user login and registration
 * for the Online Judge platform. It features a modern design with smooth animations,
 * form validation, OAuth integration, and responsive layout. Supports both traditional
 * email/password authentication and social OAuth providers.
 * 
 * FUNCTIONALITY:
 * - Dual-mode authentication (Login/Register toggle)
 * - Real-time form validation with error messages
 * - OAuth integration with Google and GitHub
 * - Responsive design with dark mode support
 * - Smooth animations and transitions
 * - Loading states and error handling
 * - Auto-redirect after successful authentication
 * - Role-based redirect logic (admin vs user)
 * 
 * FORM FIELDS:
 * Registration Mode:
 * - Full Name (required, 2-50 characters)
 * - Username (required, 3+ characters, alphanumeric with _ and -)
 * - Email Address (required, valid email format)
 * - Password (required, 6+ characters with complexity requirements)
 * 
 * Login Mode:
 * - Email Address (required, valid email format)
 * - Password (required)
 * 
 * UI ELEMENTS & BUTTONS:
 * Form Controls:
 * - Password visibility toggle (Eye/EyeOff icon)
 * - "Create Account" / "Sign In" (Primary submit button)
 * - Loading spinner during form submission
 * 
 * OAuth Buttons:
 * - "Google" -> OAuth with Google provider
 * - "GitHub" -> OAuth with GitHub provider
 * 
 * Navigation Controls:
 * - "Sign In" / "Create Account" (Mode toggle link)
 * - Form mode switches between login/registration
 * 
 * Interactive Elements:
 * - Hover animations on buttons and cards
 * - Form field focus states with ring effects
 * - Smooth transitions between login/register modes
 * - Real-time validation feedback
 * 
 * API INTEGRATION:
 * APIs Used:
 * 1. POST /auth/register
 *    Purpose: Create new user account
 *    Payload: { name, username, email, password }
 *    Response: { token, user } on success
 * 
 * 2. POST /auth/login  
 *    Purpose: Authenticate existing user
 *    Payload: { email, password }
 *    Response: { token, user } on success
 * 
 * OAuth Endpoints:
 * 3. GET /auth/oauth/google
 *    Purpose: Initiate Google OAuth flow
 *    Redirect: Opens Google authorization page
 * 
 * 4. GET /auth/oauth/github
 *    Purpose: Initiate GitHub OAuth flow
 *    Redirect: Opens GitHub authorization page
 * 
 * Authentication Flow:
 * 1. User submits form or clicks OAuth button
 * 2. API call made with form data or OAuth redirect
 * 3. On success: Token stored in cookies, user state updated
 * 4. Role-based redirect: Admin -> /admin, User -> /dashboard or /problems
 * 5. On error: Display validation errors or general error message
 * 
 * STATE MANAGEMENT:
 * - isSignUp: Boolean toggle between login/register modes
 * - showPassword: Boolean for password visibility toggle
 * - isLoading: Boolean for loading states during API calls
 * - Form validation errors: Object with field-specific error messages
 * 
 * SECURITY FEATURES:
 * - Input validation and sanitization
 * - Password complexity requirements
 * - CSRF protection through secure token handling
 * - Secure cookie storage for authentication tokens
 * - OAuth state validation
 * 
 * RESPONSIVE DESIGN:
 * - Mobile-first responsive design
 * - Card-based layout with proper spacing
 * - Adaptive typography and button sizing
 * - Dark mode support with proper contrast
 * - Touch-friendly interactive elements
 * 
 * USED BY:
 * - Unauthenticated users: Account creation and login
 * - OAuth providers: Social authentication integration
 * - Protected routes: Authentication requirement enforcement
 * - User onboarding: New user registration flow
 */

// ONLINE-JUDGE-FRONTEND/app/auth/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Calendar } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import Cookies from 'js-cookie';

/**
 * Form data interface for type-safe form handling
 */
interface FormData {
  name?: string;
  username?: string;
  email: string;
  password: string;
  dateOfBirth?: string;
}

/**
 * Enhanced Authentication Page Component
 * Features clean design, smooth animations, and comprehensive form validation
 */
export default function AuthPage() {
  // State management
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Navigation and routing
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login: authLogin, register: authRegister, user, loading } = useAuth();

  /**
   * Redirect already authenticated users
   */
  useEffect(() => {
    if (!loading && user) {
      console.log('User already authenticated:', user);
      if (user.role === 'admin') {
        console.log('Redirecting admin to dashboard');
        router.push('/admin');
      } else {
        console.log('Redirecting user to profile');
        router.push('/profile');
      }
    }
  }, [user, loading, router]);

  // React Hook Form setup with validation rules
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset
  } = useForm<FormData>({
    mode: 'onChange', // Real-time validation
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      dateOfBirth: ''
    }
  });

  /**
   * Handle OAuth token from URL parameters
   * Triggered when user returns from OAuth provider
   */
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    
    if (token) {
      Cookies.set('authToken', token, { expires: 7, secure: true, sameSite: 'strict' });
      localStorage.setItem('authToken', token);
      
      // Fetch user info to determine role-based redirect
      const fetchUserAndRedirect = async () => {
        try {
          const userResponse = await api.get('/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (userResponse.data.success) {
            const user = userResponse.data.data.user;
            
            toast({
              title: 'Success!',
              description: 'Logged in successfully via OAuth',
            });
            
            // Role-based redirection for OAuth
            if (user?.role === 'admin') {
              console.log('OAuth Admin user detected, redirecting to admin dashboard');
              router.push('/admin');
            } else {
              console.log('OAuth Regular user detected, redirecting to profile');
              router.push('/profile');
            }
          }
        } catch (error) {
          console.error('Error fetching user profile for OAuth:', error);
          router.push('/profile'); // Default fallback
        }
      };
      
      fetchUserAndRedirect();
    }
    
    if (error) {
      toast({
        title: 'Authentication Error',
        description: 'OAuth authentication failed. Please try again.',
        variant: 'destructive'
      });
    }
  }, [searchParams, router, toast]);

  /**
   * Form submission handler with comprehensive error handling
   */
  const onSubmit: SubmitHandler<FormData> = useCallback(async (data) => {
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Use AuthContext register function
        const registerData = { 
          name: data.name, 
          email: data.email, 
          password: data.password,
          username: data.username,
          dateOfBirth: data.dateOfBirth 
        };
        
        // Debug: Log the data being sent
        console.log('🔍 Frontend form data:', data);
        console.log('🔍 Register data being sent:', registerData);
        
        const response = await authRegister(registerData);
        
        if (response.success) {
          toast({
            title: 'Success!',
            description: 'Account created successfully',
          });
          
          reset(); // Clear form
          
          // Role-based redirection for registration
          const user = response.data?.user;
          if (user?.role === 'admin') {
            console.log('Admin user registered, redirecting to admin dashboard');
            router.push('/admin');
          } else {
            console.log('Regular user registered, redirecting to profile');
            router.push('/profile');
          }
        }
      } else {
        // Use AuthContext login function
        const response = await authLogin({ 
          email: data.email, 
          password: data.password 
        });
        
        if (response.success) {
          toast({
            title: 'Success!',
            description: 'Logged in successfully',
          });
          
          reset(); // Clear form
          
          // Role-based redirection for login
          const user = response.data?.user;
          if (user?.role === 'admin') {
            console.log('Admin user logged in, redirecting to admin dashboard');
            router.push('/admin');
          } else {
            console.log('Regular user logged in, redirecting to profile');
            router.push('/profile');
          }
        }
      }
    } catch (error: unknown) {
      console.error('Authentication error:', error);
      
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { response?: { data?: { message?: string } } };
        errorMessage = responseError.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isSignUp, router, reset, toast, authLogin, authRegister]);

  /**
   * OAuth authentication handler
   */
  const handleOAuth = useCallback((provider: 'google' | 'github') => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    window.location.href = `${baseUrl}/auth/oauth/${provider}`;
  }, []);

  /**
   * Form mode toggle handler with animation
   */
  const toggleMode = useCallback(() => {
    setIsSignUp(prev => !prev);
    reset(); // Clear form when switching modes
    setShowPassword(false);
  }, [reset]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <motion.div
        className="w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Card className="shadow-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300">
                {isSignUp 
                  ? 'Join our coding community today' 
                  : 'Sign in to access your account'
                }
                </p>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Form Container with AnimatePresence for smooth transitions */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={isSignUp ? 'signup' : 'signin'}
                  initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {/* Name field - only visible in signup mode */}
                  <AnimatePresence>
                    {isSignUp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                      >
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...register('name', {
                              required: isSignUp ? 'Name is required' : false,
                              minLength: {
                                value: 2,
                                message: 'Name must be at least 2 characters'
                              },
                              maxLength: {
                                value: 50,
                                message: 'Name must be less than 50 characters'
                              }
                            })}
                            placeholder="Full Name"
                            className={`pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                              errors.name ? 'border-red-400 focus:ring-red-500' : ''
                            }`}
                            aria-label="Full name"
                            disabled={isLoading}
                          />
                        </div>
                        {errors.name && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 dark:text-red-400 text-sm mt-1 ml-1"
                          >
                            {errors.name.message}
                          </motion.p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Username field - only visible in signup mode */}
                  <AnimatePresence>
                    {isSignUp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="relative"
                      >
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...register('username', {
                              required: isSignUp ? 'Username is required' : false,
                              minLength: {
                                value: 3,
                                message: 'Username must be at least 3 characters'
                              },
                              pattern: {
                                value: /^[a-zA-Z0-9_-]+$/,
                                message: 'Username can only contain letters, numbers, hyphens and underscores'
                              }
                            })}
                            placeholder="Username"
                            className={`pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                              errors.username ? 'border-red-400 focus:ring-red-500' : ''
                            }`}
                            aria-label="Username"
                            disabled={isLoading}
                          />
                        </div>
                        {errors.username && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 dark:text-red-400 text-sm mt-1 ml-1"
                          >
                            {errors.username.message}
                          </motion.p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email field */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                  >
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                            message: 'Please enter a valid email address'
                          }
                        })}
                        type="email"
                        placeholder="Email Address"
                        className={`pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                          errors.email ? 'border-red-400 focus:ring-red-500' : ''
                        }`}
                        aria-label="Email address"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 dark:text-red-400 text-sm mt-1 ml-1"
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Password field */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative"
                  >
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters'
                          },
                          pattern: isSignUp ? {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                            message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                          } : undefined
                        })}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        className={`pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                          errors.password ? 'border-red-400 focus:ring-red-500' : ''
                        }`}
                        aria-label="Password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 dark:text-red-400 text-sm mt-1 ml-1"
                      >
                        {errors.password.message}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Date of Birth field - only visible in signup mode */}
                  <AnimatePresence>
                    {isSignUp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="relative"
                      >
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...register('dateOfBirth', {
                              required: isSignUp ? 'Date of birth is required' : false,
                              validate: isSignUp ? (value) => {
                                if (!value) return 'Date of birth is required';
                                const birthDate = new Date(value);
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                  age--;
                                }
                                
                                if (age < 13) {
                                  return 'You must be at least 13 years old';
                                }
                                
                                if (age > 120) {
                                  return 'Please provide a valid birth date';
                                }
                                
                                return true;
                              } : undefined
                            })}
                            type="date"
                            placeholder="Date of Birth"
                            className={`pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                              errors.dateOfBirth ? 'border-red-400 focus:ring-red-500' : ''
                            }`}
                            aria-label="Date of birth"
                            disabled={isLoading}
                          />
                        </div>
                        {errors.dateOfBirth && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 dark:text-red-400 text-sm mt-1 ml-1"
                          >
                            {errors.dateOfBirth.message}
                          </motion.p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition-colors duration-200"
                      disabled={isLoading}
                      aria-label={isSignUp ? 'Create account' : 'Sign in'}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                        </div>
                      ) : (
                        isSignUp ? 'Create Account' : 'Sign In'
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              </AnimatePresence>

              {/* OAuth Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-50 dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleOAuth('google')}
                  >
                    <FcGoogle className="h-5 w-5 mr-2" />
                    Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleOAuth('github')}
                  >
                    <FaGithub className="h-5 w-5 mr-2" />
                    GitHub
                  </Button>
                </div>
              </motion.div>

              {/* Mode Toggle */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <p className="text-gray-600 dark:text-gray-300">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-0 h-auto font-semibold"
                  onClick={toggleMode}
                  disabled={isLoading}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

