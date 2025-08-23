'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Target, Calendar as CalendarIcon } from 'lucide-react'

interface StreakData {
  current: number
  max: number
  lastSubmission?: string
}

interface TagProgress {
  name: string
  solved: number
  total: number
  avgRating: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

interface ProgressTrackingProps {
  streakData: StreakData
  tagProgress: TagProgress[]
  ratingHistory?: Array<{ date: string; rating: number }>
  loading?: boolean
  error?: string
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200'
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
    case 'Hard':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200'
  }
}

// Simple calendar heatmap component
function StreakCalendar({ current }: StreakData) {
  const today = new Date()
  const days = []
  
  // Generate last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Mock activity data - in real app, this would come from API
    const hasActivity = i <= current
    
    days.push({
      date: date.toISOString().split('T')[0],
      hasActivity,
      isToday: i === 0
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Submission Activity (Last 30 days)</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded-sm bg-muted"></div>
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-green-200"></div>
          <div className="w-3 h-3 rounded-sm bg-green-400"></div>
          <div className="w-3 h-3 rounded-sm bg-green-600"></div>
          <div className="w-3 h-3 rounded-sm bg-green-800"></div>
          <span>More</span>
        </div>
      </div>
      
      <div className="grid grid-cols-10 gap-1">
        {days.map((day) => (
          <div
            key={day.date}
            className={`
              w-3 h-3 rounded-sm transition-colors cursor-pointer
              ${day.hasActivity ? 'bg-green-500 hover:bg-green-600' : 'bg-muted hover:bg-muted/80'}
              ${day.isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
            `}
            title={`${day.date}${day.hasActivity ? ' - Active' : ' - No activity'}`}
            role="button"
            tabIndex={0}
            aria-label={`${day.date}, ${day.hasActivity ? 'active' : 'no activity'}`}
          />
        ))}
      </div>
    </div>
  )
}

export function ProgressTracking({ 
  streakData, 
  tagProgress, 
  ratingHistory, 
  loading, 
  error 
}: ProgressTrackingProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
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
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load progress data</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Streak Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Streak Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{streakData.current}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-muted-foreground">{streakData.max}</div>
              <div className="text-sm text-muted-foreground">Max Streak</div>
            </div>
          </div>
          
          {streakData.lastSubmission && (
            <div className="text-center text-sm text-muted-foreground">
              Last submission: {new Date(streakData.lastSubmission).toLocaleDateString()}
            </div>
          )}
          
          <StreakCalendar {...streakData} />
        </CardContent>
      </Card>

      {/* Tag Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Problem Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tagProgress.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No problems solved yet</p>
              <p className="text-sm">Start solving problems to track your progress!</p>
            </div>
          ) : (
            tagProgress.map((tag) => (
              <div key={tag.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{tag.name}</span>
                    <Badge 
                      variant="outline" 
                      className={getDifficultyColor(tag.difficulty)}
                    >
                      {tag.difficulty}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tag.solved} / {tag.total} problems
                  </div>
                </div>
                
                <Progress 
                  value={(tag.solved / tag.total) * 100} 
                  className="h-2"
                  aria-label={`${tag.name} progress: ${tag.solved} out of ${tag.total} problems solved`}
                />
                
                <div className="text-xs text-muted-foreground">
                  Average rating: {tag.avgRating}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Rating History Placeholder */}
      {ratingHistory && ratingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Rating History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Rating chart would be displayed here</p>
              <p className="text-sm">Integration with charting library recommended</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
