'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Code2,
  Timer,
  MemoryStick,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import api from '@/lib/api'
import { formatExecutionTimeShort, formatMemoryUsage } from '@/lib/format-utils'

interface Submission {
  _id: string
  problemId: {
    _id: string
    title: string
    difficulty: string
    slug?: string
  }
  status: string
  language: string
  submittedAt: string
  executionTime?: number
  memoryUsed?: number
  code?: string
}

interface SubmissionResponse {
  success: boolean
  data: {
    submissions: Submission[]
    pagination: {
      currentPage: number
      totalPages: number
      totalSubmissions: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

const getVerdictIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'accepted':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'wrong answer':
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-600" />
    case 'time limit exceeded':
      return <Clock className="h-4 w-4 text-yellow-600" />
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-600 animate-spin" />
    default:
      return <AlertCircle className="h-4 w-4 text-orange-600" />
  }
}

const getVerdictColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200'
    case 'wrong answer':
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200'
    case 'time limit exceeded':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
    case 'pending':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200'
  }
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
    case 'hard':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200'
  }
}

export default function SubmissionsPage() {
  const { user, isAuthenticated } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSubmissions, setTotalSubmissions] = useState(0)

  const fetchSubmissions = async (pageNum: number = 1) => {
    if (!isAuthenticated) {
      setError('Please log in to view your submissions')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`/user/submissions?page=${pageNum}&limit=20`)
      const data = response.data as SubmissionResponse

      if (data.success) {
        setSubmissions(data.data.submissions)
        setTotalPages(data.data.pagination.totalPages)
        setTotalSubmissions(data.data.pagination.totalSubmissions)
        setPage(pageNum)
      } else {
        setError('Failed to fetch submissions')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to view your submission history
            </p>
            <Button asChild>
              <Link href="/auth">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Submissions</h1>
          <p className="text-muted-foreground">
            Track your problem-solving progress and submission history
          </p>
        </div>
        <Button onClick={() => fetchSubmissions(page)} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Code2 className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Total Submissions</span>
            </div>
            <p className="text-2xl font-bold mt-2">{totalSubmissions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Accepted</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {submissions.filter(s => s.status.toLowerCase() === 'accepted').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="font-semibold">Success Rate</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {totalSubmissions > 0 
                ? Math.round((submissions.filter(s => s.status.toLowerCase() === 'accepted').length / submissions.length) * 100)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Submission History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold">Failed to load submissions</p>
              <p className="text-sm">{error}</p>
              <Button onClick={() => fetchSubmissions(page)} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold">No submissions yet</p>
              <p className="text-sm">Start solving problems to see your progress!</p>
              <Button asChild className="mt-4">
                <Link href="/problems">Browse Problems</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Problem</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Memory</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getVerdictIcon(submission.status)}
                          <Badge className={getVerdictColor(submission.status)} variant="secondary">
                            {submission.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Link
                            href={`/problems/${submission.problemId.slug || submission.problemId._id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {submission.problemId.title}
                          </Link>
                          <Badge className={getDifficultyColor(submission.problemId.difficulty)} variant="secondary" size="sm">
                            {submission.problemId.difficulty}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.language}</Badge>
                      </TableCell>
                      <TableCell>
                        {submission.executionTime ? (
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {formatExecutionTimeShort(submission.executionTime)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.memoryUsed ? (
                          <div className="flex items-center gap-1">
                            <MemoryStick className="h-3 w-3" />
                            {formatMemoryUsage(submission.memoryUsed)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => fetchSubmissions(page - 1)}
                    disabled={page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => fetchSubmissions(page + 1)}
                    disabled={page === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
