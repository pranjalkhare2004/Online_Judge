'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Send, 
  Code2, 
  FileText, 
  Clock, 
  HardDrive, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Copy,
  RefreshCw,
  Terminal,
  Bug,
  Target,
  Activity,
  Timer,
  BarChart3,
  Maximize2,
  Minimize2,
  Split,
  RotateCcw
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import enhancedApiClient from '@/lib/enhanced-api-client'
import { cn } from '@/lib/utils'

// Types
interface Problem {
  _id: string
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  tags: string[]
  examples: Array<{
    input: string
    output: string
    explanation?: string
  }>
  constraints: string[]
  testCases: Array<{
    input: string
    expectedOutput: string
    hidden?: boolean
  }>
}

interface TestResult {
  input: string
  expectedOutput: string
  actualOutput: string
  passed: boolean
  executionTime: number
  memoryUsed: number
  error?: string
}

interface Submission {
  _id: string
  problemId: string
  code: string
  language: string
  status: 'Pending' | 'Running' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR'
  executionTime?: number
  memoryUsed?: number
  testResults?: TestResult[]
  submittedAt: string
  score?: number
}

// Language configurations
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', extension: 'js', template: `function solution() {
    // Write your solution here
    
}

// Test your function
console.log(solution());` },
  { value: 'python', label: 'Python', extension: 'py', template: `def solution():
    # Write your solution here
    pass

# Test your function
print(solution())` },
  { value: 'java', label: 'Java', extension: 'java', template: `public class Solution {
    public static void main(String[] args) {
        // Write your solution here
        
    }
}` },
  { value: 'cpp', label: 'C++', extension: 'cpp', template: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}` }
]

