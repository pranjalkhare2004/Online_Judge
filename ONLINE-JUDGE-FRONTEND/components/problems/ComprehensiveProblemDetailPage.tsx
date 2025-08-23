'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import enhancedApiClient from '@/lib/enhanced-api-client';
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
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
  Loader2,
  RefreshCw,
  ChevronDown,
  Copy,
  Zap,
  LogIn,
  Trophy,
  Database,
  Upload,
  TestTube2
} from 'lucide-react';
import Link from 'next/link';
import { Editor } from '@monaco-editor/react';
import { SubmissionStatusIndicator } from '@/components/submissions/SubmissionStatusIndicator';
import { formatExecutionTimeShort, formatMemoryUsage } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

// Type definitions
interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints: string;
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
  status: string;
  executionTime?: number;
  memoryUsed?: number;
  submittedAt: string;
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

// Helper function to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
};

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
  const [latestSubmissionId, setLatestSubmissionId] = useState<string | null>(null);

  // Code editor state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  
  // Manual testing state
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('code');

  // Scroll navigation state
  const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState(0);
  const submissionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation when submissions tab is active
      if (activeTab !== 'submissions' || submissions.length === 0) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          setSelectedSubmissionIndex(prev => {
            const newIndex = Math.max(0, prev - 1);
            submissionRefs.current[newIndex]?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            return newIndex;
          });
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedSubmissionIndex(prev => {
            const newIndex = Math.min(submissions.length - 1, prev + 1);
            submissionRefs.current[newIndex]?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            return newIndex;
          });
          break;
        case ' ':
          event.preventDefault();
          // Toggle code expansion for selected submission
          const selectedElement = submissionRefs.current[selectedSubmissionIndex];
          const detailsElement = selectedElement?.querySelector('details');
          if (detailsElement) {
            detailsElement.open = !detailsElement.open;
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, submissions.length, selectedSubmissionIndex]);

  // Reset selected submission when switching tabs
  useEffect(() => {
    if (activeTab === 'submissions') {
      setSelectedSubmissionIndex(0);
    }
  }, [activeTab]);

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
    if (!slug || typeof slug !== 'string') return;
    
    try {
      setLoading(true);
      const response = await enhancedApiClient.getProblem(slug);
      
      if (response.success && response.data) {
        setProblem(response.data);
      } else {
        throw new Error('Problem not found');
      }
    } catch (error) {
      console.error('Failed to fetch problem:', error);
      showErrorToast('Error', 'Failed to load problem. Please try again.');
      router.push('/problems');
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  // Load problem data on mount
  useEffect(() => {
    loadProblem();
  }, [loadProblem]);

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
      const response = await enhancedApiClient.getUserSubmissions(1, 50, problem._id);
      
      if (response.success && response.data) {
        setSubmissions(response.data.items);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [isAuthenticated, problem]);

  // Load problem on component mount
  useEffect(() => {
    loadProblem();
  }, [loadProblem]);

  // Load submissions when problem changes and user is authenticated
  useEffect(() => {
    if (problem && isAuthenticated) {
      loadSubmissions();
    }
  }, [problem, isAuthenticated, loadSubmissions]);

  // Run code with test cases - Enhanced with proper state management
  const runCode = useCallback(async () => {
    // Prevent multiple concurrent executions
    if (running) {
      console.log('🔄 [FRONTEND DEBUG] Run already in progress, ignoring click');
      return;
    }

    if (!problem || !code.trim()) {
      showErrorToast('Error', 'Please write some code before running.');
      return;
    }

    console.log('🚀 [FRONTEND DEBUG] Starting code execution...');
    
    // Clear previous results immediately and set running state
    setExecutionResult(null);
    setRunning(true);
    
    // Auto-switch to results tab to show progress
    setActiveTab('results');

    try {
      console.log(`📝 [FRONTEND DEBUG] Preparing ${problem.examples.length} test cases...`);
      
      // Convert problem examples to proper input format based on problem type
      const testCases = problem.examples.map(example => {
        // Handle Two Sum format: "nums = [2,7,11,15], target = 9"
        const twoSumMatch = example.input.match(/nums = \[(.*?)\], target = (-?\d+)/);
        if (twoSumMatch) {
          const nums = twoSumMatch[1].split(',').map(n => n.trim());
          const target = twoSumMatch[2];
          const formattedInput = `${nums.length}\n${nums.join(' ')}\n${target}`;
          
          // Normalize expected output format to match C++ solution format: [0, 1] (with space)
          let normalizedOutput = example.output;
          if (normalizedOutput.includes('[') && normalizedOutput.includes(']') && !normalizedOutput.includes(', ')) {
            // Convert [0,1] to [0, 1] to match C++ output format
            normalizedOutput = normalizedOutput.replace(/(\d),(\d)/g, '$1, $2');
          }
          
          return {
            input: formattedInput,
            expectedOutput: normalizedOutput
          };
        }
        
        // Handle Valid Parentheses format: s = "()"
        const validParenMatch = example.input.match(/s = "(.*)"/);
        if (validParenMatch) {
          const s = validParenMatch[1];
          return {
            input: s,
            expectedOutput: example.output
          };
        }
        
        // Fallback to original format if parsing fails
        return {
          input: example.input,
          expectedOutput: example.output
        };
      });

      console.log('⚡ [FRONTEND DEBUG] Executing code with test cases...');
      const response = await enhancedApiClient.executeCode(code, language, testCases);
      
      console.log('✅ [FRONTEND DEBUG] Code execution completed:', response.success);
      
      // Only set results if execution completed successfully (prevents race conditions)
      if (response) {
        setExecutionResult(response);
        
        // Show appropriate toast notification
        if (response.success) {
          const allPassed = response.data.passedTests === response.data.totalTests;
          console.log(`📊 [FRONTEND DEBUG] Test results: ${response.data.passedTests}/${response.data.totalTests} passed`);
          
          if (allPassed) {
            showSuccessToast('All Tests Passed! 🎉', `Perfect! All ${response.data.totalTests} test cases passed successfully.`);
          } else {
            showErrorToast('Some Tests Failed', `${response.data.passedTests} out of ${response.data.totalTests} test cases passed. Check the results below.`);
          }
        } else {
          showErrorToast('Execution Failed', response.message || 'Unknown error occurred during code execution.');
        }
      }
    } catch (error) {
      console.error('❌ [FRONTEND DEBUG] Error running code:', error);
      
      // Clear any partial results on error
      setExecutionResult(null);
      showErrorToast('Execution Error', 'Failed to run code. Please check your code and try again.');
    } finally {
      console.log('🏁 [FRONTEND DEBUG] Code execution finished, resetting running state');
      setRunning(false);
    }
  }, [problem, code, language, running]);

  // Run code with custom input
  const runCustomInput = useCallback(async () => {
    if (!code.trim()) {
      showErrorToast('Error', 'Please write some code before running.');
      return;
    }

    setRunning(true);
    setCustomOutput('');

    try {
      const testCases = [{
        input: customInput,
        expectedOutput: '' // No expected output for custom run
      }];

      const response = await enhancedApiClient.executeCode(code, language, testCases);
      
      if (response.success && response.data.results[0]) {
        setCustomOutput(response.data.results[0].actualOutput || '');
      } else {
        setCustomOutput(`Error: ${response.message || 'Execution failed'}`);
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
    console.log('🔍 [FRONTEND DEBUG] Submit button clicked');
    console.log('🔍 [FRONTEND DEBUG] Problem:', problem?._id);
    console.log('🔍 [FRONTEND DEBUG] Code length:', code.trim().length);
    console.log('🔍 [FRONTEND DEBUG] Language:', language);
    console.log('🔍 [FRONTEND DEBUG] Is authenticated:', isAuthenticated);
    
    if (!problem || !code.trim()) {
      console.log('❌ [FRONTEND DEBUG] Validation failed - missing problem or code');
      toast({
        title: 'Error',
        description: 'Please write some code before submitting.',
        variant: 'destructive'
      });
      return;
    }

    console.log('✅ [FRONTEND DEBUG] Starting submission...');
    setSubmitting(true);

    try {
      console.log('📤 [FRONTEND DEBUG] Calling enhancedApiClient.submitSolution...');
      const response = await enhancedApiClient.submitSolution(problem._id, code, language);
      
      console.log('📊 [FRONTEND DEBUG] Submit response:', response);
      
      if (response.success && response.data) {
        console.log('✅ [FRONTEND DEBUG] Submission successful:', response.data.submissionId);
        
        // Store the submission ID for real-time tracking
        setLatestSubmissionId(response.data.submissionId);
        
        showSuccessToast('Solution Submitted!', 'Your solution has been submitted for evaluation');
        
        // Reload submissions
        loadSubmissions();
        // Switch to submissions tab
        setActiveTab('submissions');
      } else {
        console.log('❌ [FRONTEND DEBUG] Submission failed:', response.message);
        showErrorToast('Submission Failed', response.message || 'Failed to submit solution');
      }
    } catch (error) {
      console.error('❌ [FRONTEND DEBUG] Error submitting solution:', error);
      console.error('❌ [FRONTEND DEBUG] Error details:', error.response?.data);
      showErrorToast('Error', 'Failed to submit solution. Please try again.');
    } finally {
      console.log('🏁 [FRONTEND DEBUG] Submit process completed');
      setSubmitting(false);
    }
  }, [problem, code, language, loadSubmissions, isAuthenticated]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Responsive Modern Header with glassmorphism */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/problems')}
                className="flex items-center gap-1 md:gap-2 hover:bg-slate-100/70 transition-all duration-200 flex-shrink-0"
              >
                <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Back to Problems</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <Separator orientation="vertical" className="h-4 md:h-6" />
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <Badge 
                  className={`${getDifficultyColor(problem.difficulty)} px-2 md:px-3 py-0.5 md:py-1 font-medium shadow-sm text-xs md:text-sm flex-shrink-0`}
                >
                  {problem.difficulty}
                </Badge>
                <h1 className="text-lg md:text-xl font-semibold text-gray-900 tracking-tight truncate">{problem.title}</h1>
              </div>
            </div>
            
            {problem.acceptanceRate !== undefined && (
              <div className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50/70 border border-green-200/50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{problem.acceptanceRate}% Acceptance</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/70 border border-blue-200/50">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{problem.totalSubmissions} Submissions</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Main Content */}
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          {/* Left Side - Problem Description */}
          <div className="space-y-4 md:space-y-6">
            {/* Problem Description Card with Modern Styling */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3 md:pb-4 px-4 md:px-6">
                <CardTitle className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 md:w-2 h-5 md:h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full flex-shrink-0"></div>
                  Problem Description
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <div 
                  className="prose prose-sm md:prose max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: problem.description.replace(/\n/g, '<br/>') 
                  }}
                />
              </CardContent>
            </Card>

            {/* Examples with Enhanced Styling */}
            {problem.examples && problem.examples.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                    Examples
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {problem.examples.map((example, index) => (
                    <div key={index} className="border border-gray-200/60 rounded-xl p-5 bg-gradient-to-br from-gray-50/80 to-gray-100/50 hover:from-gray-100/80 hover:to-gray-50/80 transition-all duration-200">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                            Input:
                          </Label>
                          <div className="mt-2 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 font-mono text-sm shadow-sm">
                            {example.input}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-green-500 rounded-full"></span>
                            Output:
                          </Label>
                          <div className="mt-2 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 font-mono text-sm shadow-sm">
                            {example.output}
                          </div>
                        </div>
                        {example.explanation && (
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
                              Explanation:
                            </Label>
                            <p className="mt-2 text-sm text-gray-600 bg-purple-50/50 p-3 rounded-lg border border-purple-200/50">{example.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Constraints and Tags with Modern Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {problem.constraints && problem.constraints.length > 0 && (
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                      Constraints
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="text-gray-700 p-2 rounded-lg hover:bg-gray-50/50 transition-colors whitespace-pre-wrap">
                        {problem.constraints}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-4 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"></div>
                    Tags & Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-3 py-1 bg-blue-50/80 text-blue-700 border border-blue-200/50 hover:bg-blue-100/80 transition-colors">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50/50 border border-green-200/30">
                      <Clock className="h-3 w-3 text-green-600" />
                      <span className="font-medium">Time Limit: {problem.timeLimit}ms</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/50 border border-purple-200/30">
                      <MemoryStick className="h-3 w-3 text-purple-600" />
                      <span className="font-medium">Memory Limit: {problem.memoryLimit}MB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Side - Modern Code Editor and Tabs */}
          <div className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                    Code Editor
                  </CardTitle>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-36 bg-white/90 backdrop-blur-sm border border-gray-200/50 hover:bg-white/95 transition-all shadow-sm">
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
                  <TabsList className="grid w-full grid-cols-3 bg-gray-100/70 backdrop-blur-sm p-1 rounded-lg">
                    <TabsTrigger value="code" className="flex items-center gap-2 data-[state=active]:bg-white/90 data-[state=active]:shadow-sm transition-all">
                      <Code2 className="h-4 w-4" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="results" className="flex items-center gap-2 data-[state=active]:bg-white/90 data-[state=active]:shadow-sm transition-all">
                      <Terminal className="h-4 w-4" />
                      Results
                    </TabsTrigger>
                    <TabsTrigger value="submissions" className="flex items-center gap-2 data-[state=active]:bg-white/90 data-[state=active]:shadow-sm transition-all">
                      <History className="h-4 w-4" />
                      Submissions
                    </TabsTrigger>
                  </TabsList>

                  {/* Code Tab with Enhanced Monaco Editor */}
                  <TabsContent value="code" className="space-y-6 mt-6">
                    <div className="border border-gray-200/50 rounded-xl overflow-hidden shadow-sm bg-white/50 backdrop-blur-sm">
                      <Editor
                        height="420px"
                        language={language === 'cpp' ? 'cpp' : language}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        theme="vs-light"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: true,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: 'on',
                          fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
                          lineHeight: 1.6,
                          padding: { top: 16, bottom: 16 },
                          // Enhanced scrolling options
                          scrollbar: {
                            vertical: 'visible',
                            horizontal: 'visible',
                            verticalScrollbarSize: 12,
                            horizontalScrollbarSize: 12,
                            useShadows: true,
                            verticalHasArrows: true,
                            horizontalHasArrows: true,
                            arrowSize: 11,
                            verticalSliderSize: 12,
                            horizontalSliderSize: 12
                          },
                          smoothScrolling: true,
                          cursorSmoothCaretAnimation: "on",
                          mouseWheelScrollSensitivity: 1,
                          fastScrollSensitivity: 5,
                          scrollPredominantAxis: true,
                          revealHorizontalRightPadding: 30,
                          overviewRulerLanes: 3,
                          overviewRulerBorder: false,
                          hideCursorInOverviewRuler: true
                        }}
                      />
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button 
                        onClick={runCode}
                        disabled={running || !isAuthenticated}
                        className={cn(
                          "flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200",
                          running 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        )}
                      >
                        {running ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="hidden sm:inline">Running Tests...</span>
                            <span className="sm:hidden">Running...</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            <span className="hidden sm:inline">Run Tests</span>
                            <span className="sm:hidden">Run</span>
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={submitSolution}
                        disabled={submitting || !isAuthenticated || running}
                        className={cn(
                          "flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200",
                          (submitting || running)
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        )}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="hidden sm:inline">Submitting...</span>
                            <span className="sm:hidden">Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span className="hidden sm:inline">Submit Solution</span>
                            <span className="sm:hidden">Submit</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {!isAuthenticated && (
                      <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                          <p className="text-sm text-amber-800 font-medium">
                            Please <Link href="/auth" className="text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-2 font-semibold transition-colors">log in</Link> to run code and submit solutions.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Custom Input/Output Section */}
                    <Card className="bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <div className="w-2 h-5 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full"></div>
                          Test with Custom Input
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                              Input
                            </Label>
                            <Textarea
                              value={customInput}
                              onChange={(e) => setCustomInput(e.target.value)}
                              placeholder="Enter your test input..."
                              className="font-mono text-sm bg-white/80 backdrop-blur-sm border border-gray-200/50 focus:border-blue-300 transition-all resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                              rows={6}
                              style={{ 
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#cbd5e1 #f1f5f9'
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <span className="w-1.5 h-4 bg-green-500 rounded-full"></span>
                              Output
                            </Label>
                            <Textarea
                              value={customOutput}
                              readOnly
                              placeholder="Output will appear here..."
                              className="font-mono text-sm bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                              rows={6}
                              style={{ 
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#cbd5e1 #f1f5f9'
                              }}
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={runCustomInput}
                          disabled={running || !isAuthenticated}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2 bg-white/80 hover:bg-white/90 border border-gray-200/50 hover:border-gray-300 transition-all"
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

                  {/* Enhanced Results Tab */}
                  <TabsContent value="results" className="mt-6">
                    {running ? (
                      <Card className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-200/50 shadow-lg">
                        <CardContent className="py-16">
                          <div className="text-center">
                            <div className="p-4 bg-blue-100/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                            </div>
                            <h3 className="text-lg font-medium mb-2 text-blue-900">Running Your Code</h3>
                            <p className="text-sm text-blue-700">Testing against all visible test cases...</p>
                            <div className="mt-4 w-64 mx-auto">
                              <Progress value={30} className="h-2 bg-blue-200" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : executionResult ? (
                      <Card className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm border border-gray-200/50 shadow-lg">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-3">
                            {executionResult.success && executionResult.data?.overallResult === 'ACCEPTED' ? (
                              <div className="p-2 bg-green-100 rounded-full">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              </div>
                            ) : (
                              <div className="p-2 bg-red-100 rounded-full">
                                <XCircle className="h-5 w-5 text-red-600" />
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold">Test Results</span>
                              {executionResult.data && (
                                <Badge 
                                  variant={executionResult.data.overallResult === 'ACCEPTED' ? "default" : "destructive"}
                                  className="px-3 py-1 text-sm font-medium shadow-sm"
                                >
                                  {executionResult.data.passedTests} / {executionResult.data.totalTests} Passed
                                </Badge>
                              )}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {executionResult.data?.compilationError ? (
                            <div className="p-5 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/60 rounded-xl">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-red-100 rounded-full">
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                </div>
                                <span className="font-semibold text-red-800">Compilation Error</span>
                              </div>
                              <pre className="text-sm text-red-700 font-mono whitespace-pre-wrap bg-white/50 p-4 rounded-lg border border-red-200/50">
                                {executionResult.data.compilationError}
                              </pre>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {/* Enhanced Performance Summary */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 rounded-xl">
                                  <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                      <Clock className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-blue-800">Execution Time</span>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-2xl font-bold text-blue-900">
                                      {formatExecutionTimeShort(executionResult.data?.executionTime)}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl">
                                  <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className="p-2 bg-purple-100 rounded-full">
                                      <MemoryStick className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-purple-800">Memory Usage</span>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-2xl font-bold text-purple-900">
                                      {((executionResult.data?.memoryUsed || 0) / 1024).toFixed(1)}
                                    </span>
                                    <span className="text-sm text-purple-700 ml-1">KB</span>
                                  </div>
                                </div>
                              </div>

                              {/* Enhanced Test Case Results */}
                              <div className="space-y-4">
                                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                  <div className="w-2 h-5 bg-gradient-to-b from-gray-600 to-gray-800 rounded-full"></div>
                                  Test Case Details
                                </h4>
                                {executionResult.data?.results.map((result, index) => (
                                  <div key={index} className={`border rounded-xl p-5 transition-all duration-200 ${
                                    result.passed 
                                      ? 'bg-gradient-to-br from-green-50/80 to-emerald-50/80 border-green-200/60 hover:shadow-md' 
                                      : 'bg-gradient-to-br from-red-50/80 to-pink-50/80 border-red-200/60 hover:shadow-md'
                                  }`}>
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${
                                          result.passed ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                          {result.passed ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                          )}
                                        </div>
                                        <span className="font-semibold text-sm">Test Case {index + 1}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Badge 
                                          variant={result.passed ? "default" : "destructive"} 
                                          className="text-xs px-3 py-1 shadow-sm"
                                        >
                                          {result.passed ? "Passed" : "Failed"}
                                        </Badge>
                                        <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded-full">
                                          {formatExecutionTimeShort(result.executionTime)}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-2">
                                          <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
                                          Input
                                        </Label>
                                        <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200/50 font-mono text-xs">
                                          {result.input}
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-2">
                                          <span className="w-1 h-3 bg-green-500 rounded-full"></span>
                                          Expected
                                        </Label>
                                        <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200/50 font-mono text-xs">
                                          {result.expectedOutput}
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-2">
                                          <span className={`w-1 h-3 rounded-full ${
                                            result.passed ? 'bg-green-500' : 'bg-red-500'
                                          }`}></span>
                                          Your Output
                                        </Label>
                                        <div className={`p-3 rounded-lg border font-mono text-xs ${
                                          result.passed 
                                            ? 'bg-green-50/70 border-green-200/50' 
                                            : 'bg-red-50/70 border-red-200/50'
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
                      <div className="text-center py-16 text-gray-500">
                        <div className="p-4 bg-gray-100/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                          <Terminal className="h-10 w-10 opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                        <p className="text-sm">Run your code to see test results here</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Enhanced Submissions Tab - Responsive Design */}
                  <TabsContent value="submissions" className="mt-4 md:mt-6">
                    {isAuthenticated ? (
                      <Card className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm border border-gray-200/50 shadow-lg overflow-hidden">
                        <CardHeader className="pb-3 px-4 md:px-6">
                          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                              <div className="p-1.5 md:p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex-shrink-0">
                                <History className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-base md:text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent block truncate">
                                  Submission History
                                </span>
                                <p className="text-xs md:text-sm text-gray-500 mt-0.5 hidden sm:block">Track your progress and solution attempts</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log(`[ProblemPage] Manual refresh requested`);
                                loadSubmissions();
                              }}
                              disabled={loadingSubmissions}
                              className="flex items-center gap-2 bg-white/80 hover:bg-white/90 border border-gray-200/50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md flex-shrink-0"
                            >
                              <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${loadingSubmissions ? 'animate-spin text-blue-600' : 'text-gray-600'}`} />
                              <span className="hidden sm:inline text-sm">Refresh</span>
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
                          {/* Enhanced Latest Submission Status Indicator - Responsive */}
                          {latestSubmissionId && (
                            <div className="relative p-4 md:p-6 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200/60 rounded-xl shadow-inner">
                              <div className="absolute top-2 md:top-3 right-2 md:right-3">
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full animate-pulse"></div>
                              </div>
                              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                                <div className="p-1.5 md:p-2 bg-blue-100 rounded-full flex-shrink-0">
                                  <Terminal className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-sm md:text-base font-semibold text-blue-900 truncate">Latest Submission</h4>
                                  <p className="text-xs md:text-sm text-blue-700 hidden sm:block">Real-time status tracking</p>
                                </div>
                              </div>
                              <SubmissionStatusIndicator
                                submissionId={latestSubmissionId}
                                showDetails={true}
                                showProgress={true}
                                autoRefresh={true}
                                onStatusChange={(status) => {
                                  console.log(`[ProblemPage] Latest submission ${latestSubmissionId} status changed to: ${status}`);
                                  // REMOVED: No more automatic reloading to prevent API spam
                                  // The submission list will be refreshed manually by user if needed
                                }}
                                className="w-full"
                              />
                            </div>
                          )}
                          
                          {loadingSubmissions ? (
                            <div className="space-y-4">
                              <div className="text-center text-sm text-gray-500 mb-4">Loading submissions...</div>
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 bg-gray-100 rounded-xl animate-pulse">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <Skeleton className="h-6 w-20 bg-gray-200" />
                                      <Skeleton className="h-4 w-24 bg-gray-200" />
                                    </div>
                                    <Skeleton className="h-4 w-16 bg-gray-200" />
                                  </div>
                                  <Skeleton className="h-4 w-full bg-gray-200" />
                                </div>
                              ))}
                            </div>
                          ) : submissions.length > 0 ? (
                            <div className="space-y-3 md:space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <div className="w-1 h-3 md:h-4 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full flex-shrink-0"></div>
                                  <span className="truncate">All Submissions ({submissions.length})</span>
                                </h5>
                                <div className="flex items-center gap-2">
                                  {submissions.some(s => s.status === 'ACCEPTED') && (
                                    <div className="flex items-center gap-1 text-xs md:text-sm text-green-600">
                                      <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                      <span className="whitespace-nowrap">Problem Solved!</span>
                                    </div>
                                  )}
                                  {submissions.length > 5 && (
                                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                                      Scroll to view all
                                    </div>
                                  )}
                                </div>
                              </div>
                              <ScrollArea className="max-h-[400px] md:max-h-[600px] pr-2 md:pr-3 relative">
                                {/* Enhanced scroll indicator */}
                                <div className="absolute right-0 top-0 bottom-0 w-0.5 md:w-1 bg-gradient-to-b from-transparent via-gray-200/50 to-transparent rounded-full z-10 pointer-events-none"></div>
                                <div className="space-y-2 md:space-y-4 pb-2 md:pb-4">
                                  {submissions.map((submission, index) => (
                                    <Card 
                                      key={submission._id}
                                      ref={(el) => { submissionRefs.current[index] = el; }}
                                      className={cn(
                                        "group hover:shadow-lg transition-all duration-300 border-l-4 overflow-visible",
                                        selectedSubmissionIndex === index 
                                          ? 'ring-2 ring-blue-400 shadow-md' 
                                          : '',
                                        submission.status === 'ACCEPTED' 
                                          ? "border-l-green-500 bg-gradient-to-r from-green-50/80 to-white hover:from-green-50 hover:to-green-50/30" 
                                          : submission.status === 'WRONG_ANSWER' || submission.status === 'REJECTED'
                                          ? "border-l-red-500 bg-gradient-to-r from-red-50/80 to-white hover:from-red-50 hover:to-red-50/30"
                                          : submission.status === 'TIME_LIMIT_EXCEEDED'
                                          ? "border-l-yellow-500 bg-gradient-to-r from-yellow-50/80 to-white hover:from-yellow-50 hover:to-yellow-50/30"
                                          : submission.status === 'Pending' || submission.status === 'Running'
                                          ? "border-l-blue-500 bg-gradient-to-r from-blue-50/80 to-white hover:from-blue-50 hover:to-blue-50/30"
                                          : "border-l-gray-400 bg-gradient-to-r from-gray-50/80 to-white hover:from-gray-50 hover:to-gray-50/30"
                                      )}
                                      tabIndex={0}
                                      onFocus={() => setSelectedSubmissionIndex(index)}
                                    >
                                      <CardContent className="p-3 md:p-5">
                                        {/* Compact Submission Number Badge */}
                                        <div className="absolute top-2 md:top-3 right-2 md:right-3">
                                          <div className="px-1.5 md:px-2 py-0.5 md:py-1 bg-white/70 border border-gray-200/50 rounded-full text-xs font-medium text-gray-600">
                                            #{submissions.length - index}
                                          </div>
                                        </div>

                                        {/* Header Section */}
                                        <div className="flex items-start justify-between mb-2 md:mb-4 pr-8 md:pr-12">
                                          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                                            {/* Enhanced Status Indicator */}
                                            {(submission.status === 'Pending' || submission.status === 'Running') && submission._id !== latestSubmissionId ? (
                                              <div className="flex items-center gap-2 md:gap-3">
                                                <div className="p-1.5 md:p-2 bg-blue-100 rounded-full flex-shrink-0">
                                                  <Loader2 className="h-3 w-3 md:h-4 md:w-4 text-blue-600 animate-spin" />
                                                </div>
                                                <SubmissionStatusIndicator
                                                  submissionId={submission._id}
                                                  initialStatus={submission.status}
                                                  showDetails={false}
                                                  showProgress={false}
                                                  autoRefresh={true}
                                                  onStatusChange={(status) => {
                                                    console.log(`[ProblemPage] Submission ${submission._id} status changed to: ${status}`);
                                                  }}
                                                  className="flex items-center gap-2 min-w-0"
                                                />
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-2 md:gap-3">
                                                {/* Status Badge with Icon */}
                                                <Badge className={cn(
                                                  "flex items-center gap-2 px-3 py-1.5 text-sm font-medium border shadow-sm",
                                                  submission.status === 'ACCEPTED' 
                                                    ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200" 
                                                    : submission.status === 'WRONG_ANSWER' || submission.status === 'REJECTED'
                                                    ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
                                                    : submission.status === 'TIME_LIMIT_EXCEEDED'
                                                    ? "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                                                    : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                                                )}>
                                                  {submission.status === 'ACCEPTED' ? (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                  ) : submission.status === 'WRONG_ANSWER' || submission.status === 'REJECTED' ? (
                                                    <XCircle className="h-4 w-4" />
                                                  ) : submission.status === 'TIME_LIMIT_EXCEEDED' ? (
                                                    <Clock className="h-4 w-4" />
                                                  ) : (
                                                    <AlertCircle className="h-4 w-4" />
                                                  )}
                                                  {submission.status}
                                                </Badge>

                                                {/* Language Badge */}
                                                <Badge variant="outline" className="flex items-center gap-1.5 bg-blue-50/80 text-blue-700 border-blue-200">
                                                  <Code2 className="h-3.5 w-3.5" />
                                                  {submission.language}
                                                </Badge>

                                                {/* Timestamp */}
                                                <div className="text-xs text-gray-500">
                                                  <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(submission.submittedAt)}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          {/* Quick Actions */}
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 w-8 p-0 hover:bg-blue-100"
                                              onClick={() => {
                                                const decodedCode = decodeHtmlEntities(submission.code);
                                                navigator.clipboard.writeText(decodedCode);
                                                showSuccessToast('Code copied to clipboard!');
                                              }}
                                            >
                                              <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 w-8 p-0 hover:bg-blue-100"
                                              onClick={() => setCode(decodeHtmlEntities(submission.code))}
                                            >
                                              <Upload className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Performance Metrics */}
                                        {(submission.executionTime || submission.memoryUsed) && (
                                          <div className="flex items-center gap-6 mb-4 p-3 bg-gray-50/50 rounded-lg border">
                                            {submission.executionTime && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <div className="p-1.5 bg-blue-100 rounded-full">
                                                  <Zap className="h-3.5 w-3.5 text-blue-600" />
                                                </div>
                                                <div>
                                                  <div className="text-gray-600 text-xs">Execution Time</div>
                                                  <div className="font-mono font-medium">
                                                    {formatExecutionTimeShort(submission.executionTime)}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            {submission.memoryUsed && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <div className="p-1.5 bg-purple-100 rounded-full">
                                                  <Database className="h-3.5 w-3.5 text-purple-600" />
                                                </div>
                                                <div>
                                                  <div className="text-gray-600 text-xs">Memory Used</div>
                                                  <div className="font-mono font-medium">
                                                    {formatMemoryUsage(submission.memoryUsed)}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            {submission.status === 'ACCEPTED' && (
                                              <div className="flex items-center gap-2 text-sm ml-auto">
                                                <div className="p-1.5 bg-green-100 rounded-full">
                                                  <Trophy className="h-3.5 w-3.5 text-green-600" />
                                                </div>
                                                <span className="text-green-700 font-medium text-xs">Solved!</span>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Enhanced Expandable Code Section */}
                                        <Collapsible>
                                          <CollapsibleTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              className="w-full justify-between p-3 h-auto bg-gray-50/30 hover:bg-gray-100/50 border border-dashed border-gray-200 hover:border-gray-300 transition-all"
                                            >
                                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <FileCode className="h-4 w-4" />
                                                <span>View Code</span>
                                                <Badge variant="outline" className="text-xs">
                                                  {submission.code?.split('\n').length || 0} lines
                                                </Badge>
                                              </div>
                                              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                                            </Button>
                                          </CollapsibleTrigger>
                                          <CollapsibleContent>
                                            <div className="mt-3 border border-gray-200/60 rounded-lg md:rounded-xl overflow-hidden shadow-inner">
                                              <div className="flex items-center justify-between px-3 md:px-4 py-1.5 md:py-2 bg-gray-900/95 backdrop-blur-sm">
                                                <div className="flex items-center gap-1 md:gap-2">
                                                  <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full"></div>
                                                  <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full"></div>
                                                  <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full"></div>
                                                  <span className="text-xs text-gray-400 uppercase tracking-wide ml-1 md:ml-2">
                                                    {submission.language}
                                                  </span>
                                                </div>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-7 text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                                                  onClick={() => {
                                                    const decodedCode = decodeHtmlEntities(submission.code);
                                                    navigator.clipboard.writeText(decodedCode);
                                                    showSuccessToast('Code copied!');
                                                  }}
                                                >
                                                  <Copy className="h-3 w-3 mr-1" />
                                                  Copy
                                                </Button>
                                              </div>
                                              <div className="bg-gray-950 p-2 md:p-4 relative">
                                                <ScrollArea className="max-h-48 md:max-h-80 w-full">
                                                  <pre className="text-xs md:text-sm font-mono text-gray-100 whitespace-pre-wrap pb-2 md:pb-4 pr-2 md:pr-4">
                                                    <code dangerouslySetInnerHTML={{
                                                      __html: decodeHtmlEntities(submission.code)
                                                    }} />
                                                  </pre>
                                                </ScrollArea>
                                                <div className="absolute right-1 md:right-2 top-1 md:top-2 bottom-1 md:bottom-2 w-0.5 bg-gray-700 rounded-full opacity-50"></div>
                                              </div>
                                            </div>
                                          </CollapsibleContent>
                                        </Collapsible>

                                        {/* Test Results Section */}
                                        {submission.testResults && submission.testResults.length > 0 && (
                                          <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2 text-sm text-blue-800 font-medium mb-2">
                                              <TestTube2 className="h-4 w-4" />
                                              Test Results
                                            </div>
                                            <div className="text-sm text-blue-700 mb-2">
                                              Passed: {submission.testResults.filter(t => t.passed).length}/{submission.testResults.length} test cases
                                            </div>
                                            <Progress 
                                              value={(submission.testResults.filter(t => t.passed).length / submission.testResults.length) * 100} 
                                              className="h-2"
                                            />
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </ScrollArea>
                              
                              {/* Enhanced Navigation Controls for Submissions - Responsive */}
                              {submissions.length > 3 && (
                                <div className="mt-3 md:mt-4 p-2 md:p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-200/30 rounded-lg">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                      <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                        <span className="text-xs">Showing {submissions.length} submission{submissions.length > 1 ? 's' : ''}</span>
                                      </div>
                                      <div className="text-gray-400 hidden sm:inline">•</div>
                                      <span className="text-xs">
                                        Position: {selectedSubmissionIndex + 1} of {submissions.length}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs">
                                      <kbd className="px-1 md:px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↑↓</kbd>
                                      <span className="text-xs">Navigate</span>
                                      <div className="text-gray-400 hidden sm:inline">•</div>
                                      <kbd className="px-1 md:px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">Space</kbd>
                                      <span className="text-xs">Expand</span>
                                      <div className="text-gray-400 hidden md:inline">•</div>
                                      <kbd className="px-1 md:px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs hidden md:inline">Tab</kbd>
                                      <span className="text-xs hidden md:inline">Focus</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8 md:py-12">
                              <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50/30 border border-gray-200/50 rounded-xl max-w-sm mx-auto">
                                <div className="mb-3 md:mb-4">
                                  <div className="p-3 md:p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-fit mx-auto">
                                    <FileCode className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                                  </div>
                                </div>
                                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">No submissions yet</h3>
                                <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">Ready to solve this problem? Submit your solution to track your progress!</p>
                                <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-gray-500">
                                  <Zap className="h-3 w-3 md:h-4 md:w-4" />
                                  <span className="text-center">Tip: Use Ctrl+Shift+Enter to submit quickly</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center py-8 md:py-12">
                        <Card className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm border border-amber-200/60 shadow-lg max-w-sm md:max-w-md mx-auto">
                          <CardContent className="p-6 md:p-8">
                            <div className="mb-4 md:mb-6">
                              <div className="p-3 md:p-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full w-fit mx-auto">
                                <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-amber-600" />
                              </div>
                            </div>
                            <h3 className="text-base md:text-lg font-semibold text-amber-800 mb-2">Authentication Required</h3>
                            <p className="text-sm md:text-base text-amber-700 mb-4 md:mb-6">
                              Please log in to view your submission history and track your progress
                            </p>
                            <Button 
                              asChild 
                              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
                            >
                              <Link href="/auth" className="flex items-center gap-2">
                                <LogIn className="h-3 w-3 md:h-4 md:w-4" />
                                Log In to Continue
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
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
