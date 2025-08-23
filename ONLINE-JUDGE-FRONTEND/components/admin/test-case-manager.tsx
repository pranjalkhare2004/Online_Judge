'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Plus, Trash2, Edit2, TestTube, Eye, EyeOff } from 'lucide-react';

interface TestCase {
  _id: string;
  input: string;
  expectedOutput: string;
  isPublic: boolean;
  description?: string;
  points: number;
  timeLimit?: number;
  memoryLimit?: number;
  createdAt: string;
}

interface TestCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: string;
  testCase?: TestCase | null;
  onSuccess: () => void;
}

export function TestCaseDialog({ isOpen, onClose, problemId, testCase, onSuccess }: TestCaseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    input: '',
    expectedOutput: '',
    isPublic: false,
    description: '',
    points: 1,
    timeLimit: '',
    memoryLimit: '',
  });

  const isEditing = !!testCase;

  useEffect(() => {
    if (testCase) {
      setFormData({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        isPublic: testCase.isPublic,
        description: testCase.description || '',
        points: testCase.points,
        timeLimit: testCase.timeLimit?.toString() || '',
        memoryLimit: testCase.memoryLimit?.toString() || '',
      });
    } else {
      setFormData({
        input: '',
        expectedOutput: '',
        isPublic: false,
        description: '',
        points: 1,
        timeLimit: '',
        memoryLimit: '',
      });
    }
  }, [testCase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        problemId,
        ...formData,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
        memoryLimit: formData.memoryLimit ? parseInt(formData.memoryLimit) : null,
      };

      const url = isEditing ? `/admin/testcases/${testCase._id}` : '/admin/testcases';
      const method = isEditing ? 'put' : 'post';
      
      const response = await api[method](url, payload);
      
      if (response.data.success) {
        toast({
          title: isEditing ? 'Test Case Updated' : 'Test Case Created',
          description: response.data.message,
        });
        onSuccess();
        onClose();
      }
    } catch (error: unknown) {
      console.error('Failed to save test case:', error);
      const message = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to save test case';
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-2xl">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <TestTube className="h-5 w-5" />
            {isEditing ? 'Edit Test Case' : 'Create Test Case'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Points</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
              />
            </div>
            
            <div className="space-y-2 flex items-center justify-between">
              <label className="text-sm font-medium">Public Test Case</label>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this test case..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Limit (ms) - Optional</label>
              <Input
                type="number"
                min={100}
                max={10000}
                value={formData.timeLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: e.target.value }))}
                placeholder="Override problem time limit"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Memory Limit (MB) - Optional</label>
              <Input
                type="number"
                min={64}
                max={1024}
                value={formData.memoryLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, memoryLimit: e.target.value }))}
                placeholder="Override problem memory limit"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Input *</label>
            <Textarea
              required
              value={formData.input}
              onChange={(e) => setFormData(prev => ({ ...prev, input: e.target.value }))}
              placeholder="Test case input data..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Output *</label>
            <Textarea
              required
              value={formData.expectedOutput}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedOutput: e.target.value }))}
              placeholder="Expected output for this input..."
              rows={6}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEditing ? 'Update Test Case' : 'Create Test Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface TestCaseManagerProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: string;
  problemTitle: string;
}

export function TestCaseManager({ isOpen, onClose, problemId, problemTitle }: TestCaseManagerProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTestCaseDialog, setShowTestCaseDialog] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);

  const fetchTestCases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/problems/${problemId}/testcases`);
      if (response.data.success) {
        setTestCases(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch test cases:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load test cases',
      });
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    if (isOpen && problemId) {
      fetchTestCases();
    }
  }, [isOpen, problemId, fetchTestCases]);

  const handleDeleteTestCase = async (testCaseId: string) => {
    try {
      const response = await api.delete(`/admin/testcases/${testCaseId}`);
      if (response.data.success) {
        setTestCases(prev => prev.filter(tc => tc._id !== testCaseId));
        toast({
          title: 'Test Case Deleted',
          description: 'Test case deleted successfully',
        });
      }
    } catch (error) {
      console.error('Failed to delete test case:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete test case',
      });
    }
  };

  const handleEditTestCase = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setShowTestCaseDialog(true);
  };

  const handleCreateTestCase = () => {
    setSelectedTestCase(null);
    setShowTestCaseDialog(true);
  };

  const handleTestCaseSuccess = () => {
    fetchTestCases();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-2xl">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <TestTube className="h-5 w-5" />
              Test Cases - {problemTitle}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Total: {testCases.length}
                </Badge>
                <Badge variant="secondary">
                  Public: {testCases.filter(tc => tc.isPublic).length}
                </Badge>
                <Badge variant="secondary">
                  Private: {testCases.filter(tc => !tc.isPublic).length}
                </Badge>
              </div>
              <Button onClick={handleCreateTestCase}>
                <Plus className="h-4 w-4 mr-2" />
                Add Test Case
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Input Preview</TableHead>
                        <TableHead>Output Preview</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        [...Array(3)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                          </TableRow>
                        ))
                      ) : testCases.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No test cases found. Add some test cases to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        testCases.map((testCase, index) => (
                          <TableRow key={testCase._id}>
                            <TableCell>
                              <Badge variant={testCase.isPublic ? 'default' : 'secondary'} className="flex items-center gap-1">
                                {testCase.isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                {testCase.isPublic ? 'Public' : 'Private'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">{testCase.points}</TableCell>
                            <TableCell>
                              {testCase.description || (
                                <span className="text-muted-foreground italic">Test Case {index + 1}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded max-w-24 block truncate">
                                {testCase.input.substring(0, 30)}
                                {testCase.input.length > 30 && '...'}
                              </code>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded max-w-24 block truncate">
                                {testCase.expectedOutput.substring(0, 30)}
                                {testCase.expectedOutput.length > 30 && '...'}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTestCase(testCase)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteTestCase(testCase._id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TestCaseDialog
        isOpen={showTestCaseDialog}
        onClose={() => setShowTestCaseDialog(false)}
        problemId={problemId}
        testCase={selectedTestCase}
        onSuccess={handleTestCaseSuccess}
      />
    </>
  );
}