export default function CompilerPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const isAuthenticated = !!user
  
  // State management
  const [problem, setProblem] = useState<Problem | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [customInput, setCustomInput] = useState('')
  const [activeTab, setActiveTab] = useState('problem')
  
  // Execution state
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [customOutput, setCustomOutput] = useState('')
  const [executionStats, setExecutionStats] = useState<{
    totalTime: number
    totalMemory: number
    passedTests: number
    totalTests: number
  } | null>(null)
  
  // Submissions tracking
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [latestSubmissionId, setLatestSubmissionId] = useState<string | null>(null)
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [splitView, setSplitView] = useState(false)
  
  // Refs
  const codeEditorRef = useRef<HTMLTextAreaElement>(null)

  // Load problem data
  const loadProblem = useCallback(async () => {
    if (!params.slug) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await enhancedApiClient.getProblem(params.slug as string)
      
      if (response.success && response.data) {
        setProblem(response.data)
        console.log('✅ [COMPILER] Problem loaded:', response.data.title)
      } else {
        setError('Problem not found')
      }
    } catch (err) {
      console.error('❌ [COMPILER] Error loading problem:', err)
      setError('Failed to load problem')
    } finally {
      setLoading(false)
    }
  }, [params.slug])

  // Load user submissions
  const loadSubmissions = useCallback(async () => {
    if (!problem || !isAuthenticated) return
    
    try {
      setLoadingSubmissions(true)
      console.log('🔄 [COMPILER] Loading submissions for problem:', problem._id)
      
      const response = await enhancedApiClient.getUserSubmissions(1, 20, problem._id)
      
      if (response.success && response.data) {
        const submissionsList = response.data.submissions || []
        setSubmissions(submissionsList)
        console.log('✅ [COMPILER] Loaded submissions:', submissionsList.length)
      }
    } catch (err) {
      console.error('❌ [COMPILER] Error loading submissions:', err)
    } finally {
      setLoadingSubmissions(false)
    }
  }, [problem, isAuthenticated])

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage)
    const langConfig = LANGUAGES.find(l => l.value === newLanguage)
    if (langConfig) {
      setCode(langConfig.template)
    }
  }, [])

  // Run code with test cases
  const runCode = useCallback(async () => {
    if (!problem || !code.trim()) {
      toast({
        title: 'Error',
        description: 'Please write some code before running tests.',
        variant: 'destructive'
      })
      return
    }

    setRunning(true)
    setTestResults([])
    setExecutionStats(null)
    setActiveTab('results')

    try {
      console.log('🚀 [COMPILER] Running code tests...')
      
      // Send problemId to backend so it can fetch the correct test cases from database
      const response = await enhancedApiClient.executeCode(code, language, undefined, problem._id)
      
      if (response.success && response.data) {
        const results = response.data.results || []
        setTestResults(results)
        
        const stats = {
          totalTime: response.data.executionTime || 0,
          totalMemory: response.data.memoryUsed || 0,
          passedTests: results.filter(r => r.passed).length,
          totalTests: results.length
        }
        setExecutionStats(stats)
        
        console.log('✅ [COMPILER] Test execution completed:', stats)
        
        toast({
          title: 'Tests Completed',
          description: `${stats.passedTests}/${stats.totalTests} tests passed`
        })
      } else {
        throw new Error(response.message || 'Execution failed')
      }
    } catch (err: unknown) {
      console.error('❌ [COMPILER] Execution error:', err)
      toast({
        title: 'Execution Failed',
        description: err instanceof Error ? err.message : 'Failed to run code',
        variant: 'destructive'
      })
    } finally {
      setRunning(false)
    }
  }, [problem, code, language])

  // Run code with custom input
  const runCustomInput = useCallback(async () => {
    if (!code.trim()) {
      toast({
        title: 'Error',
        description: 'Please write some code before running.',
        variant: 'destructive'
      })
      return
    }

    setRunning(true)
    setCustomOutput('')
    setActiveTab('custom')

    try {
      console.log('🚀 [COMPILER] Running custom input...')
      
      const testCases = [{
        input: customInput,
        expectedOutput: '' // We don't know the expected output for custom input
      }]
      
      const response = await enhancedApiClient.executeCode(code, language, testCases)
      
      if (response.success && response.data) {
        const result = response.data.results?.[0]
        if (result) {
          setCustomOutput(result.actualOutput || '')
          console.log('✅ [COMPILER] Custom execution completed')
        }
      } else {
        setCustomOutput(`Error: ${response.message || 'Execution failed'}`)
      }
    } catch (err: unknown) {
      console.error('❌ [COMPILER] Custom execution error:', err)
      setCustomOutput(`Error: ${err instanceof Error ? err.message : 'Execution failed'}`)
    } finally {
      setRunning(false)
    }
  }, [code, language, customInput])

  // Submit solution
  const submitSolution = useCallback(async () => {
    if (!problem || !code.trim()) {
      toast({
        title: 'Error',
        description: 'Please write some code before submitting.',
        variant: 'destructive'
      })
      return
    }

    setSubmitting(true)

    try {
      console.log('📤 [COMPILER] Submitting solution...')
      
      const response = await enhancedApiClient.submitSolution(problem._id, code, language)
      
      if (response.success && response.data) {
        setLatestSubmissionId(response.data.submissionId)
        
        toast({
          title: 'Solution Submitted!',
          description: 'Your solution has been submitted for evaluation'
        })
        
        // Reload submissions and switch to submissions tab
        loadSubmissions()
        setActiveTab('submissions')
        
        console.log('✅ [COMPILER] Submission successful:', response.data.submissionId)
      } else {
        throw new Error(response.message || 'Submission failed')
      }
    } catch (err: unknown) {
      console.error('❌ [COMPILER] Submission error:', err)
      toast({
        title: 'Submission Failed',
        description: err instanceof Error ? err.message : 'Failed to submit solution',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }, [problem, code, language, loadSubmissions])

  // Utility functions
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code)
    toast({
      title: 'Code Copied',
      description: 'Code copied to clipboard'
    })
  }, [code])

  const resetCode = useCallback(() => {
    const langConfig = LANGUAGES.find(l => l.value === language)
    if (langConfig) {
      setCode(langConfig.template)
    }
  }, [language])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'text-green-600 bg-green-50 border-green-200'
      case 'WRONG_ANSWER': return 'text-red-600 bg-red-50 border-red-200'
      case 'TIME_LIMIT_EXCEEDED': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'MEMORY_LIMIT_EXCEEDED': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'COMPILATION_ERROR': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'RUNTIME_ERROR': return 'text-pink-600 bg-pink-50 border-pink-200'
      case 'Pending': case 'Running': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircle className="h-4 w-4" />
      case 'WRONG_ANSWER': return <XCircle className="h-4 w-4" />
      case 'TIME_LIMIT_EXCEEDED': return <Clock className="h-4 w-4" />
      case 'MEMORY_LIMIT_EXCEEDED': return <HardDrive className="h-4 w-4" />
      case 'COMPILATION_ERROR': return <AlertCircle className="h-4 w-4" />
      case 'RUNTIME_ERROR': return <Bug className="h-4 w-4" />
      case 'Pending': case 'Running': return <Loader2 className="h-4 w-4 animate-spin" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50 border-green-200'
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'Hard': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Effects
  useEffect(() => {
    loadProblem()
  }, [loadProblem])

  useEffect(() => {
    if (problem && isAuthenticated) {
      loadSubmissions()
    }
  }, [problem, isAuthenticated, loadSubmissions])

  useEffect(() => {
    // Initialize with default language template
    const langConfig = LANGUAGES.find(l => l.value === language)
    if (langConfig && !code) {
      setCode(langConfig.template)
    }
  }, [language, code])

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading compiler...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !problem) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Problem not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={cn(
      "container mx-auto px-4 py-6 max-w-7xl",
      isFullscreen && "fixed inset-0 z-50 bg-white overflow-hidden"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/problems')}
            className="flex items-center gap-2"
          >
            <Code2 className="h-4 w-4" />
            Back to Problems
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{problem.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getDifficultyColor(problem.difficulty)}>
                {problem.difficulty}
              </Badge>
              {problem.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSplitView(!splitView)}
            className="flex items-center gap-2"
          >
            <Split className="h-4 w-4" />
            {splitView ? 'Single View' : 'Split View'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "grid gap-6",
        splitView ? "grid-cols-2" : "grid-cols-1"
      )}>
        {/* Left Panel - Problem & Results */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="problem" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Problem
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Results
                {testResults.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {testResults.filter(r => r.passed).length}/{testResults.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Custom
              </TabsTrigger>
              <TabsTrigger value="submissions" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Submissions
                {submissions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {submissions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Problem Tab */}
            <TabsContent value="problem" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Problem Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">{problem.description}</p>
                  </div>
                  
                  {/* Examples */}
                  {problem.examples && problem.examples.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Examples</h3>
                      <div className="space-y-4">
                        {problem.examples.map((example, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Example {index + 1}:</h4>
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium text-sm">Input:</span>
                                <pre className="bg-white p-2 rounded border mt-1 text-sm">{example.input}</pre>
                              </div>
                              <div>
                                <span className="font-medium text-sm">Output:</span>
                                <pre className="bg-white p-2 rounded border mt-1 text-sm">{example.output}</pre>
                              </div>
                              {example.explanation && (
                                <div>
                                  <span className="font-medium text-sm">Explanation:</span>
                                  <p className="text-sm text-gray-600 mt-1">{example.explanation}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Constraints */}
                  {problem.constraints && problem.constraints.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Constraints</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {problem.constraints.map((constraint, index) => (
                          <li key={index} className="text-sm text-gray-700">{constraint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Test Results Tab */}
            <TabsContent value="results" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Test Results
                    </div>
                    {executionStats && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          {executionStats.totalTime.toFixed(1)}ms
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-4 w-4" />
                          {executionStats.totalMemory.toFixed(1)}MB
                        </div>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No test results yet</p>
                      <p className="text-sm">Run your code to see test results</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Overall Progress */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Overall Progress</span>
                          <span className="text-sm font-medium">
                            {executionStats?.passedTests}/{executionStats?.totalTests} passed
                          </span>
                        </div>
                        <Progress 
                          value={executionStats ? (executionStats.passedTests / executionStats.totalTests) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                      
                      {/* Individual Test Results */}
                      <div className="space-y-3">
                        {testResults.map((result, index) => (
                          <div key={index} className={cn(
                            "border rounded-lg p-4",
                            result.passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                          )}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {result.passed ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <span className="font-medium">Test Case {index + 1}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {result.executionTime.toFixed(1)}ms
                                </div>
                                <div className="flex items-center gap-1">
                                  <HardDrive className="h-3 w-3" />
                                  {result.memoryUsed.toFixed(1)}MB
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Input:</span>
                                <pre className="bg-white p-2 rounded border mt-1 text-xs overflow-x-auto">
                                  {result.input}
                                </pre>
                              </div>
                              <div>
                                <span className="font-medium">Expected:</span>
                                <pre className="bg-white p-2 rounded border mt-1 text-xs overflow-x-auto">
                                  {result.expectedOutput}
                                </pre>
                              </div>
                              <div>
                                <span className="font-medium">Your Output:</span>
                                <pre className={cn(
                                  "p-2 rounded border mt-1 text-xs overflow-x-auto",
                                  result.passed ? "bg-white" : "bg-red-50 border-red-200"
                                )}>
                                  {result.actualOutput}
                                </pre>
                              </div>
                            </div>
                            
                            {result.error && (
                              <div className="mt-3">
                                <span className="font-medium text-red-600">Error:</span>
                                <pre className="bg-red-50 border border-red-200 p-2 rounded mt-1 text-xs text-red-700">
                                  {result.error}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Custom Input Tab */}
            <TabsContent value="custom" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Custom Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Input:</label>
                    <Textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter your custom input here..."
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <Button
                    onClick={runCustomInput}
                    disabled={running || !isAuthenticated}
                    className="w-full"
                  >
                    {running ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run with Custom Input
                      </>
                    )}
                  </Button>
                  
                  {customOutput && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Output:</label>
                      <pre className="bg-gray-50 border p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
                        {customOutput}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Submission History
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadSubmissions}
                      disabled={loadingSubmissions}
                    >
                      {loadingSubmissions ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSubmissions ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Loading submissions...</p>
                    </div>
                  ) : submissions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No submissions yet</p>
                      <p className="text-sm">Submit your solution to see it here</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {submissions.map((submission, index) => (
                          <div
                            key={submission._id}
                            className={cn(
                              "border rounded-lg p-4 transition-colors",
                              submission._id === latestSubmissionId && "ring-2 ring-blue-500 ring-opacity-50"
                            )}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(submission.status)}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(submission.status)}
                                    {submission.status}
                                  </div>
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  #{submissions.length - index}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(submission.submittedAt).toLocaleString()}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <Code2 className="h-3 w-3" />
                                {submission.language}
                              </div>
                              {submission.executionTime && (
                                <div className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {submission.executionTime.toFixed(1)}ms
                                </div>
                              )}
                              {submission.memoryUsed && (
                                <div className="flex items-center gap-1">
                                  <HardDrive className="h-3 w-3" />
                                  {submission.memoryUsed.toFixed(1)}MB
                                </div>
                              )}
                              {submission.score !== undefined && (
                                <div className="flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3" />
                                  {submission.score}/100
                                </div>
                              )}
                            </div>
                            
                            {submission.testResults && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Test Results</span>
                                  <span className="text-sm">
                                    {submission.testResults.filter(t => t.passed).length}/{submission.testResults.length} passed
                                  </span>
                                </div>
                                <Progress 
                                  value={(submission.testResults.filter(t => t.passed).length / submission.testResults.length) * 100}
                                  className="h-2"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="space-y-4">
          {/* Language Selector and Tools */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Code Editor</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" onClick={copyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={resetCode}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Textarea
                ref={codeEditorRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`Write your ${language} solution here...`}
                className="min-h-[400px] font-mono text-sm border-0 resize-none focus:ring-0"
                style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={runCode}
                disabled={running || !isAuthenticated}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {running ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run Tests
              </Button>
              
              <Button
                onClick={submitSolution}
                disabled={submitting || !isAuthenticated}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit Solution
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomInput(!showCustomInput)
                if (!showCustomInput) {
                  setActiveTab('custom')
                }
              }}
              className="flex items-center gap-2"
            >
              <Terminal className="h-4 w-4" />
              {showCustomInput ? 'Hide' : 'Show'} Custom Input
            </Button>
          </div>

          {/* Authentication Warning */}
          {!isAuthenticated && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please <a href="/auth" className="text-blue-600 hover:underline">log in</a> to run code and submit solutions.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
