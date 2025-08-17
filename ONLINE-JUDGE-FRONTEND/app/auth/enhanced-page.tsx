"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Github, Mail, User, Lock, Shield, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function EnhancedAuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, register, user } = useAuth()
  const { toast } = useToast()

  const [mode, setMode] = useState<"login" | "register">("login")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  })

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
    general: ""
  })

  const [focusedField, setFocusedField] = useState("")

  useEffect(() => {
    const modeParam = searchParams.get("mode")
    if (modeParam === "register") {
      setMode("register")
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  // Password strength validation
  useEffect(() => {
    if (mode === "register") {
      const { password } = formData
      const criteria = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      }
      
      setPasswordCriteria(criteria)
      
      const strength = Object.values(criteria).filter(Boolean).length
      setPasswordStrength((strength / 5) * 100)
    }
  }, [formData.password, mode, formData])

  const validateField = (name: string, value: string) => {
    let error = ""
    
    switch (name) {
      case "name":
        if (!value.trim()) error = "Name is required"
        else if (value.trim().length < 2) error = "Name must be at least 2 characters"
        break
      case "username":
        if (value && !/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
          error = "Username must be 3-20 characters, alphanumeric and underscores only"
        }
        break
      case "email":
        if (!value) error = "Email is required"
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email format"
        break
      case "password":
        if (!value) error = "Password is required"
        else if (value.length < 8) error = "Password must be at least 8 characters"
        break
      case "confirmPassword":
        if (mode === "register") {
          if (!value) error = "Please confirm your password"
          else if (value !== formData.password) error = "Passwords do not match"
        }
        break
    }
    
    return error
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Real-time validation
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error, general: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({ name: "", username: "", email: "", password: "", confirmPassword: "", general: "" })

    // Validate all fields
    const newErrors: typeof errors = { name: "", username: "", email: "", password: "", confirmPassword: "", general: "" }
    
    if (mode === "register") {
      newErrors.name = validateField("name", formData.name)
      newErrors.username = validateField("username", formData.username)
      newErrors.confirmPassword = validateField("confirmPassword", formData.confirmPassword)
    }
    newErrors.email = validateField("email", formData.email)
    newErrors.password = validateField("password", formData.password)

    const hasErrors = Object.values(newErrors).some(error => error !== "")
    if (hasErrors) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      if (mode === "login") {
        const response = await login({
          email: formData.email,
          password: formData.password,
        })
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${response.data.user.name}!`,
          variant: "default",
        })
        router.push("/dashboard")
      } else {
        const response = await register({
          name: formData.name,
          username: formData.username || undefined,
          email: formData.email,
          password: formData.password,
        })
        
        toast({
          title: "Registration Successful",
          description: `Welcome to Online Judge, ${response.data.user.name}!`,
          variant: "default",
        })
        router.push("/dashboard")
      }
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string }
      console.error('Auth error:', error)
      const errorMessage = apiError.response?.data?.message || apiError.message || `${mode} failed`
      
      setErrors(prev => ({ ...prev, general: errorMessage }))
      
      toast({
        title: `${mode === "login" ? "Login" : "Registration"} Failed`,
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500"
    if (passwordStrength < 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return "Weak"
    if (passwordStrength < 70) return "Medium"
    return "Strong"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <Shield className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Online Judge Platform
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <Card className="mt-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center space-x-2">
              <Badge variant={mode === "login" ? "default" : "secondary"}>
                {mode === "login" ? "Sign In" : "Sign Up"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={mode} onValueChange={(value: "login" | "register") => setMode(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="text-sm">Sign Up</TabsTrigger>
              </TabsList>
              
              {errors.general && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{errors.general}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <TabsContent value="login" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField("")}
                      className={`transition-all duration-200 ${
                        errors.email 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                          : focusedField === "email" 
                            ? "border-indigo-300 focus:border-indigo-500 focus:ring-indigo-200"
                            : "border-gray-300"
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField("")}
                        className={`pr-10 transition-all duration-200 ${
                          errors.password 
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                            : focusedField === "password" 
                              ? "border-indigo-300 focus:border-indigo-500 focus:ring-indigo-200"
                              : "border-gray-300"
                        }`}
                        placeholder="Enter your password"
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
                    {errors.password && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {errors.password}
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField("")}
                      className={`transition-all duration-200 ${
                        errors.name 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                          : focusedField === "name" 
                            ? "border-indigo-300 focus:border-indigo-500 focus:ring-indigo-200"
                            : "border-gray-300"
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username <span className="text-xs text-gray-500">(optional)</span>
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => setFocusedField("")}
                      className={`transition-all duration-200 ${
                        errors.username 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                          : focusedField === "username" 
                            ? "border-indigo-300 focus:border-indigo-500 focus:ring-indigo-200"
                            : "border-gray-300"
                      }`}
                      placeholder="Choose a username"
                    />
                    {errors.username && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {errors.username}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField("")}
                      className={`transition-all duration-200 ${
                        errors.email 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                          : focusedField === "email" 
                            ? "border-indigo-300 focus:border-indigo-500 focus:ring-indigo-200"
                            : "border-gray-300"
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField("")}
                        className={`pr-10 transition-all duration-200 ${
                          errors.password 
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                            : focusedField === "password" 
                              ? "border-indigo-300 focus:border-indigo-500 focus:ring-indigo-200"
                              : "border-gray-300"
                        }`}
                        placeholder="Create a strong password"
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
                    {errors.password && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {errors.password}
                      </p>
                    )}
                    
                    {formData.password && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Password Strength:</span>
                          <span className={`text-xs font-medium ${
                            passwordStrength < 40 ? 'text-red-600' : 
                            passwordStrength < 70 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <Progress 
                          value={passwordStrength} 
                          className={`h-2 ${getPasswordStrengthColor()}`}
                        />
                        
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            {passwordCriteria.length ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-gray-400" />}
                            <span className={passwordCriteria.length ? 'text-green-600' : 'text-gray-500'}>At least 8 characters</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordCriteria.lowercase ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-gray-400" />}
                            <span className={passwordCriteria.lowercase ? 'text-green-600' : 'text-gray-500'}>Lowercase letter</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordCriteria.uppercase ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-gray-400" />}
                            <span className={passwordCriteria.uppercase ? 'text-green-600' : 'text-gray-500'}>Uppercase letter</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordCriteria.number ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-gray-400" />}
                            <span className={passwordCriteria.number ? 'text-green-600' : 'text-gray-500'}>Number</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordCriteria.special ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-gray-400" />}
                            <span className={passwordCriteria.special ? 'text-green-600' : 'text-gray-500'}>Special character</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => setFocusedField("")}
                        className={`pr-10 transition-all duration-200 ${
                          errors.confirmPassword 
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                            : focusedField === "confirmPassword" 
                              ? "border-indigo-300 focus:border-indigo-500 focus:ring-indigo-200"
                              : "border-gray-300"
                        }`}
                        placeholder="Confirm your password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {errors.confirmPassword}
                      </p>
                    )}
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Passwords match
                      </p>
                    )}
                  </div>
                </TabsContent>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors duration-200 font-medium"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </div>
                  ) : (
                    mode === "login" ? "Sign In" : "Create Account"
                  )}
                </Button>
              </form>
            </Tabs>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  onClick={() => {
                    toast({
                      title: "OAuth Integration",
                      description: "OAuth sign-in will be implemented soon!",
                      variant: "default",
                    })
                  }}
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </Button>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  onClick={() => {
                    toast({
                      title: "OAuth Integration",
                      description: "OAuth sign-in will be implemented soon!",
                      variant: "default",
                    })
                  }}
                >
                  <Mail className="h-4 w-4" />
                  Google
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <Button
              variant="link"
              className="p-0 h-auto font-medium text-indigo-600 hover:text-indigo-500"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
