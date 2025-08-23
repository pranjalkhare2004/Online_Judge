'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Flame, 
  Code2,
  Award,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Github,
  Globe,
  Linkedin,
  Zap,
  Crown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

// Enhanced interfaces
interface UserProfile {
  id: string
  FullName: string
  Email: string
  username: string
  avatarUrl?: string
  coverUrl?: string
  bio?: string
  location?: string
  website?: string
  github?: string
  linkedin?: string
  rating: number
  rank?: number
  globalRank?: number
  joinDate: string
  lastActive?: string
  isPublic: boolean
  badges: Achievement[]
}

interface UserStatistics {
  basic: {
    problemsSolved: number
    rating: number
    submissionCount: number
    currentStreak: number
    longestStreak: number
    lastSolvedDate: string | null
    joinDate: string
  }
  submissions: Array<{
    _id: string
    count: number
  }>
  difficulty: {
    easy: number
    medium: number
    hard: number
  }
  languages: Array<{
    _id: string
    count: number
  }>
  categories: Array<{
    category: string
    solved: number
    total: number
  }>
  monthlyActivity: Array<{
    _id: { year: number; month: number }
    count: number
  }>
  solvedProblems: Array<{
    _id: string
    title: string
    difficulty: string
    slug: string
  }>
}

interface Submission {
  _id: string
  problemId: {
    _id: string
    title: string
    difficulty: string
    slug: string
  }
  status: string
  language: string
  submittedAt: string
  executionTime?: number
  memoryUsed?: number
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'solver' | 'streak' | 'contest' | 'speed'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: string
  progress?: number
  requirement?: number
}

interface Contest {
  id: string
  name: string
  date: string
  rank: number
  rating: number
  ratingChange: number
  problemsSolved: number
  participants?: number
}

interface ActivityDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

interface RawSubmission {
  _id: string
  problemId: string | { _id: string; title: string; difficulty: string; slug: string }
  status: string
  language: string
  submittedAt: string
  code: string
  executionTime?: number
}

