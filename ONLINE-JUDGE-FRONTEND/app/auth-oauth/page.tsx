/**
 * OAUTH AUTHENTICATION PAGE COMPONENT - COMPLETE AUTHENTICATION INTERFACE
 * 
 * DESCRIPTION:
 * This is the comprehensive authentication page supporting multiple sign-in methods
 * including OAuth providers (Google, GitHub) and traditional credentials-based
 * authentication. Features a tabbed interface for sign-in/sign-up with form
 * validation, error handling, and role-based redirection. Implements NextAuth.js
 * integration with custom styling and responsive design.
 * 
 * FUNCTIONALITY:
 * - Multi-provider OAuth authentication (Google, GitHub)
 * - Credentials-based sign-in and registration
 * - Tabbed interface for sign-in vs sign-up forms
 * - Role-based redirection (admin vs user)
 * - Form validation and error handling
 * - Loading states with spinner animations
 * - Success/error message display
 * - Responsive design with gradient backgrounds
 * - Auto-redirect after successful registration
 * - Session management integration
 * 
 * AUTHENTICATION METHODS:
 * 1. OAuth Providers - Google and GitHub integration
 * 2. Credentials - Email/password authentication
 * 3. Registration - New user account creation
 * 
 * UI ELEMENTS & BUTTONS:
 * OAuth Authentication:
 * - "Continue with Google" button (Red Chrome icon, hover effects)
 *   -> handleOAuthSignIn('google') -> NextAuth Google provider
 * - "Continue with GitHub" button (Gray GitHub icon, hover effects)
 *   -> handleOAuthSignIn('github') -> NextAuth GitHub provider
 * 
 * Tab Navigation:
 * - "Sign In" tab -> Switch to credentials sign-in form
 * - "Sign Up" tab -> Switch to registration form
 * 
 * Sign-In Form (credentials):
 * - Email input field (required, email validation)
 * - Password input field (required, password masking)
 * - "Sign In" button -> handleCredentialsSignIn() with loading state
 * 
 * Sign-Up Form (registration):
 * - Full Name input field (required text input)
 * - Username input field (required, unique validation)
 * - Email input field (required, email validation)
 * - Password input field (required, secure password)
 * - "Create Account" button -> handleCredentialsSignUp() with loading state
 * 
 * Visual Elements:
 * - Gradient background (blue to purple)
 * - Frosted glass card effect with backdrop blur
 * - Loading spinners during authentication
 * - Success/error alerts with color coding
 * - Separator with "Or continue with email" text
 * - Gradient brand title with text clipping
 * 
 * AUTHENTICATION HANDLERS:
 * OAuth Sign-In Flow:
 * - handleOAuthSignIn(provider) accepts 'google' | 'github'
 * - Uses NextAuth signIn() with provider and callback URL
 * - Redirects to /dashboard on success
 * - Error handling with user-friendly messages
 * 
 * Credentials Sign-In Flow:
 * - handleCredentialsSignIn() processes form data
 * - Uses NextAuth signIn('credentials') with email/password
 * - Checks user role for redirection (admin -> /admin, user -> /dashboard)
 * - Session validation with getSession()
 * - Error handling for invalid credentials
 * 
 * Registration Flow:
 * - handleCredentialsSignUp() processes registration form
 * - Makes direct API call to /auth/register endpoint
 * - Success message with auto-reload for sign-in
 * - Form validation and error display
 * 
 * API INTEGRATION:
 * APIs Used:
 * 1. NextAuth Providers:
 *    - Google OAuth: signIn('google', { callbackUrl: '/dashboard' })
 *    - GitHub OAuth: signIn('github', { callbackUrl: '/dashboard' })
 *    - Credentials: signIn('credentials', { email, password, redirect: false })
 * 
 * 2. POST /auth/register
 *    Purpose: User registration with credentials
 *    Payload: { name, email, password, username }
 *    Response: { success: boolean, message?: string }
 *    Error Handling: Display registration errors to user
 * 
 * 3. NextAuth Session:
 *    - getSession() for role checking after sign-in
 *    - Role-based redirection logic
 *    - Session state management
 * 
 * STATE MANAGEMENT:
 * Authentication State:
 * - isLoading: boolean - Loading state for all auth operations
 * - error: string | null - Error messages for display
 * - success: string | null - Success messages for display
 * 
 * Form State:
 * - Form data managed through FormData API
 * - Input validation through HTML5 attributes
 * - Dynamic button states based on loading
 * 
 * ROUTING & REDIRECTION:
 * Role-Based Routing:
 * - Admin users: Redirect to /admin dashboard
 * - Regular users: Redirect to /dashboard
 * - OAuth success: Automatic redirect via callbackUrl
 * - Registration success: Auto-reload for sign-in
 * 
 * FORM VALIDATION:
 * Client-Side Validation:
 * - Required fields with HTML5 validation
 * - Email format validation (type="email")
 * - Password security (type="password")
 * - Username uniqueness (handled server-side)
 * 
 * Server-Side Validation:
 * - API endpoint validation for registration
 * - Duplicate email/username checking
 * - Password complexity requirements
 * - Error messages returned from API
 * 
 * VISUAL DESIGN:
 * Layout & Styling:
 * - Centered card layout with shadow effects
 * - Gradient background (blue-50 to purple-50)
 * - Frosted glass card (white/95 backdrop-blur-sm)
 * - Gradient brand title with color transitions
 * - Color-coded buttons and states
 * 
 * Interactive Elements:
 * - Hover effects on OAuth buttons
 * - Loading spinners with Loader2 icon
 * - Button state changes (disabled during loading)
 * - Smooth transitions (duration-200)
 * - Focus states for accessibility
 * 
 * RESPONSIVE DESIGN:
 * - Mobile-first responsive layout
 * - Full-width card on mobile (max-w-md)
 * - Proper spacing and padding
 * - Touch-friendly button sizes (h-12)
 * - Readable font sizes across devices
 * 
 * ERROR HANDLING:
 * OAuth Errors:
 * - Provider-specific error messages
 * - Network failure handling
 * - Fallback error messages
 * 
 * Credentials Errors:
 * - Invalid credential messages
 * - Server connection errors
 * - Form validation errors
 * 
 * Registration Errors:
 * - Duplicate email/username handling
 * - Server validation errors
 * - Network request failures
 * 
 * LOADING STATES:
 * Global Loading:
 * - isLoading state disables all interactive elements
 * - Spinner animations on active buttons
 * - Loading text updates ("Signing in...", "Creating account...")
 * 
 * Button States:
 * - Disabled state during any loading operation
 * - Visual feedback with spinner icons
 * - Text changes to indicate current action
 * 
 * SECURITY FEATURES:
 * - Password masking in input fields
 * - CSRF protection via NextAuth
 * - Secure OAuth flow implementation
 * - API endpoint protection
 * - Session management security
 * 
 * ACCESSIBILITY:
 * - Proper form labels and structure
 * - Keyboard navigation support
 * - Screen reader friendly alerts
 * - Focus management in forms
 * - High contrast error/success states
 * 
 * ENVIRONMENT CONFIGURATION:
 * - API_BASE_URL from environment variables
 * - Fallback to localhost for development
 * - OAuth provider configuration via NextAuth
 * 
 * USED BY:
 * - New users: Account registration and onboarding
 * - Existing users: Sign-in and authentication
 * - OAuth users: Social media authentication
 * - Administrators: Administrative access
 */

