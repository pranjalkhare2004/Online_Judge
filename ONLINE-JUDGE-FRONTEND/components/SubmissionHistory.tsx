// ONLINE-JUDGE-FRONTEND/components/SubmissionHistory.tsx
'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Problem {
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface Submission {
  _id: string;
  problemId: Problem;
  status: string;
  language: string;
  submittedAt: string;
  executionTime?: number;
}

interface SubmissionResponse {
  submissions: Submission[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalSubmissions: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function SubmissionHistory() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await api.get('/user/submissions?limit=10');
        if (response.data.success) {
          const data: SubmissionResponse = response.data.data;
          setSubmissions(data.submissions);
        } else {
          setError('Failed to fetch submissions');
        }
      } catch (error) {
        console.error('Failed to fetch submissions:', error);
        setError('Failed to fetch submissions');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'default';
      case 'wrong answer':
      case 'compilation error':
      case 'runtime error':
        return 'destructive';
      case 'time limit exceeded':
      case 'memory limit exceeded':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submission History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No submissions yet. Start solving problems to see your history here!
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Problem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Runtime</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission._id}>
                  <TableCell>
                    <div className="space-y-1">
                      <a 
                        href={`/problems/${submission.problemId.slug}`} 
                        className="text-blue-500 hover:underline font-medium"
                      >
                        {submission.problemId.title}
                      </a>
                      <div className={`text-sm ${getDifficultyColor(submission.problemId.difficulty)}`}>
                        {submission.problemId.difficulty}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(submission.status)}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {submission.language}
                  </TableCell>
                  <TableCell>
                    {submission.executionTime ? `${submission.executionTime}ms` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
