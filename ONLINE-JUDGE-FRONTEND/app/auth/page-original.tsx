"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Github, Mail } from "lucide-react"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, register, user } = useAuth()
  const { toast } = useToast()

  const [mode, setMode] = useState<"login" | "register">("login")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const modeParam = searchParams.get("mode")
    if (modeParam === "register") {
      setMode("register")
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    // Calculate password strength
    const password = formData.password
    let strength = 0

    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25

    setPasswordStrength(strength)
  }, [formData.password])

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (name) {
      case 'name':
        newErrors.name = value.trim().length < 2 ? 'Name must be at least 2 characters long' : ''
        break
      case 'username':
        if (value.length < 3) {
          newErrors.username = 'Username must be at least 3 characters long'
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          newErrors.username = 'Username can only contain letters, numbers, and underscores'
        } else {
          newErrors.username = ''
        }
        break
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        newErrors.email = !emailRegex.test(value) ? 'Please enter a valid email address' : ''
        break
      case 'password':
        if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long'
        } else {
          newErrors.password = ''
        }
        break
      case 'confirmPassword':
        newErrors.confirmPassword = value !== formData.password ? 'Passwords do not match' : ''
        break
      default:
        break
    }
    
    setErrors(newErrors)
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear previous errors
    if (errors[name as keyof typeof errors]) {
      validateField(name, value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "register") {
        // Validation for register mode
        if (!formData.name.trim()) {
          toast({
            title: "Error",
            description: "Please enter your full name.",
            variant: "destructive",
          })
          return
        }

        if (!formData.username.trim()) {
          toast({
            title: "Error",
            description: "Please enter a username.",
            variant: "destructive",
          })
          return
        }

        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords don't match.",
            variant: "destructive",
          })
          return
        }

        if (passwordStrength < 50) {
          toast({
            title: "Weak Password",
            description: "Please choose a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.",
            variant: "destructive",
          })
          return
        }

        await register(formData.name, formData.email, formData.password, formData.username)
        toast({
          title: "Success!",
          description: "Account created successfully. Welcome to Online Judge!",
        })
      } else {
        // Validation for login mode
        if (!formData.email.trim()) {
          toast({
            title: "Error",
            description: "Please enter your email address.",
            variant: "destructive",
          })
          return
        }

        if (!formData.password.trim()) {
          toast({
            title: "Error",
            description: "Please enter your password.",
            variant: "destructive",
          })
          return
        }

        await login(formData.email, formData.password)
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        })
      }

      // Clear form data after successful submission
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      })

      router.push("/dashboard")
    } catch (error: unknown) {
      console.error('Auth error:', error)
      
      let errorMessage = "An unexpected error occurred."
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } }
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      } else if (mode === "register") {
        errorMessage = "Failed to create account. Please try again."
      } else {
        errorMessage = "Invalid email or password. Please try again."
      }

      toast({
        title: mode === "register" ? "Registration Failed" : "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "bg-red-500"
    if (passwordStrength < 50) return "bg-yellow-500"
    if (passwordStrength < 75) return "bg-blue-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return "Weak"
    if (passwordStrength < 50) return "Fair"
    if (passwordStrength < 75) return "Good"
    return "Strong"
  }

  const handleSocialLogin = (provider: 'github' | 'google') => {
    toast({
      title: "Coming Soon",
      description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} login will be available soon!`,
    })
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setFormData({
      name: "",
      username: "",
      email: "demo@example.com",
      password: "DemoPassword123!",
      confirmPassword: "",
    })

    try {
      await login("demo@example.com", "DemoPassword123!")
      toast({
        title: "Demo Login Successful!",
        description: "You're now logged in with the demo account.",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error('Demo login failed:', error)
      toast({
        title: "Demo Account Unavailable",
        description: "Demo account is not available. Please create a new account.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    const newMode = mode === "register" ? "login" : "register"
    setMode(newMode)
    
    // Clear form data and errors when switching modes
    setFormData({
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
    
    setErrors({
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
    
    setPasswordStrength(0)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container flex items-center justify-center py-16">
        <Card className="w-full max-w-md animate-fade-in-up">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{mode === "register" ? "Create Account" : "Sign In"}</CardTitle>
            <CardDescription>
              {mode === "register" ? "Join CodeJudge and start solving problems" : "Welcome back to CodeJudge"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Social Login */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full transition-transform duration-150 hover:scale-105 bg-transparent"
                onClick={() => handleSocialLogin('github')}
              >
                <Github className="mr-2 h-4 w-4" />
                Continue with GitHub
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full transition-transform duration-150 hover:scale-105 bg-transparent"
                onClick={() => handleSocialLogin('google')}
              >
                <Mail className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
              
              {mode === "login" && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full transition-transform duration-150 hover:scale-105 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  onClick={handleDemoLogin}
                  disabled={loading}
                >
                  <div className="mr-2 h-4 w-4 rounded-full bg-blue-500"></div>
                  Try Demo Account
                </Button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onBlur={(e) => validateField('name', e.target.value)}
                    required
                    className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                      errors.name ? 'border-red-500 focus:ring-red-200' : ''
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                </div>
              )}

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    onBlur={(e) => validateField('username', e.target.value)}
                    required
                    className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                      errors.username ? 'border-red-500 focus:ring-red-200' : ''
                    }`}
                  />
                  {errors.username && <p className="text-xs text-red-600">{errors.username}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={(e) => validateField('email', e.target.value)}
                  required
                  className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                    errors.email ? 'border-red-500 focus:ring-red-200' : ''
                  }`}
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onBlur={(e) => validateField('password', e.target.value)}
                    required
                    className={`pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                      errors.password ? 'border-red-500 focus:ring-red-200' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}

                {mode === "register" && formData.password && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Password strength</span>
                      <span className={`font-medium ${passwordStrength < 50 ? "text-red-600" : "text-green-600"}`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    onBlur={(e) => validateField('confirmPassword', e.target.value)}
                    required
                    className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                      errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : ''
                    }`}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
                </div>
              )}

              <Button
                type="submit"
                className="w-full transition-transform duration-150 hover:scale-105"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {mode === "register" ? "Creating Account..." : "Signing In..."}
                  </div>
                ) : mode === "register" ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {mode === "register" ? "Already have an account?" : "Don't have an account?"}
              </span>{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={switchMode}
              >
                {mode === "register" ? "Sign in" : "Sign up"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
