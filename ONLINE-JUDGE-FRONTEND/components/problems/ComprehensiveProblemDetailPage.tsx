'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Send, 
  ChevronLeft, 
  Clock, 
  MemoryStick, 
  CheckCircle2, 
  CheckCircle,
  XCircle, 
  AlertCircle,
  Code2,
  History,
  Terminal,
  FileCode,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Editor } from '@monaco-editor/react';
import { apiUtils, compilerAPI } from '@/lib/api';

// Type definitions
interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
}

interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

interface CodeExecutionResult {
  success: boolean;
  data?: {
    results: Array<{
      input: string;
      expectedOutput: string;
      actualOutput: string;
      passed: boolean;
      executionTime: number;
      memoryUsed: number;
      error?: string;
    }>;
    totalTests: number;
    passedTests: number;
    executionTime: number;
    memoryUsed: number;
    overallResult: string;
    compilationError?: string;
  };
  message?: string;
}

interface Submission {
  _id: string;
  language: string;
  status: 'ACCEPTED' | 'REJECTED' | 'PENDING' | 'Pending' | 'Completed';
  executionTime?: number;
  memoryUsed?: number;
  createdAt: string;
  code: string;
  problemId?: {
    _id: string;
    title: string;
    difficulty: string;
  } | string;
  testResults?: Array<{
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
  }>;
}

