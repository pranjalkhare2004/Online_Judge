'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'

interface Submission {
  id: string
  problemName: string
  problemId: string
  verdict: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error' | 'Memory Limit Exceeded'
  language: string
  submittedAt: string
  executionTime?: number
  memoryUsed?: number
  contestName?: string
}

interface SubmissionsListProps {
  submissions: Submission[]
  loading?: boolean
  error?: string
}

const getVerdictIcon = (verdict: string) => {
  switch (verdict) {
    case 'Accepted':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'Wrong Answer':
      return <XCircle className="h-4 w-4 text-red-600" />
    case 'Time Limit Exceeded':
      return <Clock className="h-4 w-4 text-yellow-600" />
    case 'Runtime Error':
    case 'Compilation Error':
    case 'Memory Limit Exceeded':
      return <AlertCircle className="h-4 w-4 text-orange-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-600" />
  }
}

const getVerdictColor = (verdict: string) => {
  switch (verdict) {
    case 'Accepted':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200'
    case 'Wrong Answer':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200'
    case 'Time Limit Exceeded':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200'
  }
}

export function SubmissionsList({ submissions, loading, error }: SubmissionsListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
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
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load submissions</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!submissions.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No submissions yet</p>
            <p className="text-sm">Start solving problems to see your submission history!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Status</TableHead>
              <TableHead>Problem</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Memory</TableHead>
              <TableHead>Contest</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getVerdictIcon(submission.verdict)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{submission.problemName}</div>
                    <Badge variant="outline" className={getVerdictColor(submission.verdict)}>
                      {submission.verdict}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{submission.language}</Badge>
                </TableCell>
                <TableCell>
                  {submission.executionTime ? `${submission.executionTime}ms` : '-'}
                </TableCell>
                <TableCell>
                  {submission.memoryUsed ? `${Math.round(submission.memoryUsed / 1024)}KB` : '-'}
                </TableCell>
                <TableCell>
                  {submission.contestName ? (
                    <Badge variant="outline">{submission.contestName}</Badge>
                  ) : (
                    <span className="text-muted-foreground">Practice</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(submission.submittedAt), 'MMM dd, HH:mm')}
                </TableCell>
                <TableCell>
                  <button
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="View problem"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
