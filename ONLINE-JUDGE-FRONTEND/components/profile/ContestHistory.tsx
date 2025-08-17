'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, Users, Calendar, Award } from 'lucide-react'
import { format } from 'date-fns'

interface Contest {
  id: string
  title: string
  rank: number
  totalParticipants: number
  score: number
  maxScore: number
  date: string
  rating?: number
  ratingChange?: number
}

interface ContestHistoryProps {
  contests: Contest[]
  loading?: boolean
  error?: string
}

const getRankBadgeColor = (rank: number, totalParticipants: number) => {
  const percentile = (rank / totalParticipants) * 100
  if (percentile <= 10) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
  if (percentile <= 25) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200'
  if (percentile <= 50) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200'
  return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200'
}

const getRankIcon = (rank: number, totalParticipants: number) => {
  const percentile = (rank / totalParticipants) * 100
  if (percentile <= 10) return <Trophy className="h-4 w-4" />
  if (percentile <= 25) return <Award className="h-4 w-4" />
  return null
}

export function ContestHistory({ contests, loading, error }: ContestHistoryProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load contest history</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!contests.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No contests participated yet</p>
            <p className="text-sm">Join your first contest to see your history here!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {contests.map((contest) => (
        <Card key={contest.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{contest.title}</h3>
                  {getRankIcon(contest.rank, contest.totalParticipants)}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(contest.date), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {contest.totalParticipants.toLocaleString()} participants
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={getRankBadgeColor(contest.rank, contest.totalParticipants)}
                  >
                    Rank #{contest.rank.toLocaleString()}
                  </Badge>
                  
                  {contest.ratingChange !== undefined && (
                    <Badge 
                      variant={contest.ratingChange >= 0 ? 'default' : 'destructive'}
                      className={contest.ratingChange >= 0 ? 
                        'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200' :
                        'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200'
                      }
                    >
                      {contest.ratingChange >= 0 ? '+' : ''}{contest.ratingChange}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold">
                  {contest.score}
                </div>
                <div className="text-sm text-muted-foreground">
                  / {contest.maxScore}
                </div>
                {contest.rating && (
                  <div className="text-sm font-medium mt-1">
                    Rating: {contest.rating}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