const ComprehensiveProblemDetailPage: React.FC = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  // State management
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Code editor state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  
  // Manual testing state
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('code');

  // Available programming languages with templates
  const languages = useMemo(() => [
    { 
      value: 'python', 
      label: 'Python', 
      template: `def solution(n):
    # Write your solution here
    # For Fibonacci: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)
    if n <= 1:
        return n
    return solution(n-1) + solution(n-2)

# Read input
n = int(input())
# Call your solution
result = solution(n)
# Print output
print(result)`
    },
    { 
      value: 'javascript', 
      label: 'JavaScript', 
      template: `function solution(n) {
    // Write your solution here
    // For Fibonacci: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)
    if (n <= 1) return n;
    return solution(n-1) + solution(n-2);
}

// Read input (for Node.js environment)
const input = require('fs').readFileSync(0, 'utf8').trim();
const n = parseInt(input);
const result = solution(n);
console.log(result);`
    },
    { 
      value: 'cpp', 
      label: 'C++', 
      template: `#include <iostream>
using namespace std;

int solution(int n) {
    // Write your solution here
    // For Fibonacci: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)
    if (n <= 1) return n;
    return solution(n-1) + solution(n-2);
}

int main() {
    int n;
    cin >> n;
    int result = solution(n);
    cout << result << endl;
    return 0;
}`
    },
    { 
      value: 'java', 
      label: 'Java', 
      template: `import java.util.*;

public class Solution {
    public static int solution(int n) {
        // Write your solution here
        // For Fibonacci: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)
        if (n <= 1) return n;
        return solution(n-1) + solution(n-2);
    }
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int result = solution(n);
        System.out.println(result);
        sc.close();
    }
}`
    }
  ], []);

  // Load problem data
  const loadProblem = useCallback(async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/problems/${slug}`);
      
      if (!response.ok) {
        throw new Error('Problem not found');
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        setProblem(result.data);
      } else {
        throw new Error('Problem not found');
      }
    } catch (error) {
      console.error('Failed to fetch problem:', error);
      toast({
        title: 'Error',
        description: 'Failed to load problem. Please try again.',
        variant: 'destructive'
      });
      router.push('/problems');
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  // Initialize code template when problem loads
  useEffect(() => {
    if (problem && !code) {
      const defaultLang = languages.find(l => l.value === language);
      if (defaultLang) {
        setCode(defaultLang.template);
      }
    }
  }, [problem, language, languages, code]);

  // Load user submissions
  const loadSubmissions = useCallback(async () => {
    if (!isAuthenticated || !problem) return;
    
    try {
      setLoadingSubmissions(true);
      const token = apiUtils.getAccessToken();
      const response = await fetch('http://localhost:5000/api/user/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.submissions) {
          // Filter submissions for this problem
          const problemSubmissions = result.data.submissions.filter(
            (sub: Submission) => {
              // Handle both object and string formats for problemId
              const submissionProblemId = typeof sub.problemId === 'object' 
                ? sub.problemId?._id 
                : sub.problemId;
              return submissionProblemId === problem._id;
            }
          );
          setSubmissions(problemSubmissions);
        }
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [isAuthenticated, problem]);

  // Run code with test cases
  const runCode = useCallback(async () => {
    if (!problem || !code.trim()) {
      toast({
        title: 'Error',
        description: 'Please write some code before running.',
        variant: 'destructive'
      });
      return;
    }

    setRunning(true);
    setExecutionResult(null);

    try {
      const token = apiUtils.getAccessToken();
      const testCases = problem.examples.map(example => ({
        input: example.input,
        expectedOutput: example.output
      }));

      const response = await fetch('http://localhost:5000/api/compiler/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          language,
          problemId: problem._id,
          testCases
        })
      });

      const result = await response.json();
      setExecutionResult(result);
      
      if (result.success) {
        toast({
          title: 'Code Executed',
          description: `${result.data.passedTests}/${result.data.totalTests} test cases passed`,
          variant: result.data.passedTests === result.data.totalTests ? 'default' : 'destructive'
        });
      } else {
        toast({
          title: 'Execution Failed',
          description: result.message || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error running code:', error);
      toast({
        title: 'Error',
        description: 'Failed to run code. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setRunning(false);
    }
  }, [problem, code, language]);

  // Run code with custom input
  const runCustomInput = useCallback(async () => {
    if (!code.trim()) {
      toast({
        title: 'Error',
        description: 'Please write some code before running.',
        variant: 'destructive'
      });
      return;
    }

    setRunning(true);
    setCustomOutput('');

    try {
      const token = apiUtils.getAccessToken();
      const response = await fetch('http://localhost:5000/api/compiler/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          language,
          testCases: [{
            input: customInput,
            expectedOutput: '' // No expected output for custom run
          }]
        })
      });

      const result = await response.json();
      
      if (result.success && result.data.results[0]) {
        setCustomOutput(result.data.results[0].actualOutput || '');
      } else {
        setCustomOutput(`Error: ${result.message || 'Execution failed'}`);
      }
    } catch (error) {
      console.error('Error running custom input:', error);
      setCustomOutput('Error: Failed to execute code');
    } finally {
      setRunning(false);
    }
  }, [code, language, customInput]);

  // Submit solution
  const submitSolution = useCallback(async () => {
    if (!problem || !code.trim()) {
      toast({
        title: 'Error',
        description: 'Please write some code before submitting.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    try {
      // Use the compiler API for submitting problems
      const result = await compilerAPI.runProblem({
        code,
        language,
        problemId: problem._id
      });
      
      if (result.success) {
        toast({
          title: 'Solution Submitted!',
          description: result.data?.message || 'Your solution has been submitted for evaluation',
          variant: 'default'
        });
        // Reload submissions
        loadSubmissions();
        // Switch to submissions tab
        setActiveTab('submissions');
      } else {
        toast({
          title: 'Submission Failed',
          description: result.message || 'Failed to submit solution',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error submitting solution:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit solution. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }, [problem, code, language, loadSubmissions]);

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
    const langTemplate = languages.find(l => l.value === newLanguage);
    if (langTemplate) {
      setCode(langTemplate.template);
    }
  }, [languages]);

  // Load data on component mount
  useEffect(() => {
    loadProblem();
  }, [loadProblem]);

  useEffect(() => {
    if (problem && isAuthenticated) {
      loadSubmissions();
    }
  }, [problem, isAuthenticated, loadSubmissions]);

  // Render difficulty badge
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Problem Not Found</h1>
            <p className="text-gray-600 mb-4">The problem you&apos;re looking for doesn&apos;t exist.</p>
            <Button onClick={() => router.push('/problems')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Problems
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/problems')}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Problems
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(problem.difficulty)}>
                  {problem.difficulty}
                </Badge>
                <h1 className="text-xl font-semibold">{problem.title}</h1>
              </div>
            </div>
            
            {problem.acceptanceRate !== undefined && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>{problem.acceptanceRate}% Acceptance</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{problem.totalSubmissions} Submissions</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Problem Description */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Problem Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ 
                    __html: problem.description.replace(/\n/g, '<br/>') 
                  }}
                />
              </CardContent>
            </Card>

            {/* Examples */}
            {problem.examples && problem.examples.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Examples</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {problem.examples.map((example, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Input:</Label>
                          <div className="mt-1 p-2 bg-white rounded border font-mono text-sm">
                            {example.input}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Output:</Label>
                          <div className="mt-1 p-2 bg-white rounded border font-mono text-sm">
                            {example.output}
                          </div>
                        </div>
                        {example.explanation && (
                          <div>
                            <Label className="text-sm font-medium">Explanation:</Label>
                            <p className="mt-1 text-sm text-gray-600">{example.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Constraints and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {problem.constraints && problem.constraints.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Constraints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {problem.constraints.map((constraint, index) => (
                        <li key={index} className="text-gray-700"
                            dangerouslySetInnerHTML={{ __html: constraint }} />
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tags & Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {problem.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>Time Limit: {problem.timeLimit}ms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MemoryStick className="h-3 w-3" />
                      <span>Memory Limit: {problem.memoryLimit}MB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Side - Code Editor and Tabs */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Code Editor</CardTitle>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="code" className="flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="results" className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      Results
                    </TabsTrigger>
                    <TabsTrigger value="submissions" className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Submissions
                    </TabsTrigger>
                  </TabsList>

                  {/* Code Tab */}
                  <TabsContent value="code" className="space-y-4 mt-4">
                    <div className="border rounded-lg">
                      <Editor
                        height="400px"
                        language={language === 'cpp' ? 'cpp' : language}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        theme="vs-light"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: 'on'
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={runCode}
                        disabled={running || !isAuthenticated}
                        className="flex items-center gap-2"
                      >
                        {running ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Run
                      </Button>
                      <Button 
                        onClick={submitSolution}
                        disabled={submitting || !isAuthenticated}
                        variant="default"
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Submit
                      </Button>
                    </div>

                    {!isAuthenticated && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-700">
                          Please <Link href="/auth" className="text-blue-600 hover:underline font-medium">log in</Link> to run code and submit solutions.
                        </p>
                      </div>
                    )}

                    {/* Custom Input/Output */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Test with Custom Input</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Input</Label>
                            <Textarea
                              value={customInput}
                              onChange={(e) => setCustomInput(e.target.value)}
                              placeholder="Enter your test input..."
                              className="mt-1 font-mono text-sm"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Output</Label>
                            <Textarea
                              value={customOutput}
                              readOnly
                              placeholder="Output will appear here..."
                              className="mt-1 font-mono text-sm bg-gray-50"
                              rows={3}
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={runCustomInput}
                          disabled={running || !isAuthenticated}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          {running ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          Run with Custom Input
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Results Tab */}
                  <TabsContent value="results" className="mt-4">
                    {executionResult ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {executionResult.success && executionResult.data?.overallResult === 'ACCEPTED' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            Test Results
                            {executionResult.data && (
                              <Badge 
                                variant={executionResult.data.overallResult === 'ACCEPTED' ? "default" : "destructive"}
                                className="ml-2"
                              >
                                {executionResult.data.passedTests} / {executionResult.data.totalTests} Passed
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {executionResult.data?.compilationError ? (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-800">Compilation Error</span>
                              </div>
                              <pre className="text-sm text-red-700 font-mono whitespace-pre-wrap">
                                {executionResult.data.compilationError}
                              </pre>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Performance Summary */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">Execution Time</span>
                                  </div>
                                  <span className="text-lg font-bold text-blue-800">
                                    {executionResult.data?.executionTime || 0}ms
                                  </span>
                                </div>
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <MemoryStick className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium">Memory Usage</span>
                                  </div>
                                  <span className="text-lg font-bold text-purple-800">
                                    {((executionResult.data?.memoryUsed || 0) / 1024).toFixed(1)}KB
                                  </span>
                                </div>
                              </div>

                              {/* Test Case Results */}
                              <div className="space-y-3">
                                {executionResult.data?.results.map((result, index) => (
                                  <div key={index} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        {result.passed ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                        <span className="font-medium text-sm">Test Case {index + 1}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={result.passed ? "default" : "destructive"} className="text-xs">
                                          {result.passed ? "Passed" : "Failed"}
                                        </Badge>
                                        <span className="text-xs text-gray-500">{result.executionTime}ms</span>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                      <div>
                                        <Label className="text-xs font-medium text-gray-600">Input</Label>
                                        <div className="mt-1 p-2 bg-gray-50 rounded border font-mono text-xs">
                                          {result.input}
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-xs font-medium text-gray-600">Expected</Label>
                                        <div className="mt-1 p-2 bg-gray-50 rounded border font-mono text-xs">
                                          {result.expectedOutput}
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-xs font-medium text-gray-600">Your Output</Label>
                                        <div className={`mt-1 p-2 rounded border font-mono text-xs ${
                                          result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                        }`}>
                                          {result.actualOutput}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Run your code to see results here</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Submissions Tab */}
                  <TabsContent value="submissions" className="mt-4">
                    {isAuthenticated ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Previous Submissions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingSubmissions ? (
                            <div className="space-y-3">
                              {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                              ))}
                            </div>
                          ) : submissions.length > 0 ? (
                            <ScrollArea className="max-h-96">
                              <div className="space-y-3">
                                {submissions.map((submission) => (
                                  <div key={submission._id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-3">
                                        {submission.status === 'ACCEPTED' ? (
                                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        ) : submission.status === 'REJECTED' ? (
                                          <XCircle className="h-5 w-5 text-red-600" />
                                        ) : (
                                          <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                                        )}
                                        <div>
                                          <Badge 
                                            variant={
                                              submission.status === 'ACCEPTED' ? 'default' : 
                                              submission.status === 'REJECTED' ? 'destructive' : 'secondary'
                                            }
                                            className="text-xs"
                                          >
                                            {submission.status}
                                          </Badge>
                                          <p className="text-sm text-gray-600 mt-1">
                                            {submission.language} • {formatDate(submission.createdAt)}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right text-sm text-gray-600">
                                        {submission.executionTime && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{submission.executionTime}ms</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Show code preview */}
                                    <details className="mt-3">
                                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                                        📄 View Submitted Code
                                      </summary>
                                      <div className="mt-2 p-4 bg-gray-900 rounded-lg border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs text-gray-400 uppercase tracking-wide">
                                            {submission.language}
                                          </span>
                                          <button 
                                            onClick={() => navigator.clipboard.writeText(submission.code)}
                                            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                                          >
                                            📋 Copy
                                          </button>
                                        </div>
                                        <pre className="text-sm font-mono text-gray-100 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                                          {submission.code}
                                        </pre>
                                      </div>
                                    </details>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No submissions yet</p>
                              <p className="text-sm">Submit your solution to see it here</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center py-12">
                        <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
                          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                          <p className="text-amber-700 mb-4">
                            Please log in to view your submission history
                          </p>
                          <Button asChild>
                            <Link href="/auth">Log In</Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Missing Users icon import
const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export default ComprehensiveProblemDetailPage;
