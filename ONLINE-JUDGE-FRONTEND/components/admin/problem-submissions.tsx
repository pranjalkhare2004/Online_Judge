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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Users, 
  Eye, 
  Code, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Submission {
  _id: string;
  userId: {
    _id: string;
    name: string;
    username: string;
    email: string;
  };
  problemId: {
    _id: string;
    title: string;
    slug: string;
  };
  language: string;
  code: string;
  status: 'Pending' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  executionTime?: number;
  memoryUsed?: number;
  testCasesPassed?: number;
  totalTestCases?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface SubmissionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
}

function SubmissionDetailsDialog({ isOpen, onClose, submission }: SubmissionDetailsDialogProps) {
  if (!submission) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-500';
      case 'Wrong Answer':
        return 'bg-red-500';
      case 'Time Limit Exceeded':
        return 'bg-orange-500';
      case 'Memory Limit Exceeded':
        return 'bg-yellow-500';
      case 'Runtime Error':
        return 'bg-purple-500';
      case 'Compilation Error':
        return 'bg-pink-500';
      case 'Pending':
      case 'Running':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'Wrong Answer':
      case 'Runtime Error':
      case 'Compilation Error':
        return <XCircle className="h-4 w-4" />;
      case 'Time Limit Exceeded':
      case 'Memory Limit Exceeded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Pending':
      case 'Running':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-2xl">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <Code className="h-5 w-5" />
            Submission Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Submission Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg">Submission Info</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={`${getStatusColor(submission.status)} text-white flex items-center gap-1`}>
                      {getStatusIcon(submission.status)}
                      {submission.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Language:</span>
                    <Badge variant="outline">{submission.language}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Submitted:</span>
                    <span className="text-sm">{formatDistanceToNow(new Date(submission.createdAt))} ago</span>
                  </div>
                  {submission.executionTime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Execution Time:</span>
                      <span className="text-sm font-mono">{submission.executionTime}ms</span>
                    </div>
                  )}
                  {submission.memoryUsed && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Memory Used:</span>
                      <span className="text-sm font-mono">{submission.memoryUsed}MB</span>
                    </div>
                  )}
                  {submission.testCasesPassed !== undefined && submission.totalTestCases && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Test Cases:</span>
                      <span className="text-sm font-mono">
                        {submission.testCasesPassed}/{submission.totalTestCases}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg">Problem & User</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Problem:</span>
                    <span className="text-sm font-medium">{submission.problemId.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Problem Slug:</span>
                    <code className="text-sm">{submission.problemId.slug}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">User:</span>
                    <span className="text-sm font-medium">{submission.userId.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Username:</span>
                    <code className="text-sm">@{submission.userId.username}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm">{submission.userId.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Message */}
          {submission.errorMessage && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-3 text-red-600">Error Message</h3>
                <pre className="text-sm bg-red-50 border border-red-200 rounded p-3 overflow-x-auto text-red-800">
                  {submission.errorMessage}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Code */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-3">Source Code</h3>
              <div className="relative">
                <pre className="text-sm bg-muted border rounded p-4 overflow-x-auto max-h-96">
                  <code>{submission.code}</code>
                </pre>
                <Badge 
                  variant="outline" 
                  className="absolute top-2 right-2 bg-background"
                >
                  {submission.language}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ProblemSubmissionsProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: string;
  problemTitle: string;
}

export function ProblemSubmissions({ isOpen, onClose, problemId, problemTitle }: ProblemSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        problemId,
        limit: '50',
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (languageFilter !== 'all') params.append('language', languageFilter);
      
      const response = await api.get(`/admin/submissions?${params.toString()}`);
      if (response.data.success) {
        setSubmissions(response.data.data.submissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load submissions',
      });
    } finally {
      setLoading(false);
    }
  }, [problemId, searchTerm, statusFilter, languageFilter]);

  useEffect(() => {
    if (isOpen && problemId) {
      fetchSubmissions();
    }
  }, [isOpen, problemId, fetchSubmissions]);

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-500';
      case 'Wrong Answer':
        return 'bg-red-500';
      case 'Time Limit Exceeded':
        return 'bg-orange-500';
      case 'Memory Limit Exceeded':
        return 'bg-yellow-500';
      case 'Runtime Error':
        return 'bg-purple-500';
      case 'Compilation Error':
        return 'bg-pink-500';
      case 'Pending':
      case 'Running':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'Wrong Answer':
      case 'Runtime Error':
      case 'Compilation Error':
        return <XCircle className="h-4 w-4" />;
      case 'Time Limit Exceeded':
      case 'Memory Limit Exceeded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Pending':
      case 'Running':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const uniqueLanguages = [...new Set(submissions.map(s => s.language))];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-2xl">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <Users className="h-5 w-5" />
              Problem Submissions - {problemTitle}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user name or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Wrong Answer">Wrong Answer</SelectItem>
                  <SelectItem value="Time Limit Exceeded">TLE</SelectItem>
                  <SelectItem value="Memory Limit Exceeded">MLE</SelectItem>
                  <SelectItem value="Runtime Error">Runtime Error</SelectItem>
                  <SelectItem value="Compilation Error">Compile Error</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {uniqueLanguages.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge variant="outline" className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {submissions.length} submissions
              </Badge>
            </div>

            {/* Submissions Table */}
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Memory</TableHead>
                        <TableHead>Test Cases</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                          </TableRow>
                        ))
                      ) : submissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No submissions found for this problem.
                          </TableCell>
                        </TableRow>
                      ) : (
                        submissions.map((submission) => (
                          <TableRow key={submission._id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{submission.userId.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  @{submission.userId.username}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(submission.status)} text-white flex items-center gap-1 w-fit`}>
                                {getStatusIcon(submission.status)}
                                {submission.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{submission.language}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {submission.executionTime ? `${submission.executionTime}ms` : '-'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {submission.memoryUsed ? `${submission.memoryUsed}MB` : '-'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {submission.testCasesPassed !== undefined && submission.totalTestCases
                                ? `${submission.testCasesPassed}/${submission.totalTestCases}`
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDistanceToNow(new Date(submission.createdAt))} ago
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewSubmission(submission)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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

      <SubmissionDetailsDialog
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        submission={selectedSubmission}
      />
    </>
  );
}
