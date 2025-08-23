'use client';

/**
 * MODERN ENHANCED PROBLEM SOLVING UI LAYOUT
 * 
 * A sophisticated two-column responsive layout implementing the complete
 * modern UI specification with rich formatting, interactive elements,
 * advanced state management, and comprehensive visual effects.
 */

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
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { showErrorToast, showSuccessToast, showWarningToast, showInfoToast } from '@/lib/toast-utils';
import { formatExecutionTimeShort, formatMemoryUsage } from '@/lib/format-utils';
import { apiClient } from '@/lib/api-client';
import enhancedApiClient from '@/lib/enhanced-api-client';
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
  Code2,
  History,
  Terminal,
  FileCode,
  Loader2,
  RefreshCw,
  Users,
  Trophy,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Eye,
  EyeOff,
  Zap,
  Star,
  TrendingUp,
  Info,
  BookOpen,
  Calculator,
  Database,
  Cpu,
  Globe,
  Share2,
  Download,
  Upload,
  Settings,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  Palette,
  Monitor,
  Sun,
  Moon,
  TestTube2,
  Hash
} from 'lucide-react';
import Link from 'next/link';
import { Editor } from '@monaco-editor/react';
import { SubmissionStatusIndicator } from '@/components/submissions/SubmissionStatusIndicator';
import { cn } from '@/lib/utils';

// Enhanced Type Definitions
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
  hints?: string[];
  approach?: string[];
  complexity?: {
    time: string;
    space: string;
  };
}

interface FlowState {
  current: 'initial' | 'running' | 'results' | 'submitting' | 'submitted';
  isLoading: boolean;
  progress: number;
  message: string;
}

interface ExecutionResult {
  testCaseId: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  status: 'Passed' | 'Failed' | 'Error' | 'Timeout';
  executionTime: number;
  memoryUsed: number;
  error?: string;
}

interface UIState {
  leftPanelExpanded: boolean;
  rightPanelExpanded: boolean;
  hintsExpanded: boolean;
  constraintsExpanded: boolean;
  approachExpanded: boolean;
  isBookmarked: boolean;
  showComplexity: boolean;
  editorTheme: 'vs-dark' | 'light' | 'hc-black';
  editorFontSize: number;
  showMinimap: boolean;
  isFullscreen: boolean;
}

const ModernEnhancedProblemPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const editorRef = useRef<any>(null);

  // Core State
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Code Editor State
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [activeTab, setActiveTab] = useState('code');

  // Execution State
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);

  // Flow State Management
  const [flowState, setFlowState] = useState<FlowState>({
    current: 'initial',
    isLoading: false,
    progress: 0,
    message: 'Ready to start coding'
  });

  // UI State
  const [uiState, setUIState] = useState<UIState>({
    leftPanelExpanded: true,
    rightPanelExpanded: true,
    hintsExpanded: false,
    constraintsExpanded: true,
    approachExpanded: false,
    isBookmarked: false,
    showComplexity: false,
    editorTheme: 'vs-dark',
    editorFontSize: 14,
    showMinimap: false,
    isFullscreen: false,
  });

  // Language configurations
  const LANGUAGE_CONFIG = {
    cpp: {
      label: 'C++',
      template: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // Your solution here
    
    return 0;
}`,
      monacoLanguage: 'cpp'
    },
    python: {
      label: 'Python',
      template: `# Your solution here

def main():
    pass

if __name__ == "__main__":
    main()`,
      monacoLanguage: 'python'
    },
    javascript: {
      label: 'JavaScript',
      template: `// Your solution here

function main() {
    
}

main();`,
      monacoLanguage: 'javascript'
    },
    java: {
      label: 'Java',
      template: `public class Solution {
    public static void main(String[] args) {
        // Your solution here
        
    }
}`,
      monacoLanguage: 'java'
    }
  };

  // Load problem data
  useEffect(() => {
    const loadProblem = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const response = await apiClient.getProblem(slug);
        if (response.success && response.data) {
          setProblem(response.data);
          setCode(LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG]?.template || '');
        } else {
          throw new Error(response.message || 'Failed to load problem');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load problem';
        setError(errorMessage);
        showErrorToast(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadProblem();
  }, [slug, language]);

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
    const config = LANGUAGE_CONFIG[newLanguage as keyof typeof LANGUAGE_CONFIG];
    if (config && (!code || code === LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG]?.template)) {
      setCode(config.template);
    }
  }, [language, code]);

  // Flow state management functions
  const updateFlowState = useCallback((updates: Partial<FlowState>) => {
    setFlowState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle run code
  const handleRunCode = useCallback(async () => {
    if (!problem || !code.trim()) {
      showWarningToast('Please write some code first');
      return;
    }

    // Update flow state to running
    updateFlowState({
      current: 'running',
      isLoading: true,
      progress: 10,
      message: 'Preparing execution environment...'
    });

    setActiveTab('results');

    try {
      // Simulate progressive loading
      await new Promise(resolve => setTimeout(resolve, 500));
      updateFlowState({ progress: 30, message: 'Compiling code...' });

      await new Promise(resolve => setTimeout(resolve, 500));
      updateFlowState({ progress: 60, message: 'Running test cases...' });

      const testCases = problem.examples.map((example, index) => ({
        input: example.input,
        expectedOutput: example.output
      }));

      if (customInput.trim()) {
        testCases.push({ input: customInput, expectedOutput: 'Custom test case' });
      }

      const response = await enhancedApiClient.executeCode(
        code,
        language,
        testCases
      );

      updateFlowState({ progress: 90, message: 'Processing results...' });

      if (response.success && response.data) {
        const results: ExecutionResult[] = response.data.results.map((result: any, index: number) => ({
          testCaseId: `test-${index}`,
          input: result.input,
          expectedOutput: result.expectedOutput,
          actualOutput: result.actualOutput,
          status: result.passed ? 'Passed' : 'Failed',
          executionTime: result.executionTime || 0,
          memoryUsed: result.memoryUsed || 0,
          error: result.error
        }));

        setExecutionResults(results);
        
        // Update flow state to results
        updateFlowState({
          current: 'results',
          isLoading: false,
          progress: 100,
          message: `Completed: ${response.data.passedTests}/${response.data.totalTests} test cases passed`
        });

        if (response.data.passedTests === response.data.totalTests) {
          showSuccessToast(`All test cases passed! 🎉`);
        } else {
          showWarningToast(`${response.data.passedTests}/${response.data.totalTests} test cases passed`);
        }
      } else {
        throw new Error(response.message || 'Execution failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Code execution failed';
      updateFlowState({
        current: 'initial',
        isLoading: false,
        progress: 0,
        message: 'Execution failed'
      });
      showErrorToast(errorMessage);
    }
  }, [problem, code, language, customInput, updateFlowState]);

  // Handle submit code
  const handleSubmitCode = useCallback(async () => {
    if (!user) {
      showWarningToast('Please login to submit your solution');
      return;
    }

    if (!problem || !code.trim()) {
      showWarningToast('Please write some code first');
      return;
    }

    // Update flow state to submitting
    updateFlowState({
      current: 'submitting',
      isLoading: true,
      progress: 20,
      message: 'Preparing submission...'
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      updateFlowState({ progress: 50, message: 'Submitting to judge...' });

      const response = await enhancedApiClient.submitSolution(
        problem._id,
        code,
        language
      );

      updateFlowState({ progress: 80, message: 'Processing submission...' });

      if (response.success && response.data) {
        setCurrentSubmissionId(response.data.submissionId);
        setActiveTab('submissions');
        
        // Update flow state to submitted
        updateFlowState({
          current: 'submitted',
          isLoading: false,
          progress: 100,
          message: 'Submission received - tracking status...'
        });

        showSuccessToast('Code submitted successfully! 🚀');
        
        // Refresh submissions
        loadSubmissions();
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Submission failed';
      updateFlowState({
        current: 'initial',
        isLoading: false,
        progress: 0,
        message: 'Submission failed'
      });
      showErrorToast(errorMessage);
    }
  }, [user, problem, code, language, updateFlowState]);

  // Load submissions
  const loadSubmissions = useCallback(async () => {
    if (!user || !problem) return;
    
    try {
      const response = await enhancedApiClient.getUserSubmissions(1, 10, problem._id);
      if (response.success && response.data) {
        setSubmissions(response.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    }
  }, [user, problem]);

  // Load submissions on mount
  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // UI helper functions
  const toggleUIState = useCallback((key: keyof UIState) => {
    setUIState(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  // Copy code function
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    showSuccessToast('Code copied to clipboard');
  }, [code]);

  // Get difficulty styling
  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Enhanced loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-6rem)]">
            {/* Left Panel Skeleton */}
            <div className="space-y-6">
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
              
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>

            {/* Right Panel Skeleton */}
            <div className="space-y-4">
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Problem Not Found</h3>
            <p className="text-gray-600 mb-4">{error || 'The requested problem could not be loaded.'}</p>
            <Button onClick={() => router.push('/problems')} className="w-full">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Problems
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main render
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Enhanced Header with Glassmorphism */}
      <div className="backdrop-blur-md bg-white/80 border-b border-white/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/problems')}
                className="flex items-center gap-2 hover:bg-white/50 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Problems
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <Badge className={cn("border", getDifficultyStyle(problem.difficulty))}>
                  {problem.difficulty}
                </Badge>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {problem.title}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Action Buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleUIState('isBookmarked')}
                className="hover:bg-white/50 transition-all duration-200"
              >
                {uiState.isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-white/50 transition-all duration-200"
              >
                <Share2 className="h-4 w-4" />
              </Button>

              {/* Problem Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{problem.acceptanceRate}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{problem.totalSubmissions}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flow State Progress Bar */}
          {flowState.isLoading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{flowState.message}</span>
                <span className="text-sm text-gray-500">{flowState.progress}%</span>
              </div>
              <Progress value={flowState.progress} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="container mx-auto px-4 py-6 max-w-none">
        <div className={cn(
          "transition-all duration-300",
          uiState.isFullscreen 
            ? "flex flex-col" 
            : "flex flex-col xl:flex-row gap-6"
        )}>
          
          {/* 📋 LEFT PANEL - Problem Information */}
          {(!uiState.isFullscreen || !uiState.rightPanelExpanded) && (
            <div className={cn(
              "space-y-6 transition-all duration-300",
              uiState.isFullscreen ? "w-full" : "w-full xl:w-[40%] xl:flex-shrink-0",
              !uiState.leftPanelExpanded && "xl:w-[40%]"
            )}>
              
              {/* Problem Description Card with Enhanced Styling */}
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Problem Description
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleUIState('leftPanelExpanded')}
                      className="hover:bg-white/50"
                    >
                      {uiState.leftPanelExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-96">
                    <div 
                      className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: problem.description.replace(/\n/g, '<br/>') 
                      }}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Interactive Examples with Enhanced Visualization */}
              {problem.examples && problem.examples.length > 0 && (
                <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-green-600" />
                      Examples
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {problem.examples.map((example, index) => (
                      <div 
                        key={index} 
                        className="border rounded-xl p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 hover:from-blue-50 hover:to-indigo-50/50 transition-all duration-200"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              Input:
                            </Label>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(example.input);
                                showSuccessToast('Input copied');
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="p-3 bg-white rounded-lg border font-mono text-sm shadow-inner">
                            {example.input}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Terminal className="h-4 w-4" />
                              Output:
                            </Label>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(example.output);
                                showSuccessToast('Output copied');
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="p-3 bg-white rounded-lg border font-mono text-sm shadow-inner">
                            {example.output}
                          </div>
                          
                          {example.explanation && (
                            <>
                              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4" />
                                Explanation:
                              </Label>
                              <p className="text-sm text-gray-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                                {example.explanation}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Expandable Constraints Section */}
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <Collapsible 
                  open={uiState.constraintsExpanded} 
                  onOpenChange={() => toggleUIState('constraintsExpanded')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-white/50 transition-colors duration-200">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-purple-600" />
                          Constraints
                        </div>
                        {uiState.constraintsExpanded ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      {problem.constraints && problem.constraints.length > 0 ? (
                        <ul className="space-y-2">
                          {problem.constraints.map((constraint, index) => (
                            <li 
                              key={index} 
                              className="text-sm text-gray-700 flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                              <Target className="h-4 w-4 mt-0.5 text-purple-500 flex-shrink-0" />
                              <span dangerouslySetInnerHTML={{ __html: constraint }} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No specific constraints provided</p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Expandable Hints Section */}
              {problem.hints && problem.hints.length > 0 && (
                <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <Collapsible 
                    open={uiState.hintsExpanded} 
                    onOpenChange={() => toggleUIState('hintsExpanded')}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-white/50 transition-colors duration-200">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-600" />
                            Hints ({problem.hints.length})
                            {uiState.hintsExpanded && <span className="text-xs text-gray-500 ml-2">Click to hide</span>}
                          </div>
                          {uiState.hintsExpanded ? 
                            <EyeOff className="h-4 w-4" /> : 
                            <Eye className="h-4 w-4" />
                          }
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-3">
                        {problem.hints.map((hint, index) => (
                          <div 
                            key={index}
                            className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-semibold text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full flex-shrink-0">
                                {index + 1}
                              </span>
                              <p className="text-sm text-gray-700">{hint}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}

              {/* Tags and Metadata */}
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Tags</Label>
                      <div className="flex flex-wrap gap-1">
                        {problem.tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-xs hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200 cursor-pointer"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Time Limit:
                        </span>
                        <span className="font-mono">{problem.timeLimit}ms</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <MemoryStick className="h-4 w-4" />
                          Memory Limit:
                        </span>
                        <span className="font-mono">{problem.memoryLimit}MB</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 💻 RIGHT PANEL - Code Editor & Testing */}
          <div className={cn(
            "space-y-4 transition-all duration-300 min-w-0",
            uiState.isFullscreen ? "w-full" : "w-full xl:w-[60%] xl:flex-1"
          )}>
            <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 h-fit min-w-0 overflow-visible relative z-20">
              <CardHeader className="pb-4 relative z-30">
                <div className="flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Code2 className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                    <span className="font-semibold truncate">Code Editor</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Language Selector */}
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Editor Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyCode}
                      className="hover:bg-white/50 flex-shrink-0"
                      title="Copy Code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleUIState('isFullscreen')}
                      className="hover:bg-white/50 flex-shrink-0"
                      title={uiState.isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      {uiState.isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Monaco Editor */}
                <div className="border rounded-lg overflow-hidden shadow-inner relative z-10 max-w-full">
                  <Editor
                    height={uiState.isFullscreen ? "60vh" : "400px"}
                    theme={uiState.editorTheme}
                    language={LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG]?.monacoLanguage}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    onMount={(editor, monaco) => {
                      editorRef.current = editor;
                      
                      // Add keyboard shortcuts - Ctrl+Enter to run, Ctrl+Shift+Enter to submit
                      editor.addCommand(
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                        () => handleRunCode()
                      );
                      
                      editor.addCommand(
                        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
                        () => handleSubmitCode()
                      );
                    }}
                    options={{
                      fontSize: uiState.editorFontSize,
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      minimap: { enabled: uiState.showMinimap },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      insertSpaces: true,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      renderLineHighlight: 'line',
                      selectOnLineNumbers: true,
                      roundedSelection: false,
                      readOnly: false,
                      cursorStyle: 'line',
                      scrollbar: {
                        horizontal: 'auto',
                        vertical: 'auto',
                        handleMouseWheel: true
                      },
                      overviewRulerBorder: false,
                      hideCursorInOverviewRuler: true,
                      overviewRulerLanes: 0
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleRunCode}
                      disabled={flowState.isLoading}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {flowState.current === 'running' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Run Code
                    </Button>

                    <Button
                      onClick={handleSubmitCode}
                      disabled={flowState.isLoading || !user}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {flowState.current === 'submitting' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Submit
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500">
                    Ctrl+Enter to run • Ctrl+Shift+Enter to submit
                  </div>
                </div>

                {/* Flow State Indicator */}
                {flowState.current !== 'initial' && (
                  <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                    <div className="flex items-center gap-2">
                      {flowState.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {flowState.message}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Tabbed Interface */}
            <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 relative z-10">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <CardHeader className="pb-2">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-100/50">
                    <TabsTrigger value="code" className="flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      Test Cases
                    </TabsTrigger>
                    <TabsTrigger value="results" className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      Results
                    </TabsTrigger>
                    <TabsTrigger value="submissions" className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Submissions
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Custom
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="relative z-10 overflow-visible">
                  {/* Test Cases Tab */}
                  <TabsContent value="code" className="space-y-4 relative z-10">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <TestTube2 className="h-4 w-4" />
                        Sample Test Cases
                      </h4>
                      
                      {problem.examples.map((example, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50/50 hover:bg-blue-50/50 transition-colors duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-medium text-gray-600">Input</Label>
                              <div className="mt-1 p-2 bg-white rounded border font-mono text-sm shadow-inner">
                                {example.input}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-600">Expected Output</Label>
                              <div className="mt-1 p-2 bg-white rounded border font-mono text-sm shadow-inner">
                                {example.output}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Results Tab with Enhanced Visualization */}
                  <TabsContent value="results" className="space-y-4">
                    {executionResults.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Execution Results
                          </h4>
                          <div className="text-sm text-gray-600">
                            {executionResults.filter(r => r.status === 'Passed').length}/{executionResults.length} passed
                          </div>
                        </div>

                        {executionResults.map((result, index) => (
                          <div 
                            key={result.testCaseId}
                            className={cn(
                              "border rounded-lg p-4 transition-all duration-200",
                              result.status === 'Passed' 
                                ? "bg-green-50/50 border-green-200 hover:bg-green-50" 
                                : "bg-red-50/50 border-red-200 hover:bg-red-50"
                            )}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge className={cn(
                                  result.status === 'Passed' 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                                )}>
                                  {result.status === 'Passed' ? (
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                  ) : (
                                    <XCircle className="h-3 w-3 mr-1" />
                                  )}
                                  Test Case {index + 1}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {result.executionTime}ms
                                </span>
                                <span className="flex items-center gap-1">
                                  <MemoryStick className="h-3 w-3" />
                                  {Math.round(result.memoryUsed / 1024)}KB
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Input</Label>
                                <div className="mt-1 p-2 bg-white rounded border font-mono text-xs">
                                  {result.input}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Expected</Label>
                                <div className="mt-1 p-2 bg-white rounded border font-mono text-xs">
                                  {result.expectedOutput}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Your Output</Label>
                                <div className={cn(
                                  "mt-1 p-2 rounded border font-mono text-xs",
                                  result.status === 'Passed' ? "bg-green-50" : "bg-red-50"
                                )}>
                                  {result.actualOutput || (result.error ? 'Error' : 'No output')}
                                </div>
                              </div>
                            </div>

                            {result.error && (
                              <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                                <strong>Error:</strong> {result.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No execution results yet</p>
                        <p className="text-sm">Click "Run Code" to see test results here</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Submissions Tab with Real-time Tracking */}
                  <TabsContent value="submissions" className="space-y-4 relative z-10 overflow-visible">
                    {user ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Your Submissions
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadSubmissions}
                            className="hover:bg-white/50"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>

                        {currentSubmissionId && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h5 className="font-medium text-blue-800 mb-2">Latest Submission</h5>
                            <SubmissionStatusIndicator
                              submissionId={currentSubmissionId}
                              initialStatus="Pending"
                              showDetails={true}
                              showProgress={true}
                              autoRefresh={true}
                            />
                          </div>
                        )}

                        {/* 🚀 ENHANCED SUBMISSION HISTORY */}
                        {submissions.length > 0 ? (
                          <div className="space-y-4 overflow-visible">
                            {submissions.map((submission, index) => (
                              <Card 
                                key={submission._id}
                                className={cn(
                                  "group hover:shadow-lg transition-all duration-300 border-l-4 overflow-visible",
                                  submission.status === 'ACCEPTED' 
                                    ? "border-l-green-500 bg-gradient-to-r from-green-50/80 to-white hover:from-green-50 hover:to-green-50/30" 
                                    : submission.status === 'WRONG_ANSWER'
                                    ? "border-l-red-500 bg-gradient-to-r from-red-50/80 to-white hover:from-red-50 hover:to-red-50/30"
                                    : submission.status === 'TIME_LIMIT_EXCEEDED'
                                    ? "border-l-yellow-500 bg-gradient-to-r from-yellow-50/80 to-white hover:from-yellow-50 hover:to-yellow-50/30"
                                    : submission.status === 'REJECTED'
                                    ? "border-l-red-500 bg-gradient-to-r from-red-50/80 to-white hover:from-red-50 hover:to-red-50/30"
                                    : "border-l-gray-400 bg-gradient-to-r from-gray-50/80 to-white hover:from-gray-50 hover:to-gray-50/30"
                                )}
                              >
                                <CardContent className="p-5">
                                  {/* Header Section */}
                                  <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      {/* Status Badge with Icon */}
                                      <Badge className={cn(
                                        "relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium border shadow-sm",
                                        submission.status === 'ACCEPTED' 
                                          ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200" 
                                          : submission.status === 'WRONG_ANSWER'
                                          ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
                                          : submission.status === 'TIME_LIMIT_EXCEEDED'
                                          ? "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                                          : submission.status === 'REJECTED'
                                          ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
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

                                      {/* Submission Number */}
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Hash className="h-4 w-4" />
                                        <span className="font-mono">#{submissions.length - index}</span>
                                      </div>

                                      {/* Language Badge */}
                                      <Badge variant="outline" className="flex items-center gap-1.5 bg-blue-50/80 text-blue-700 border-blue-200">
                                        <Code2 className="h-3.5 w-3.5" />
                                        {submission.language}
                                      </Badge>
                                    </div>

                                    {/* Timestamp and Actions */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      <div className="text-xs text-gray-500 text-right">
                                        <div className="flex items-center gap-1 mb-1">
                                          <Clock className="h-3 w-3" />
                                          {new Date(submission.createdAt).toLocaleTimeString()}
                                        </div>
                                        <div className="text-gray-400">
                                          {new Date(submission.createdAt).toLocaleDateString()}
                                        </div>
                                      </div>

                                      {/* Quick Actions */}
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 hover:bg-blue-100"
                                          onClick={() => {
                                            navigator.clipboard.writeText(submission.code || '');
                                            showSuccessToast('Code copied to clipboard!');
                                          }}
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 hover:bg-blue-100"
                                          onClick={() => setCode(submission.code || '')}
                                        >
                                          <Upload className="h-4 w-4" />
                                        </Button>
                                      </div>
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

                                  {/* Expandable Code Section */}
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
                                      <div className="mt-3 p-4 bg-gray-900 rounded-lg border">
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2 text-gray-300">
                                            <Terminal className="h-4 w-4" />
                                            <span className="text-sm font-medium">{submission.language}</span>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                                            onClick={() => {
                                              navigator.clipboard.writeText(submission.code || '');
                                              showSuccessToast('Code copied!');
                                            }}
                                          >
                                            <Copy className="h-3 w-3 mr-1" />
                                            Copy
                                          </Button>
                                        </div>
                                        <pre className="text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap break-words">
                                          <code>{submission.code || 'No code available'}</code>
                                        </pre>
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>

                                  {/* Test Results Section (if available) */}
                                  {submission.testResults && (
                                    <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                                      <div className="flex items-center gap-2 text-sm text-blue-800 font-medium mb-2">
                                        <TestTube2 className="h-4 w-4" />
                                        Test Results
                                      </div>
                                      <div className="text-sm text-blue-700">
                                        Passed: {submission.testResults.passed}/{submission.testResults.total} test cases
                                      </div>
                                      <Progress 
                                        value={(submission.testResults.passed / submission.testResults.total) * 100} 
                                        className="mt-2 h-2"
                                      />
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No submissions yet</p>
                            <p className="text-sm">Submit your solution to see it here</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Please login to view your submissions</p>
                        <Button className="mt-4" onClick={() => router.push('/auth')}>
                          Login
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Custom Test Case Tab */}
                  <TabsContent value="custom" className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Custom Test Case
                      </h4>
                      
                      <div>
                        <Label htmlFor="custom-input">Custom Input</Label>
                        <Textarea
                          id="custom-input"
                          placeholder="Enter your custom input here..."
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          className="mt-1 font-mono"
                          rows={5}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleRunCode}
                          disabled={!customInput.trim() || flowState.isLoading}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Run with Custom Input
                        </Button>
                      </div>

                      {/* Editor Settings */}
                      <Separator />
                      
                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-700">Editor Settings</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Theme</Label>
                            <Select 
                              value={uiState.editorTheme} 
                              onValueChange={(value) => updateUIState({ editorTheme: value as any })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vs-dark">Dark</SelectItem>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="hc-black">High Contrast</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Font Size</Label>
                            <Select 
                              value={uiState.editorFontSize.toString()} 
                              onValueChange={(value) => updateUIState({ editorFontSize: parseInt(value) })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="12">12px</SelectItem>
                                <SelectItem value="14">14px</SelectItem>
                                <SelectItem value="16">16px</SelectItem>
                                <SelectItem value="18">18px</SelectItem>
                                <SelectItem value="20">20px</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default ModernEnhancedProblemPage;