"use client"

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Github, 
  Chrome,
  Loader2 
} from 'lucide-react'

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const { register } = useAuth()

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await signIn(provider, {
        callbackUrl: '/dashboard'
      })
      
      if (result?.error) {
        setError(`Failed to sign in with ${provider}. Please try again.`)
      }
    } catch {
      setError(`An error occurred during ${provider} sign in.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.target as HTMLFormElement)
    
    try {
      const result = await signIn('credentials', {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials. Please try again.')
      } else if (result?.ok) {
        const session = await getSession()
        if (session?.user?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCredentialsSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.target as HTMLFormElement)

    try {
      const result = await register({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        dateOfBirth: formData.get('dateOfBirth') as string,
      });

      if (result.success) {
        setSuccess('Account created successfully! Redirecting...')
        setTimeout(() => {
          window.location.href = '/profile'
        }, 1500)
      } else {
        setError(result.message || 'Registration failed. Please try again.')
      }
    } catch {
      setError('An error occurred during registration. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Online Judge
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to access coding challenges and competitions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4 text-red-500" />
              )}
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-gray-200 hover:border-gray-800 hover:bg-gray-50 transition-all duration-200"
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Github className="mr-2 h-4 w-4 text-gray-800" />
              )}
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Credentials Form */}
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="signin" className="h-full">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="h-full">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="h-11"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleCredentialsSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-medium text-gray-700">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-username" className="text-sm font-medium text-gray-700">Username</Label>
                  <Input
                    id="signup-username"
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-dob" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                  <Input
                    id="signup-dob"
                    name="dateOfBirth"
                    type="date"
                    className="h-11"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
