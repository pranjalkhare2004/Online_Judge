'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Import our new profile components
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { StatisticsCards } from '@/components/profile/StatisticsCards'
import { SubmissionsList } from '@/components/profile/SubmissionsList'
import { ContestHistory } from '@/components/profile/ContestHistory'
import { ProgressTracking } from '@/components/profile/ProgressTracking'

import api from '@/lib/api'
import Link from 'next/link'

// Types for our data structures
interface User {
  id: string
  FullName: string
  Email: string
  username?: string
  avatarUrl?: string
  rating: number
  rank?: number
  role?: string
  joinDate?: string
}

interface Statistics {
  problemsSolved: number
  contests: number
  streak: number
  rank?: number
  totalUsers?: number
  rating: number
  solvedToday?: number
}

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

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuth()
  
  // State management
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Statistics | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataFetched, setDataFetched] = useState(false)

  useEffect(() => {
    async function fetchProfileData() {
      if (!authUser || authLoading || dataFetched) return

      try {
        setLoading(true)
        setError(null)

        // Fetch user profile
        try {
          const userResponse = await api.get('/user/profile')
          if (userResponse.data.success) {
            const userData = userResponse.data.data.user
            setUser({
              id: userData.id,
              FullName: userData.FullName || userData.name || authUser.name || 'User',
              Email: userData.Email || userData.email || authUser.email || '',
              username: userData.username,
              avatarUrl: userData.avatarUrl,
              rating: userData.rating || authUser.rating || 1200,
              rank: userData.rank,
              role: userData.role || authUser.role || 'user',
              joinDate: userData.createdAt || authUser.createdAt
            })
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err)
        }

        // Fetch user statistics
        try {
          const statsResponse = await api.get(`/user/${authUser.id}/stats`)
          if (statsResponse.data.success) {
            const statsData = statsResponse.data.data
            setStats({
              problemsSolved: statsData.problemsSolved || 0,
              contests: statsData.contests || 0,
              streak: statsData.streak || 0,
              rank: statsData.rank || 1,
              totalUsers: statsData.totalUsers,
              rating: authUser.rating || 1200,
              solvedToday: statsData.solvedToday || 0
            })
          }
        } catch (err) {
          console.error('Failed to fetch user stats:', err)
        }

        // Fetch submissions
        try {
          const submissionsResponse = await api.get('/user/submissions?limit=20')
          if (submissionsResponse.data.success) {
            const submissionsData = Array.isArray(submissionsResponse.data.data) 
              ? submissionsResponse.data.data 
              : []
            setSubmissions(submissionsData.map((sub: unknown) => {
              const submission = sub as Record<string, unknown>
              const problem = submission.problem as Record<string, unknown> | undefined
              const contest = submission.contest as Record<string, unknown> | undefined
              return {
                id: (submission.id || submission._id || Math.random().toString()) as string,
                problemName: (submission.problemName || problem?.title || 'Unknown Problem') as string,
                problemId: (submission.problemId || problem?.id || '') as string,
                verdict: (submission.verdict || submission.status || 'Pending') as string,
                language: (submission.language || 'Unknown') as string,
                submittedAt: (submission.submittedAt || submission.createdAt || new Date().toISOString()) as string,
                executionTime: submission.executionTime || submission.runtime,
                memoryUsed: submission.memoryUsed || submission.memory,
                contestName: (submission.contestName || contest?.name) as string
              }
            }))
          }
        } catch (err) {
          console.error('Failed to fetch submissions:', err)
        }

        // Fetch contest history
        try {
          const contestsResponse = await api.get(`/user/${authUser.id}/contests?limit=10`)
          if (contestsResponse.data.success) {
            const contestsData = contestsResponse.data.data
            if (Array.isArray(contestsData)) {
              setContests(contestsData.map((contest: unknown) => {
                const contestData = contest as Record<string, unknown>
                return {
                  id: (contestData.id || contestData._id || Math.random().toString()) as string,
                  title: (contestData.title || contestData.name || 'Contest') as string,
                  rank: (contestData.rank || contestData.position || 1) as number,
                  totalParticipants: (contestData.totalParticipants || contestData.participants || 100) as number,
                  score: (contestData.score || contestData.points || 0) as number,
                  maxScore: (contestData.maxScore || contestData.totalPoints || 1000) as number,
                  date: (contestData.date || contestData.startTime || new Date().toISOString()) as string,
                  rating: contestData.rating as number,
                  ratingChange: contestData.ratingChange as number
                }
              }))
            }
          }
        } catch (err) {
          console.error('Failed to fetch contests:', err)
        }

        setDataFetched(true)

      } catch (err) {
        console.error('Failed to fetch profile data:', err)
        setError('Failed to load profile data')
        
        // Set fallback data
        if (authUser) {
          setUser({
            id: authUser.id,
            FullName: authUser.name || 'User',
            Email: authUser.email || '',
            rating: authUser.rating || 1200,
            rank: 1,
            role: authUser.role || 'user',
            joinDate: authUser.createdAt
          })
          
          setStats({
            problemsSolved: 0,
            contests: 0,
            streak: 0,
            rank: 1,
            rating: authUser.rating || 1200,
            solvedToday: 0
          })
        }
        setDataFetched(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [authUser, authLoading, dataFetched])

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    try {
      // In a real app, you'd make an API call to update the avatar
      console.log('Updating avatar to:', newAvatarUrl)
      if (user) {
        setUser({ ...user, avatarUrl: newAvatarUrl })
      }
    } catch (err) {
      console.error('Failed to update avatar:', err)
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  // Authentication required
  if (!authUser || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view your profile</p>
            <Button asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Profile Header */}
      <ProfileHeader 
        user={user} 
        onAvatarUpdate={handleAvatarUpdate}
        editable={true}
      />

      {/* Statistics Cards */}
      {stats && (
        <StatisticsCards 
          stats={stats}
          error={error || undefined}
        />
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="submissions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submissions">Recent Submissions</TabsTrigger>
          <TabsTrigger value="contests">Contest History</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-6">
          <SubmissionsList 
            submissions={submissions}
            loading={loading}
            error={error || undefined}
          />
        </TabsContent>

        <TabsContent value="contests" className="mt-6">
          <ContestHistory 
            contests={contests}
            loading={loading}
            error={error || undefined}
          />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <ProgressTracking 
            streakData={{
              current: stats?.streak || 0,
              max: stats?.streak || 0, // In real app, track separately
              lastSubmission: submissions[0]?.submittedAt
            }}
            tagProgress={[
              // Mock data - in real app, fetch from API
              {
                name: 'arrays',
                solved: 12,
                total: 50,
                avgRating: 1400,
                difficulty: 'Medium' as const
              },
              {
                name: 'strings', 
                solved: 8,
                total: 30,
                avgRating: 1200,
                difficulty: 'Easy' as const
              }
            ]}
            loading={loading}
            error={error || undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