const ModernProfilePage = () => {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStatistics | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contestHistory, setContestHistory] = useState<Contest[]>([])
  const [activityData, setActivityData] = useState<ActivityDay[]>([])

  // Helper functions
  const generateActivityData = useCallback((submissions: Submission[]): ActivityDay[] => {
    // Generate exactly 365 days of activity data starting from today going backwards
    const days: ActivityDay[] = []
    const today = new Date()
    
    // Start from exactly 364 days ago (365 total days including today)
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      
      // Count submissions for this day
      const daySubmissions = submissions.filter(sub => 
        sub.submittedAt && sub.submittedAt.startsWith(dateString)
      ).length
      
      // Determine activity level (0-4 based on submission count)
      let level: 0 | 1 | 2 | 3 | 4 = 0
      if (daySubmissions >= 10) level = 4
      else if (daySubmissions >= 5) level = 3
      else if (daySubmissions >= 3) level = 2
      else if (daySubmissions >= 1) level = 1
      
      days.push({
        date: dateString,
        count: daySubmissions,
        level
      })
    }
    
    return days
  }, [])

  const generateAchievements = useCallback((stats: UserStatistics, submissions: Submission[]): Achievement[] => {
    const achievements: Achievement[] = []
    
    // Get basic stats with fallbacks
    const problemsSolved = stats?.basic?.problemsSolved || 0
    const submissionCount = stats?.basic?.submissionCount || 0
    
    // Problem Solving Achievements
    if (problemsSolved >= 1) {
      achievements.push({
        id: 'first_solve',
        name: 'First Steps',
        description: 'Solved your first problem',
        icon: '🎯',
        category: 'solver',
        rarity: 'common',
        unlockedAt: new Date().toISOString()
      })
    }
    
    if (problemsSolved >= 10) {
      achievements.push({
        id: 'solver_10',
        name: 'Problem Solver',
        description: 'Solved 10 problems',
        icon: '🧩',
        category: 'solver',
        rarity: 'common',
        unlockedAt: new Date().toISOString()
      })
    }
    
    if (problemsSolved >= 50) {
      achievements.push({
        id: 'solver_50',
        name: 'Dedicated Solver',
        description: 'Solved 50 problems',
        icon: '⭐',
        category: 'solver',
        rarity: 'rare',
        unlockedAt: new Date().toISOString()
      })
    }
    
    if (problemsSolved >= 100) {
      achievements.push({
        id: 'solver_100',
        name: 'Century Club',
        description: 'Solved 100 problems',
        icon: '💎',
        category: 'solver',
        rarity: 'rare',
        unlockedAt: new Date().toISOString()
      })
    }
    
    // Streak Achievements
    const consecutiveDays = calculateStreak(submissions)
    if (consecutiveDays >= 7) {
      achievements.push({
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Solved problems for 7 consecutive days',
        icon: '🔥',
        category: 'streak',
        rarity: 'rare',
        unlockedAt: new Date().toISOString()
      })
    }
    
    // Submission Achievement
    if (submissionCount >= 50) {
      achievements.push({
        id: 'active_coder',
        name: 'Active Coder',
        description: 'Made 50+ submissions',
        icon: '💻',
        category: 'speed',
        rarity: 'common',
        unlockedAt: new Date().toISOString()
      })
    }
    
    return achievements
  }, [])
  
  const calculateStreak = (submissions: Submission[]): number => {
    if (!submissions.length) return 0
    
    const sortedSubmissions = submissions
      .filter(sub => sub.status === 'Accepted')
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    
    if (!sortedSubmissions.length) return 0
    
    let streak = 1
    let currentDate = new Date(sortedSubmissions[0].submittedAt)
    currentDate.setHours(0, 0, 0, 0)
    
    for (let i = 1; i < sortedSubmissions.length; i++) {
      const submissionDate = new Date(sortedSubmissions[i].submittedAt)
      submissionDate.setHours(0, 0, 0, 0)
      
      const dayDifference = (currentDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (dayDifference === 1) {
        streak++
        currentDate = submissionDate
      } else if (dayDifference > 1) {
        break
      }
    }
    
    return streak
  }

  const fetchProfileData = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      console.log('Frontend: Starting profile data fetch for user:', user.username || user.id)

      // Fetch user statistics
      console.log('Frontend: Fetching user statistics...')
      const statsResponse = await api.get('/user/statistics')
      if (statsResponse.data.success) {
        console.log('Frontend: Statistics loaded successfully')
        setUserStats(statsResponse.data.data)
      } else {
        console.log('Frontend: Statistics API returned success=false')
      }

      // Fetch recent submissions
      console.log('Frontend: Fetching submissions...')
      const submissionsResponse = await api.get('/user/submissions?limit=20')
      if (submissionsResponse.data.success) {
        const rawSubmissions = submissionsResponse.data.data.submissions || []
        // Ensure slug field exists for frontend compatibility
        const processedSubmissions = rawSubmissions.map((sub: RawSubmission) => ({
          ...sub,
          problemId: typeof sub.problemId === 'string' 
            ? { _id: sub.problemId, title: 'Unknown Problem', difficulty: 'medium', slug: 'unknown' }
            : {
                ...sub.problemId,
                slug: sub.problemId.slug || sub.problemId.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              }
        }))
        console.log('Frontend: Loaded submissions:', processedSubmissions.length)
        setSubmissions(processedSubmissions)
        
        // Generate activity data from submissions
        const activityData = generateActivityData(processedSubmissions)
        console.log('Frontend: Generated activity data points:', activityData.length)
        console.log('Frontend: Activity data sample (first 7 days):', activityData.slice(0, 7))
        console.log('Frontend: Activity data sample (last 7 days):', activityData.slice(-7))
        console.log('Frontend: Date range:', activityData[0]?.date, 'to', activityData[activityData.length - 1]?.date)
        setActivityData(activityData)
      } else {
        console.log('Frontend: Submissions API returned success=false')
      }

      // Fetch user profile details (use correct endpoint)
      console.log('Frontend: Fetching profile details...')
      const profileResponse = await api.get('/user/profile')
      console.log('Frontend: Profile response structure:', profileResponse.data)
      if (profileResponse.data.success) {
        const profileData = profileResponse.data.data?.user || profileResponse.data.data || {}
        console.log('Frontend: Extracted profile data:', profileData)
        console.log('Frontend: Profile data loaded successfully')
        setUserProfile({
          id: user.id,
          FullName: profileData?.name || user?.name || '',
          Email: profileData?.email || user?.email || '',
          username: profileData?.username || user?.username || '',
          avatarUrl: profileData?.avatar || '',
          coverUrl: profileData?.coverUrl || '',
          bio: profileData?.bio || '',
          location: profileData?.location || '',
          website: profileData?.website || '',
          github: profileData?.github || '',
          linkedin: profileData?.linkedin || '',
          rating: profileData?.rating || user?.rating || 1200,
          rank: profileData?.rank || '',
          globalRank: profileData?.globalRank || '',
          joinDate: profileData?.createdAt || new Date().toISOString(),
          lastActive: profileData?.lastLogin || '',
          isPublic: profileData?.isPublic !== undefined ? profileData.isPublic : true,
          badges: []
        })
      } else {
        console.log('Frontend: Profile API returned success=false, using fallback data')
        // Fallback to auth context data
        setUserProfile({
          id: user.id,
          FullName: user.name || 'Unknown User',
          Email: user.email || '',
          username: user.username || 'user',
          rating: user.rating || 1200,
          joinDate: new Date().toISOString(),
          isPublic: true,
          badges: []
        })
      }

      // Generate achievements based on user stats (achievements endpoint doesn't exist yet)
      if (statsResponse.data.success && submissionsResponse.data.success) {
        // Generate achievements for display
        generateAchievements(
          statsResponse.data.data, 
          submissionsResponse.data.data.submissions || []
        )
      }

      // Fetch contest history (if available)
      try {
        const contestResponse = await api.get(`/user/${user.id}/contests`)
        if (contestResponse.data.success) {
          setContestHistory(contestResponse.data.data.contests || [])
        }
      } catch {
        console.log('Contest history endpoint not available')
      }

      console.log('Frontend: Profile data fetch completed successfully')

    } catch (error: unknown) {
      console.error('Frontend: Error fetching profile data:', error)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }, [user, generateAchievements, generateActivityData])

  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])

  const getRatingChange = () => {
    // Placeholder for rating change calculation
    return Math.floor(Math.random() * 40) - 20 // -20 to +20
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your profile</h1>
          <Button asChild>
            <Link href="/auth">Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchProfileData}>Retry</Button>
        </div>
      </div>
    )
  }

  const ratingChange = getRatingChange()

  return (
    <main className="min-h-screen bg-background">
      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Banner Section */}
        <section className="relative mb-6" aria-label="Profile banner">
          <div className="h-40 sm:h-56 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 shadow-2xl">
            <div className="h-full w-full bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.1),transparent_70%)]" />
          </div>
          
          {/* Profile Header Card - Inside Banner */}
          <div className="absolute bottom-6 left-6 right-6">
            <Card className="bg-background/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-xl">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-12 gap-4 items-center">
                  
                  {/* Avatar Column */}
                  <div className="col-span-12 sm:col-span-3 lg:col-span-2 flex justify-center sm:justify-start">
                    {loading ? (
                      <Skeleton className="h-24 w-24 sm:h-28 sm:w-28 rounded-full" />
                    ) : (
                      <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-white/50 shadow-2xl">
                        <AvatarImage 
                          src={userProfile?.avatarUrl} 
                          alt={`${userProfile?.FullName || 'User'} profile picture`}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 text-white shadow-inner">
                          {userProfile?.FullName?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  {/* Name & Meta Column */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-7 text-center sm:text-left min-w-0">
                    {loading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
                        <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
                        <Skeleton className="h-6 w-64 mx-auto sm:mx-0" />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg mb-1 truncate">
                          {userProfile?.FullName || 'Anonymous User'}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-3">
                          <Badge variant="secondary" className="font-mono text-xs bg-white/90 text-slate-800 border border-white/20 shadow-sm">
                            @{userProfile?.username || 'username'}
                          </Badge>
                          {userProfile?.badges?.some(b => b.rarity === 'legendary') && (
                            <Crown className="h-4 w-4 text-amber-300 drop-shadow-sm" aria-label="Legendary user" />
                          )}
                        </div>
                        
                        {/* Social Links Row */}
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 bg-white/80 text-slate-700 border-white/40 hover:bg-white/90 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-white/50 transition-all duration-200 shadow-sm"
                            aria-label="GitHub profile"
                          >
                            <Github className="h-3 w-3 mr-1" aria-hidden="true" />
                            GitHub
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 bg-white/80 text-slate-700 border-white/40 hover:bg-white/90 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-white/50 transition-all duration-200 shadow-sm"
                            aria-label="LinkedIn profile"
                          >
                            <Linkedin className="h-3 w-3 mr-1" aria-hidden="true" />
                            LinkedIn
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 bg-white/80 text-slate-700 border-white/40 hover:bg-white/90 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-white/50 transition-all duration-200 shadow-sm"
                            aria-label="Personal website"
                          >
                            <Globe className="h-3 w-3 mr-1" aria-hidden="true" />
                            Website
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Rating Badge Column */}
                  <div className="col-span-12 sm:col-span-3 lg:col-span-3 flex justify-center sm:justify-end">
                    {loading ? (
                      <Skeleton className="h-16 w-24 rounded-lg" />
                    ) : (
                      <div className="inline-flex flex-col items-center p-3 rounded-lg bg-white/95 border border-white/40 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="h-4 w-4 text-amber-600 drop-shadow-sm" aria-hidden="true" />
                          <span className="text-xl font-bold text-slate-800 tabular-nums">
                            {userProfile?.rating || 1200}
                          </span>
                          {ratingChange !== 0 && (
                            <div className={`flex items-center text-sm font-medium ${ratingChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {ratingChange > 0 ? (
                                <ArrowUp className="h-3 w-3 drop-shadow-sm" aria-label="Rating increased" />
                              ) : (
                                <ArrowDown className="h-3 w-3 drop-shadow-sm" aria-label="Rating decreased" />
                              )}
                              <span className="tabular-nums">{Math.abs(ratingChange)}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 text-center font-medium">
                          <div>Contest Rating</div>
                          <div className="truncate max-w-20">
                            Rank #{userProfile?.globalRank || 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="mb-6" aria-label="User statistics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Problems Solved */}
            <Card className="rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-950/50 dark:to-green-950/50 backdrop-blur shadow-sm hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {loading ? (
                    <>
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 flex items-center justify-center shadow-sm">
                        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent tabular-nums">
                          {userStats?.basic?.problemsSolved || 0}
                        </div>
                        <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Problems Solved</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contest Rating */}
            <Card className="rounded-xl border border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/50 dark:to-orange-950/50 backdrop-blur shadow-sm hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {loading ? (
                    <>
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 flex items-center justify-center shadow-sm">
                        <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent tabular-nums">
                          {userProfile?.rating || 1200}
                        </div>
                        <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">Contest Rating</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Global Rank */}
            <Card className="rounded-xl border border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/50 dark:to-indigo-950/50 backdrop-blur shadow-sm hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {loading ? (
                    <>
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center shadow-sm">
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent tabular-nums">
                          #{userProfile?.globalRank || 'N/A'}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Global Rank</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Streak */}
            <Card className="rounded-xl border border-orange-200/50 dark:border-orange-800/50 bg-gradient-to-br from-orange-50/80 to-red-50/80 dark:from-orange-950/50 dark:to-red-950/50 backdrop-blur shadow-sm hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {loading ? (
                    <>
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 flex items-center justify-center shadow-sm">
                        <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent tabular-nums">
                          {userStats?.basic?.currentStreak || 0}
                        </div>
                        <div className="text-sm text-orange-700 dark:text-orange-300 font-medium">Day Streak</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Content Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Profile content">
          
          {/* Left Column - Activity and Submissions */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Coding Activity Card */}
            <Card className="rounded-xl border border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/50 dark:to-indigo-950/50 backdrop-blur shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span className="text-blue-900 dark:text-blue-100">Coding Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 21 }).map((_, i) => (
                        <Skeleton key={i} className="h-3 w-full rounded-sm" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        {userStats?.basic?.submissionCount || 0} submissions in the last year
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                        <span>Less</span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-sm bg-slate-200 dark:bg-slate-700"></div>
                          <div className="w-2 h-2 rounded-sm bg-emerald-200 dark:bg-emerald-900"></div>
                          <div className="w-2 h-2 rounded-sm bg-emerald-400 dark:bg-emerald-700"></div>
                          <div className="w-2 h-2 rounded-sm bg-emerald-600 dark:bg-emerald-500"></div>
                          <div className="w-2 h-2 rounded-sm bg-emerald-800 dark:bg-emerald-300"></div>
                        </div>
                        <span>More</span>
                      </div>
                    </div>
                    
                    {/* Activity Heatmap */}
                    <div className="overflow-x-auto">
                      <div className="inline-flex flex-col gap-1 min-w-max">
                        {/* Month labels */}
                        <div className="flex gap-1 mb-1 ml-12">
                          {(() => {
                            const months = [];
                            const today = new Date();
                            const startDate = new Date(today);
                            startDate.setDate(startDate.getDate() - 364); // 365 days ago
                            
                            // Find the Sunday before or equal to start date
                            const startSunday = new Date(startDate);
                            startSunday.setDate(startDate.getDate() - startDate.getDay());
                            
                            // Calculate total weeks needed
                            const totalDays = Math.ceil((today.getTime() - startSunday.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                            const totalWeeks = Math.ceil(totalDays / 7);
                            
                            // Generate month labels based on actual weeks in the grid
                            let currentMonth = startSunday.getMonth();
                            
                            for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
                              const weekStartDate = new Date(startSunday);
                              weekStartDate.setDate(startSunday.getDate() + (weekIndex * 7));
                              
                              // If this is the first week of a new month or first week overall
                              if (weekIndex === 0 || weekStartDate.getMonth() !== currentMonth) {
                                currentMonth = weekStartDate.getMonth();
                                
                                // Only show month label if there are at least 2 weeks visible for this month
                                const monthName = weekStartDate.toLocaleDateString('en', { month: 'short' });
                                months.push(
                                  <div key={`${weekIndex}-${currentMonth}`} className="w-3 text-xs text-blue-600 dark:text-blue-400 text-left">
                                    {monthName}
                                  </div>
                                );
                              } else {
                                // Empty space for weeks that don't start a month
                                months.push(
                                  <div key={`${weekIndex}-space`} className="w-3" />
                                );
                              }
                            }
                            
                            return months;
                          })()}
                        </div>
                        
                        {/* Activity grid */}
                        <div className="flex gap-1">
                          {/* Day labels */}
                          <div className="flex flex-col gap-1 mr-2 w-10">
                            {['Sun', '', 'Tue', '', 'Thu', '', 'Sat'].map((day, i) => (
                              <div key={i} className="h-3 text-xs text-blue-600 dark:text-blue-400 flex items-center justify-end">
                                {day}
                              </div>
                            ))}
                          </div>
                          
                          {/* Activity squares - GitHub style layout */}
                          <div className="flex gap-1">
                            {activityData.length > 0 ? (() => {
                              const today = new Date();
                              const startDate = new Date(today);
                              startDate.setDate(startDate.getDate() - 364); // 365 days ago
                              
                              // Find the Sunday before or equal to start date
                              const startSunday = new Date(startDate);
                              startSunday.setDate(startDate.getDate() - startDate.getDay());
                              
                              // Calculate total weeks needed (52-53 weeks)
                              const totalDays = Math.ceil((today.getTime() - startSunday.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                              const totalWeeks = Math.ceil(totalDays / 7);
                              
                              const weeks = [];
                              
                              for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
                                const week = [];
                                
                                for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                                  const currentDate = new Date(startSunday);
                                  currentDate.setDate(startSunday.getDate() + (weekIndex * 7) + dayIndex);
                                  
                                  // Only show squares for dates within our 365-day range and not in the future
                                  // Also ensure we don't go beyond today
                                  if (currentDate >= startDate && currentDate <= today) {
                                    const dateString = currentDate.toISOString().split('T')[0];
                                    const dayData = activityData.find(day => day.date === dateString);
                                    
                                    const level = dayData?.level || 0;
                                    const count = dayData?.count || 0;
                                    
                                    const bgColor = level === 0 
                                      ? 'bg-slate-200 dark:bg-slate-700' 
                                      : level === 1 
                                      ? 'bg-emerald-200 dark:bg-emerald-900'
                                      : level === 2 
                                      ? 'bg-emerald-400 dark:bg-emerald-700'
                                      : level === 3 
                                      ? 'bg-emerald-600 dark:bg-emerald-500'
                                      : 'bg-emerald-800 dark:bg-emerald-300';
                                    
                                    week.push(
                                      <div
                                        key={`${weekIndex}-${dayIndex}`}
                                        className={`w-3 h-3 rounded-sm ${bgColor} hover:ring-1 hover:ring-blue-400 transition-all cursor-pointer`}
                                        title={`${currentDate.toDateString()}: ${count} submissions`}
                                      />
                                    );
                                  } else {
                                    // Empty cell for dates outside our range or in the future
                                    week.push(
                                      <div key={`${weekIndex}-${dayIndex}`} className="w-3 h-3" />
                                    );
                                  }
                                }
                                
                                // Only add the week if it has at least one visible cell
                                const hasVisibleCells = week.some(cell => 
                                  cell.props.className.includes('bg-')
                                );
                                
                                if (hasVisibleCells || weekIndex < totalWeeks - 4) { // Always show last few weeks for structure
                                  weeks.push(
                                    <div key={weekIndex} className="flex flex-col gap-1">
                                      {week}
                                    </div>
                                  );
                                }
                              }
                              
                              return weeks;
                            })() : 
                            // Fallback to mock data while loading or if no data
                            Array.from({ length: 52 }, (_, weekIndex) => (
                              <div key={weekIndex} className="flex flex-col gap-1">
                                {Array.from({ length: 7 }, (_, dayIndex) => {
                                  const activityLevel = Math.floor(Math.random() * 5);
                                  const bgColor = activityLevel === 0 
                                    ? 'bg-slate-200 dark:bg-slate-700' 
                                    : activityLevel === 1 
                                    ? 'bg-emerald-200 dark:bg-emerald-900'
                                    : activityLevel === 2 
                                    ? 'bg-emerald-400 dark:bg-emerald-700'
                                    : activityLevel === 3 
                                    ? 'bg-emerald-600 dark:bg-emerald-500'
                                    : 'bg-emerald-800 dark:bg-emerald-300';
                                  
                                  return (
                                    <div
                                      key={dayIndex}
                                      className={`w-3 h-3 rounded-sm ${bgColor} hover:ring-1 hover:ring-blue-400 transition-all cursor-pointer`}
                                      title={`Sample day: ${activityLevel} submissions`}
                                    />
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Activity summary */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 dark:text-blue-300">
                        Current streak: {userStats?.basic?.currentStreak || 0} days
                      </span>
                      <span className="text-blue-700 dark:text-blue-300">
                        Longest streak: {userStats?.basic?.longestStreak || 0} days
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Tabs defaultValue="submissions" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 p-1 rounded-lg">
                <TabsTrigger 
                  value="submissions" 
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100"
                >
                  Recent Submissions
                </TabsTrigger>
                <TabsTrigger 
                  value="achievements"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100"
                >
                  Achievements
                </TabsTrigger>
                <TabsTrigger 
                  value="contests"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100"
                >
                  Contest History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="submissions" className="space-y-4">
                <Card className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50/80 to-white/80 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Latest Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                            <Skeleton className="h-4 w-4 rounded" />
                            <div className="flex-1 space-y-1">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </div>
                        ))}
                      </div>
                    ) : submissions.length > 0 ? (
                      <div className="space-y-3">
                        {submissions.slice(0, 10).map((submission, index) => (
                          <div 
                            key={submission._id || index} 
                            className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-shrink-0">
                              {submission.status === 'Accepted' ? (
                                <CheckCircle className="h-4 w-4 text-emerald-600" aria-label="Accepted" />
                              ) : submission.status === 'Wrong Answer' ? (
                                <XCircle className="h-4 w-4 text-red-600" aria-label="Wrong Answer" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-amber-600" aria-label="Other status" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {submission.problemId?.title || `Problem ${submission.problemId}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(submission.submittedAt), 'MMM d, yyyy')} • {submission.language}
                              </div>
                            </div>
                            <Badge 
                              variant={submission.status === 'Accepted' ? 'default' : 'secondary'}
                              className="flex-shrink-0"
                            >
                              {submission.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Code2 className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                        <p>No submissions yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4">
                <Card className="rounded-xl border bg-card/60 backdrop-blur shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Achievements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                            <Skeleton className="h-8 w-8 rounded" />
                            <div className="flex-1 space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : userProfile?.badges && userProfile.badges.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {userProfile.badges.map((achievement, index) => (
                          <div 
                            key={achievement.id || index} 
                            className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-shrink-0 text-2xl">
                              {achievement.icon || '🏆'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {achievement.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {achievement.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Award className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                        <p>No achievements yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contests" className="space-y-4">
                <Card className="rounded-xl border bg-card/60 backdrop-blur shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Contest History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                            <Skeleton className="h-8 w-8 rounded" />
                            <div className="flex-1 space-y-1">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-6 w-12 rounded-full" />
                          </div>
                        ))}
                      </div>
                    ) : contestHistory.length > 0 ? (
                      <div className="space-y-3">
                        {contestHistory.map((contest, index) => (
                          <div 
                            key={contest.id || index} 
                            className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-shrink-0">
                              <Trophy className="h-5 w-5 text-amber-600" aria-hidden="true" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {contest.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(contest.date), 'MMM d, yyyy')} • {contest.participants} participants
                              </div>
                            </div>
                            <Badge variant="outline" className="flex-shrink-0 tabular-nums">
                              #{contest.rank}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                        <p>No contests participated yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Language Statistics */}
            <Card className="rounded-xl border border-orange-200/50 dark:border-orange-800/50 bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-950/50 dark:to-amber-950/50 backdrop-blur shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                  <span className="text-orange-900 dark:text-orange-100">Languages Used</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-5 w-8 rounded-full" />
                        </div>
                      ))}
                    </>
                  ) : userStats?.languages && userStats.languages.length > 0 ? (
                    userStats.languages.map((lang) => (
                      <div key={lang._id} className="flex items-center justify-between p-3 rounded-lg border border-orange-200/30 dark:border-orange-700/30 bg-gradient-to-r from-orange-100/50 to-amber-100/50 dark:from-orange-900/30 dark:to-amber-900/30 hover:from-orange-200/50 hover:to-amber-200/50 dark:hover:from-orange-800/30 dark:hover:to-amber-800/30 transition-all duration-200">
                        <span className="font-semibold text-orange-900 dark:text-orange-100 capitalize">{lang._id}</span>
                        <Badge variant="secondary" className="font-medium tabular-nums bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200">{lang.count}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-orange-600 dark:text-orange-400">
                      <Code2 className="h-8 w-8 mx-auto mb-2 opacity-60" aria-hidden="true" />
                      <p className="text-sm">No submissions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="rounded-xl border border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-amber-950/50 dark:to-yellow-950/50 backdrop-blur shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <span className="text-amber-900 dark:text-amber-100">Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm transition-all duration-200" 
                  asChild
                >
                  <Link href="/problems">
                    <Code2 className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
                    Solve Problems
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-10 border-amber-300 dark:border-amber-600 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-800/30 dark:hover:to-yellow-800/30 focus-visible:ring-2 focus-visible:ring-amber-500 transition-all duration-200" 
                  asChild
                >
                  <Link href="/contests">
                    <Trophy className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
                    Join Contest
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-10 border-cyan-300 dark:border-cyan-600 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 hover:from-cyan-100 hover:to-blue-100 dark:hover:from-cyan-800/30 dark:hover:to-blue-800/30 focus-visible:ring-2 focus-visible:ring-cyan-500 transition-all duration-200" 
                  asChild
                >
                  <Link href="/leaderboard">
                    <BarChart3 className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
                    View Rankings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

      </div>
    </main>
  )
}

export default ModernProfilePage
