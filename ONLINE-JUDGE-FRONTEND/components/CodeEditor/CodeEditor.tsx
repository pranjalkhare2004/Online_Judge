/**
 * PROFESSIONAL CODE EDITOR COMPONENT
 * 
 * A comprehensive code editor component with Monaco Editor integration,
 * multi-language support, test case management, and real-time execution.
 * Provides professional IDE-like experience for coding challenges.
 */

'use client';
/**
 * PROFESSIONAL CODE EDITOR COMPONENT
 * 
 * A comprehensive code editor component with Monaco Editor integration,
 * multi-language support, test case management, and real-time execution.
 * Provides professional IDE-like experience for coding challenges.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Send, 
  Copy, 
  Trash2, 
  Plus, 
  Download,
  Upload,
  Settings,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  MemoryStick,
  AlertCircle,
  Loader2,
  FileCode,
  TestTube2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { showErrorToast, showSuccessToast, showWarningToast, showInfoToast } from '@/lib/toast-utils';
import { executeCodeWithPolling, getSupportedLanguages, runProblem } from '@/lib/api-enhanced';
import { useAuth } from '@/contexts/auth-context';

// Language configurations with Monaco language mappings
const LANGUAGE_CONFIG = {
  cpp: {
    label: 'C++',
    monacoLanguage: 'cpp',
    fileExtension: '.cpp',
    template: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // Your code here
    
    return 0;
}`,
    sampleCode: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`
  },
  java: {
    label: 'Java',
    monacoLanguage: 'java',
    fileExtension: '.java',
    template: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
        
        sc.close();
    }
}`,
    sampleCode: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
        sc.close();
    }
}`
  },
  python: {
    label: 'Python',
    monacoLanguage: 'python',
    fileExtension: '.py',
    template: `# Your code here

if __name__ == "__main__":
    pass`,
    sampleCode: `# Read input and solve
a, b = map(int, input().split())
print(a + b)`
  },
  javascript: {
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    fileExtension: '.js',
    template: `// Your code here

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    // Process input
    rl.close();
});`,
    sampleCode: `const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    const [a, b] = input.split(' ').map(Number);
    console.log(a + b);
    rl.close();
});`
  }
};

// Editor themes
const EDITOR_THEMES = {
  'vs-dark': 'Dark',
  'light': 'Light',
  'hc-black': 'High Contrast'
};

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isCustom: boolean;
  isSelected: boolean;
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

interface CodeEditorProps {
  problemId?: string;
  initialCode?: string;
  initialLanguage?: string;
  sampleTestCases?: Array<{input: string, expectedOutput: string}>;
  onSubmit?: (code: string, language: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  problemId,
  initialCode,
  initialLanguage = 'cpp',
  sampleTestCases = [],
  onSubmit
}) => {
  const { user } = useAuth();
  const editorRef = useRef<any>(null);
  
  // Editor state
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode || LANGUAGE_CONFIG[initialLanguage as keyof typeof LANGUAGE_CONFIG]?.template || '');
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  
  // Test cases state
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  
  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [executionSummary, setExecutionSummary] = useState<{
    totalTests: number;
    passedTests: number;
    executionTime: number;
    memoryUsed: number;
  } | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('testcases');
  const [showSettings, setShowSettings] = useState(false);

  // Initialize test cases from sample data
  useEffect(() => {
    const initialTestCases: TestCase[] = sampleTestCases.map((tc, index) => ({
      id: `sample-${index}`,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isCustom: false,
      isSelected: true
    }));
    setTestCases(initialTestCases);
  }, [sampleTestCases]);

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage: string) => {
    const config = LANGUAGE_CONFIG[newLanguage as keyof typeof LANGUAGE_CONFIG];
    if (config) {
      setLanguage(newLanguage);
      if (!code || code === LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG]?.template) {
        setCode(config.template);
      }
    }
  }, [language, code]);

  // Handle editor mount
  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: fontSize,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      minimap: { enabled: false },
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
      automaticLayout: true
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunCode();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      handleSubmitCode();
    });
  }, [fontSize]);

  // Add custom test case
  const addCustomTestCase = useCallback(() => {
    if (!customInput.trim() || !customOutput.trim()) {
      showWarningToast('Both input and expected output are required');
      return;
    }

    const newTestCase: TestCase = {
      id: `custom-${Date.now()}`,
      input: customInput.trim(),
      expectedOutput: customOutput.trim(),
      isCustom: true,
      isSelected: true
    };

    setTestCases(prev => [...prev, newTestCase]);
    setCustomInput('');
    setCustomOutput('');
    
    showSuccessToast('Custom test case added successfully');
  }, [customInput, customOutput]);

  // Remove test case
  const removeTestCase = useCallback((testCaseId: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== testCaseId));
  }, []);

  // Toggle test case selection
  const toggleTestCase = useCallback((testCaseId: string) => {
    setTestCases(prev => prev.map(tc => 
      tc.id === testCaseId ? { ...tc, isSelected: !tc.isSelected } : tc
    ));
  }, []);

  // Copy code to clipboard
  const copyCode = useCallback(() => {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      navigator.clipboard.writeText(code).then(() => {
        showSuccessToast('Code copied to clipboard successfully');
      });
    }
  }, []);

  // Clear code
  const clearCode = useCallback(() => {
    const config = LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG];
    if (config && editorRef.current) {
      editorRef.current.setValue(config.template);
      setCode(config.template);
    }
  }, [language]);

  // Load sample code
  const loadSampleCode = useCallback(() => {
    const config = LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG];
    if (config && editorRef.current) {
      editorRef.current.setValue(config.sampleCode);
      setCode(config.sampleCode);
    }
  }, [language]);

  // Run code against selected test cases
  const handleRunCode = useCallback(async () => {
    if (!user) {
      showErrorToast('Please log in to run code');
      return;
    }

    const selectedTestCases = testCases.filter(tc => tc.isSelected);
    if (selectedTestCases.length === 0) {
      showWarningToast('Please select at least one test case to run');
      return;
    }

    if (!code.trim()) {
      toast({
        title: 'Empty Code',
        description: 'Please write some code before running',
        variant: 'destructive'
      });
      return;
    }

    setIsRunning(true);
    setExecutionResults([]);
    setExecutionSummary(null);
    setActiveTab('results');

    try {
      const testCaseData = selectedTestCases.map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput
      }));

      console.log('🚀 Executing code...', { language, testCases: testCaseData.length });
      
      // Use enhanced API with job polling
      const response = await executeCodeWithPolling(
        code,
        language,
        testCaseData,
        (progress) => {
          // Update progress - you could add a progress indicator here
          console.log(`Execution progress: ${progress.status}`, progress.message);
          if (progress.status === 'running') {
            showInfoToast(progress.message || 'Your code is being executed');
          }
        }
      );
      
      if (response.success && response.data) {
        const results: ExecutionResult[] = response.data.results.map((result: any, index: number) => ({
          testCaseId: selectedTestCases[index].id,
          input: result.input,
          expectedOutput: result.expectedOutput,
          actualOutput: result.actualOutput,
          status: result.passed ? 'Passed' : (result.error ? 'Error' : 'Failed'),
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
          error: result.error
        }));

        setExecutionResults(results);
        setExecutionSummary({
          totalTests: response.data.totalTests,
          passedTests: response.data.passedTests,
          executionTime: response.data.executionTime,
          memoryUsed: response.data.memoryUsed
        });

        const passedCount = results.filter(r => r.status === 'Passed').length;
        toast({
          title: `Execution Complete`,
          description: `${passedCount}/${results.length} test cases passed`,
          variant: passedCount === results.length ? 'default' : 'destructive'
        });
      } else {
        throw new Error(response.message || 'Execution failed');
      }
    } catch (error) {
      console.error('Code execution error:', error);
      toast({
        title: 'Execution Failed',
        description: error instanceof Error ? error.message : 'An error occurred while running your code',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  }, [user, code, language, testCases]);

  // Submit code (if onSubmit callback is provided)
  const handleSubmitCode = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to submit code',
        variant: 'destructive'
      });
      return;
    }

    if (!code.trim()) {
      toast({
        title: 'Empty Code',
        description: 'Please write some code before submitting',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(code, language);
      } else if (problemId) {
        // Run against problem test cases
        const response = await runProblem(code, language, problemId);
        if (response.success) {
          toast({
            title: 'Submission Successful',
            description: 'Your solution has been submitted successfully',
          });
        } else {
          throw new Error(response.message || 'Submission failed');
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'An error occurred while submitting your code',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, code, language, problemId, onSubmit]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-semibold">Code Editor</h1>
            </div>
            
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

            {/* Theme Selector */}
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EDITOR_THEMES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyCode}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearCode}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadSampleCode}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Sample
            </Button>

            <Button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isRunning ? 'Running...' : 'Run'}
            </Button>

            <Button
              onClick={handleSubmitCode}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col border-r">
          <div className="flex-1 p-4">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">
                  {LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG]?.label} Code
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-3rem)]">
                <Editor
                  height="100%"
                  language={LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG]?.monacoLanguage}
                  theme={theme}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  onMount={handleEditorMount}
                  options={{
                    fontSize: fontSize,
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    insertSpaces: true,
                    wordWrap: 'on'
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 flex flex-col bg-white dark:bg-gray-800">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 m-2">
              <TabsTrigger value="testcases" className="flex items-center gap-2">
                <TestTube2 className="h-4 w-4" />
                Test Cases
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Results
              </TabsTrigger>
            </TabsList>

            {/* Test Cases Tab */}
            <TabsContent value="testcases" className="flex-1 p-4 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                {/* Test Cases List */}
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-2">Test Cases</h3>
                  <ScrollArea className="h-64">
                    {testCases.map((testCase, index) => (
                      <Card key={testCase.id} className="mb-2">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={testCase.isSelected}
                                onChange={() => toggleTestCase(testCase.id)}
                                className="rounded"
                              />
                              <span className="text-sm font-medium">
                                {testCase.isCustom ? 'Custom' : 'Sample'} {index + 1}
                              </span>
                            </div>
                            {testCase.isCustom && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTestCase(testCase.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2 text-xs">
                            <div>
                              <Label className="text-xs text-gray-500">Input:</Label>
                              <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono max-h-16 overflow-y-auto">
                                {testCase.input}
                              </pre>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Expected:</Label>
                              <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono max-h-16 overflow-y-auto">
                                {testCase.expectedOutput}
                              </pre>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </ScrollArea>
                </div>

                {/* Add Custom Test Case */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Add Custom Test Case</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Input:</Label>
                      <Textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Enter test input..."
                        className="h-16 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Expected Output:</Label>
                      <Textarea
                        value={customOutput}
                        onChange={(e) => setCustomOutput(e.target.value)}
                        placeholder="Enter expected output..."
                        className="h-16 text-xs font-mono"
                      />
                    </div>
                    <Button
                      onClick={addCustomTestCase}
                      size="sm"
                      className="w-full flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Test Case
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="flex-1 p-4 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                {/* Execution Summary */}
                {executionSummary && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">Execution Summary</h3>
                        <Badge variant={executionSummary.passedTests === executionSummary.totalTests ? "default" : "destructive"}>
                          {executionSummary.passedTests}/{executionSummary.totalTests}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {executionSummary.executionTime}ms
                        </div>
                        <div className="flex items-center gap-1">
                          <MemoryStick className="h-3 w-3" />
                          {Math.round(executionSummary.memoryUsed)}KB
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Results List */}
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-2">Test Results</h3>
                  <ScrollArea className="h-full">
                    {executionResults.length > 0 ? (
                      executionResults.map((result, index) => (
                        <Card key={result.testCaseId} className="mb-2">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Test {index + 1}</span>
                              <div className="flex items-center gap-1">
                                {result.status === 'Passed' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : result.status === 'Error' ? (
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <Badge variant={result.status === 'Passed' ? "default" : "destructive"}>
                                  {result.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2 text-xs">
                              <div>
                                <Label className="text-xs text-gray-500">Input:</Label>
                                <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono max-h-12 overflow-y-auto">
                                  {result.input}
                                </pre>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Expected:</Label>
                                <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono max-h-12 overflow-y-auto">
                                  {result.expectedOutput}
                                </pre>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Actual:</Label>
                                <pre className={`p-2 rounded text-xs font-mono max-h-12 overflow-y-auto ${
                                  result.status === 'Passed' 
                                    ? 'bg-green-100 dark:bg-green-900/20' 
                                    : 'bg-red-100 dark:bg-red-900/20'
                                }`}>
                                  {result.actualOutput || result.error || 'No output'}
                                </pre>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{result.executionTime}ms</span>
                                <span>{Math.round(result.memoryUsed)}KB</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 text-sm py-8">
                        {isRunning ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Running code...
                          </div>
                        ) : (
                          'Run code to see results'
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
