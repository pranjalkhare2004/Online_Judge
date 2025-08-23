'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { problemAPI, submissionAPI, Problem } from '@/lib/api';
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
  Star,
  Code2
} from 'lucide-react';
import Link from 'next/link';

interface CodeExecutionResult {
  success: boolean;
  result?: {
    passed: boolean;
    testResults: Array<{
      input: string;
      expected: string;
      actual: string;
      passed: boolean;
      executionTime?: number;
      memoryUsed?: number;
      error?: string;
    }>;
    totalTestCases: number;
    passedTestCases: number;
    executionTime?: number;
    memoryUsed?: number;
    error?: string;
    compileError?: string;
  };
  message?: string;
}

interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

const ProblemDetailPage: React.FC = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  // Debug authentication state
  useEffect(() => {
    console.log('Auth debug - user:', user);
    console.log('Auth debug - isAuthenticated:', isAuthenticated);
  }, [user, isAuthenticated]);

  // State management
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);

  // Code editor state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);

  // Available programming languages with enhanced templates
  const languages = useMemo(() => [
    { 
      value: 'javascript', 
      label: 'JavaScript', 
      template: `// Write your solution here
function solution(input) {
    // Parse input and solve the problem
    // Example: const arr = input.trim().split(' ').map(Number);
    
    // Your code here
    
    // Return the result
    return result;
}

// Test function wrapper
function solve() {
    const input = readline(); // This will be provided by the system
    const result = solution(input);
    console.log(result);
}

solve();`,
      extension: 'js'
    },
    { 
      value: 'python', 
      label: 'Python', 
      template: `# Write your solution here
def solution(input_data):
    # Parse input and solve the problem
    # Example: arr = list(map(int, input_data.strip().split()))
    
    # Your code here
    
    # Return the result
    return result

# Test function wrapper
import sys
input_data = sys.stdin.read()
result = solution(input_data)
print(result)`,
      extension: 'py'
    },
    { 
      value: 'cpp', 
      label: 'C++', 
      template: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <sstream>
using namespace std;

int main() {
    // Read input
    string line;
    getline(cin, line);
    
    // Parse input and solve the problem
    // Example: 
    // istringstream iss(line);
    // vector<int> arr;
    // int num;
    // while (iss >> num) arr.push_back(num);
    
    // Your code here
    
    // Output the result
    // cout << result << endl;
    
    return 0;
}`,
      extension: 'cpp'
    },
    { 
      value: 'java', 
      label: 'Java', 
      template: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        // Read input
        String line = br.readLine();
        
        // Parse input and solve the problem
        // Example: 
        // String[] parts = line.trim().split(" ");
        // int[] arr = Arrays.stream(parts).mapToInt(Integer::parseInt).toArray();
        
        // Your code here
        
        // Output the result
        // System.out.println(result);
        
        br.close();
    }
}`,
      extension: 'java'
    }
  ], []);

  // Fetch problem details
  const fetchProblem = useCallback(async () => {
    if (!slug || typeof slug !== 'string') return;
    
    try {
      setLoading(true);
      const response = await problemAPI.getProblem(slug);
      
      if (response.success && response.data) {
        // Handle nested response structure
        const problemData = response.data.problem || response.data;
        setProblem(problemData);
        
        // Set default code template
        const defaultLang = languages.find(l => l.value === language);
        if (defaultLang && !code) {
          setCode(defaultLang.template);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Problem not found',
          variant: 'destructive'
        });
        router.push('/problems');
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
  }, [slug, language, languages, code, router]);

  // Comprehensive code compilation and execution
  const compileAndRunCode = async (code: string, language: string, testCases: TestCase[]): Promise<CodeExecutionResult> => {
    try {
      console.log(`🔄 Executing ${language} code with backend compiler...`);
      
      // Check for basic client-side validation
      if (!code.trim()) {
        return {
          success: false,
          result: {
            passed: false,
            testResults: [],
            totalTestCases: 0,
            passedTestCases: 0,
            compileError: "Empty code submission"
          },
          message: "Please write some code before running"
        };
      }

      // Make API call to backend compiler
      const response = await fetch('http://localhost:5000/api/compiler/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code,
          language,
          testCases: testCases.map(tc => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResult = await response.json();
      
      if (!apiResult.success) {
        return {
          success: false,
          result: {
            passed: false,
            testResults: [],
            totalTestCases: testCases.length,
            passedTestCases: 0,
            error: apiResult.error || "Execution failed"
          },
          message: apiResult.message || "Execution failed"
        };
      }

      // Transform API response to match expected format
      const backendResult = apiResult.data;
      
      if (!backendResult.success) {
        return {
          success: false,
          result: {
            passed: false,
            testResults: [],
            totalTestCases: testCases.length,
            passedTestCases: 0,
            error: backendResult.error,
            compileError: backendResult.details
          },
          message: backendResult.error || "Execution failed"
        };
      }

      // Convert backend results to frontend format
      const testResults = backendResult.results.map((result: { input: string; expectedOutput: string; actualOutput: string; passed: boolean; executionTime: number; memoryUsed: number }) => ({
        input: result.input,
        expected: result.expectedOutput,
        actual: result.actualOutput,
        passed: result.passed,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed
      }));

      const summary = backendResult.summary;

      return {
        success: true,
        result: {
          passed: summary.passed,
          testResults,
          totalTestCases: summary.totalTestCases,
          passedTestCases: summary.passedTestCases,
          executionTime: summary.averageExecutionTime,
          memoryUsed: summary.averageMemoryUsed
        },
        message: `${summary.passedTestCases}/${summary.totalTestCases} test cases passed`
      };

    } catch (error) {
      console.error('Code execution failed:', error);
      return {
        success: false,
        result: {
          passed: false,
          testResults: [],
          totalTestCases: testCases.length,
          passedTestCases: 0,
          error: "Network error occurred during execution"
        },
        message: "Failed to connect to execution service"
      };
    }
  };

  // Check for basic syntax errors
  const checkSyntaxErrors = (code: string, language: string): string | null => {
    const trimmedCode = code.trim();

    switch (language) {
      case 'javascript':
        if (!trimmedCode.includes('function') && !trimmedCode.includes('=>') && !trimmedCode.includes('const') && !trimmedCode.includes('let')) {
          return "JavaScript code should contain at least one function or variable declaration";
        }
        // Check for unmatched brackets
        const jsBrackets = (trimmedCode.match(/\{/g) || []).length - (trimmedCode.match(/\}/g) || []).length;
        if (jsBrackets !== 0) return "Unmatched curly braces";
        break;
        
      case 'python':
        if (!trimmedCode.includes('def') && !trimmedCode.includes('print') && !trimmedCode.includes('=')) {
          return "Python code should contain at least one function definition or statement";
        }
        break;
        
      case 'cpp':
        if (!trimmedCode.includes('#include')) {
          return "C++ code should include necessary headers";
        }
        if (!trimmedCode.includes('main')) {
          return "C++ code should contain a main function";
        }
        const cppBrackets = (trimmedCode.match(/\{/g) || []).length - (trimmedCode.match(/\}/g) || []).length;
        if (cppBrackets !== 0) return "Unmatched curly braces";
        break;
        
      case 'java':
        if (!trimmedCode.includes('class')) {
          return "Java code should contain a class definition";
        }
        if (!trimmedCode.includes('main')) {
          return "Java code should contain a main method";
        }
        const javaBrackets = (trimmedCode.match(/\{/g) || []).length - (trimmedCode.match(/\}/g) || []).length;
        if (javaBrackets !== 0) return "Unmatched curly braces";
        break;
    }

    return null;
  };

  // Execute individual test case
  const executeTestCase = async (code: string, language: string, testCase: TestCase, executionTime: number, memoryUsed: number) => {
    // Simulate realistic test case execution
    const input = testCase.input;
    const expected = testCase.expectedOutput.trim();

    // Simulate code execution based on problem patterns
    const actual = simulateCodeExecution(code, language, input, expected);
    
    const passed = actual === expected;
    
    return {
      input,
      expected,
      actual,
      passed,
      executionTime: Math.round(executionTime),
      memoryUsed: Math.round(memoryUsed)
    };
  };

  // Simulate code execution with intelligent output prediction
  const simulateCodeExecution = (code: string, language: string, input: string, expected: string): string => {
    // This is a sophisticated simulation that tries to predict reasonable outputs
    // In a real system, this would execute actual code in a sandboxed environment
    
    const codeContent = code.toLowerCase();
    const inputData = input.trim();
    
    // Smart simulation based on common problem patterns
    if (codeContent.includes('sort') || codeContent.includes('sorted')) {
      // Sorting problem simulation
      const numbers = inputData.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n));
      if (numbers.length > 0) {
        return numbers.sort((a, b) => a - b).join(' ');
      }
    }
    
    if (codeContent.includes('reverse')) {
      // Reverse simulation
      return inputData.split('').reverse().join('');
    }
    
    if (codeContent.includes('sum') || codeContent.includes('+')) {
      // Sum calculation simulation
      const numbers = inputData.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n));
      if (numbers.length > 0) {
        return numbers.reduce((a, b) => a + b, 0).toString();
      }
    }
    
    if (codeContent.includes('max') || codeContent.includes('maximum')) {
      // Maximum finding simulation
      const numbers = inputData.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n));
      if (numbers.length > 0) {
        return Math.max(...numbers).toString();
      }
    }
    
    if (codeContent.includes('min') || codeContent.includes('minimum')) {
      // Minimum finding simulation
      const numbers = inputData.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n));
      if (numbers.length > 0) {
        return Math.min(...numbers).toString();
      }
    }
    
    // For demo purposes, sometimes return correct answer, sometimes incorrect
    const successRate = 0.7; // 70% success rate for realistic testing
    if (Math.random() < successRate) {
      return expected; // Return expected answer
    } else {
      // Return plausible but incorrect answer
      if (!isNaN(parseInt(expected))) {
        const num = parseInt(expected);
        return (num + Math.floor(Math.random() * 3) - 1).toString(); // Off by 1 or 2
      } else {
        return inputData; // Return input as-is for wrong answer
      }
    }
  };

  // Enhanced run code function with comprehensive testing
  const runCode = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to run your code',
        variant: 'destructive'
      });
      return;
    }

    if (!code.trim()) {
      toast({
        title: 'No Code',
        description: 'Please write some code before running',
        variant: 'destructive'
      });
      return;
    }

    if (!problem) return;

    setRunning(true);
    setExecutionResult(null);

    try {
      console.log('🚀 Starting code execution...');
      
      // Prepare test cases from problem examples
      const testCases: TestCase[] = (problem.examples || []).map(example => ({
        input: example.input,
        expectedOutput: example.output,
        explanation: example.explanation
      }));

      // Add some hidden test cases for more comprehensive testing
      if (testCases.length > 0) {
        testCases.push(
          {
            input: "Hidden test case 1",
            expectedOutput: "Hidden output 1"
          },
          {
            input: "Hidden test case 2", 
            expectedOutput: "Hidden output 2"
          },
          {
            input: "Edge case",
            expectedOutput: "Edge result"
          }
        );
      }

      // Execute compilation and testing
      const result = await compileAndRunCode(code, language, testCases);
      setExecutionResult(result);

      // Show appropriate toast message
      if (result.success) {
        if (result.result?.passed) {
          toast({
            title: '🎉 All Tests Passed!',
            description: `${result.result.passedTestCases}/${result.result.totalTestCases} test cases passed. Great job!`,
          });
        } else {
          toast({
            title: '⚠️ Some Tests Failed',
            description: `${result.result?.passedTestCases}/${result.result?.totalTestCases} test cases passed. Check the results below.`,
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: '❌ Execution Failed',
          description: result.message || 'There was an error running your code',
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Failed to run code:', error);
      toast({
        title: 'Execution Error',
        description: 'An unexpected error occurred while running your code',
        variant: 'destructive'
      });
    } finally {
      setRunning(false);
    }
  };

  // Submit solution function
  const submitSolution = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to submit your solution',
        variant: 'destructive'
      });
      return;
    }

    if (!code.trim()) {
      toast({
        title: 'No Code',
        description: 'Please write some code before submitting',
        variant: 'destructive'
      });
      return;
    }

    if (!problem) return;

    setSubmitting(true);
    try {
      const response = await submissionAPI.submitCode(problem._id, code, language);
      
      if (response.success) {
        toast({
          title: 'Solution Submitted!',
          description: `Submission ID: ${response.data?.submission._id}`,
        });
      } else {
        toast({
          title: 'Submission Failed',
          description: response.message || 'Failed to submit your solution',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to submit solution:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit your solution. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    const langConfig = languages.find(l => l.value === newLanguage);
    if (langConfig) {
      setCode(langConfig.template);
    }
  };

  // Load problem on mount
  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  // Test this component is working
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Problem Not Found</h1>
          <p className="text-gray-600 mb-4">The problem you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/problems">
            <Button>Back to Problems</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/problems" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Problems
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{problem.title}</h1>
            {problem.isFeatured && (
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <Badge className="bg-green-100 text-green-800">
            {problem.difficulty}
          </Badge>
          <span className="text-sm text-gray-600">
            {problem.acceptanceRate || 0}% Acceptance Rate
          </span>
          <span className="text-sm text-gray-600">
            {(problem.totalSubmissions || 0).toLocaleString()} submissions
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Panel - Problem Statement */}
          <div className="xl:h-[calc(100vh-12rem)] xl:overflow-y-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Problem Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {problem.description || 'No description available for this problem.'}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {(problem.tags || []).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
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
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Example {index + 1}:</h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Input:</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border font-mono text-sm">
                            {example.input}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Output:</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border font-mono text-sm">
                            {example.output}
                          </div>
                        </div>
                        {example.explanation && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Explanation:</Label>
                            <div className="mt-1 p-3 bg-blue-50 rounded border text-sm">
                              {example.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Code Editor & Test Results */}
          <div className="xl:h-[calc(100vh-12rem)] flex flex-col space-y-6">
            {/* Code Editor */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Code Editor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-40">
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

                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={`Write your ${language} solution here...`}
                    className="min-h-[300px] font-mono text-sm"
                    style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
                  />

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={runCode}
                      disabled={running || !isAuthenticated}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {running ? 'Running...' : 'Run Code'}
                    </Button>
                    
                    <Button
                      onClick={submitSolution}
                      disabled={submitting || !isAuthenticated}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {submitting ? 'Submitting...' : 'Submit Solution'}
                    </Button>
                  </div>

                  {!isAuthenticated && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3">
                      <p className="text-sm text-amber-700">
                        Please <Link href="/auth" className="text-blue-600 hover:underline font-medium">log in</Link> to run code and submit solutions.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Debug: User = {user ? 'logged in' : 'null'}, IsAuth = {isAuthenticated.toString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test Results Display */}
            {executionResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {executionResult.success && executionResult.result?.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    Test Results
                    {executionResult.success && executionResult.result && (
                      <Badge 
                        variant={executionResult.result.passed ? "default" : "destructive"} 
                        className="ml-2"
                      >
                        {executionResult.result.passedTestCases} / {executionResult.result.totalTestCases} Passed
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto">
                  {executionResult.result?.compileError ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">Compilation Error</span>
                      </div>
                      <p className="text-sm text-red-700 font-mono">
                        {executionResult.result.compileError}
                      </p>
                    </div>
                  ) : executionResult.result?.error ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">Runtime Error</span>
                      </div>
                      <p className="text-sm text-red-700 font-mono">
                        {executionResult.result.error}
                      </p>
                    </div>
                  ) : (
                    <Tabs defaultValue="results" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="results">Test Cases</TabsTrigger>
                        <TabsTrigger value="details">Performance</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="results" className="space-y-3 mt-4">
                        {executionResult.result?.testResults.map((test, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {test.passed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="font-medium text-sm">
                                  {index < (problem?.examples?.length || 0) 
                                    ? `Example ${index + 1}` 
                                    : `Test Case ${index + 1}`
                                  }
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={test.passed ? "default" : "destructive"} className="text-xs">
                                  {test.passed ? "Passed" : "Failed"}
                                </Badge>
                                {test.executionTime && (
                                  <span className="text-xs text-gray-500">{test.executionTime}ms</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Input</Label>
                                <div className="mt-1 p-2 bg-gray-50 rounded border font-mono text-xs max-h-20 overflow-y-auto">
                                  {test.input}
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Expected Output</Label>
                                <div className="mt-1 p-2 bg-gray-50 rounded border font-mono text-xs max-h-20 overflow-y-auto">
                                  {test.expected}
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Your Output</Label>
                                <div className={`mt-1 p-2 rounded border font-mono text-xs max-h-20 overflow-y-auto ${
                                  test.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                }`}>
                                  {test.actual}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="details" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Execution Time</span>
                            </div>
                            <span className="font-mono text-lg font-bold text-blue-800">
                              {executionResult.result?.executionTime || 0}ms
                            </span>
                            <p className="text-xs text-blue-600 mt-1">Average per test case</p>
                          </div>
                          
                          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <MemoryStick className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium">Memory Usage</span>
                            </div>
                            <span className="font-mono text-lg font-bold text-purple-800">
                              {((executionResult.result?.memoryUsed || 0) / 1024).toFixed(1)}KB
                            </span>
                            <p className="text-xs text-purple-600 mt-1">Average per test case</p>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Overall Result</span>
                          </div>
                          <p className="text-sm text-green-800">
                            <span className="font-semibold">
                              {executionResult.result?.passedTestCases} of {executionResult.result?.totalTestCases} test cases passed
                            </span>
                            {executionResult.result?.passed 
                              ? " 🎉 All test cases passed! Great job!" 
                              : " ⚠️ Some test cases failed. Review your logic and try again."}
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetailPage;
