'use client'

import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Trophy, 
  Code2, 
  Zap,
  ChevronRight,
  Flame,
  BarChart3,
  Calendar,
  BookOpen,
  Award,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface UserStats {
  problemsSolved: number
  contestsParticipated: number
  currentStreak: number
  maxStreak: number
  rating: number
  globalRank: number
  totalUsers: number
  totalSubmissions: number
  accountAge: number
}

interface Submission {
  _id: string
  problemId: {
    _id: string
    title: string
    difficulty: string
  }
  status: string
  language: string
  submittedAt: string
  executionTime?: number
  memoryUsed?: number
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
  monthlyActivity: Array<{
    _id: { year: number; month: number }
    count: number
  }>
  languages: Array<{
    _id: string
    count: number
  }>
  solvedProblems: Array<any>
}

export default function EnhancedDashboard() {
  const { user } = useAuth()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [userStatistics, setUserStatistics] = useState<UserStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch user stats by ID
      const statsResponse = await api.get(`/user/${user.id}/stats`)
      if (statsResponse.data.success) {
        setUserStats(statsResponse.data.data)
      }

      // Fetch recent submissions
      const submissionsResponse = await api.get('/user/submissions?limit=10')
      if (submissionsResponse.data.success) {
        setSubmissions(submissionsResponse.data.data.submissions || [])
      }

      // Fetch detailed statistics
      const statisticsResponse = await api.get('/user/statistics')
      if (statisticsResponse.data.success) {
        setUserStatistics(statisticsResponse.data.data)
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access your dashboard</h1>
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
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    )
  }

  // Calculate acceptance rate
  const acceptedSubmissions = userStatistics?.submissions.find(s => s._id === 'ACCEPTED')?.count || 0
  const rejectedSubmissions = userStatistics?.submissions.find(s => s._id === 'REJECTED')?.count || 0
  const totalSubmissions = acceptedSubmissions + rejectedSubmissions
  const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0

  // Get difficulty breakdown
  const easyCount = userStatistics?.solvedProblems.filter(p => p.difficulty === 'Easy').length || 0
  const mediumCount = userStatistics?.solvedProblems.filter(p => p.difficulty === 'Medium').length || 0
  const hardCount = userStatistics?.solvedProblems.filter(p => p.difficulty === 'Hard').length || 0

  // Calculate streaks
  const currentStreak = userStats?.currentStreak || userStatistics?.basic?.currentStreak || 0
  const maxStreak = userStats?.maxStreak || userStatistics?.basic?.longestStreak || 0

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.username || user.name}! 👋
          </h1>
          <p className="text-muted-foreground">
            {userStats?.problemsSolved ? 
              `You've solved ${userStats.problemsSolved} problems. Keep up the great work!` :
              "Ready to start your coding journey?"
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="font-mono">
            Rating: {userStats?.rating || user.rating || 1200}
          </Badge>
          <Badge variant="outline">
            Rank: #{userStats?.globalRank || 'N/A'}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Problems Solved
            </CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {userStats?.problemsSolved || 0}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {acceptanceRate}% acceptance rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
              Current Streak
            </CardTitle>
            <Flame className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Max: {maxStreak} days 🔥
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Contest Rating
            </CardTitle>
            <Trophy className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {userStats?.rating || user.rating || 1200}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              {userStats?.contestsParticipated || 0} contests joined
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
              Global Rank
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              #{userStats?.globalRank || 'N/A'}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              of {userStats?.totalUsers || 0} users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Submissions</span>
              </CardTitle>
              <CardDescription>
                Your latest coding attempts and results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submissions.length > 0 ? (
                <>
                  {submissions.slice(0, 5).map((submission) => (
                    <div key={submission._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <Code2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{submission.problemId.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(submission.submittedAt).toLocaleDateString()} • {submission.language}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            submission.problemId.difficulty === 'Easy' ? 'secondary' : 
                            submission.problemId.difficulty === 'Medium' ? 'default' : 'destructive'
                          }
                          className="text-xs"
                        >
                          {submission.problemId.difficulty}
                        </Badge>
                        <Badge 
                          variant={submission.status === 'ACCEPTED' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {submission.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/profile">
                      <span>View All Submissions</span>
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No submissions yet</p>
                  <p className="text-sm">Start solving problems to see your activity here!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Progress Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="difficulty" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="difficulty">By Difficulty</TabsTrigger>
                  <TabsTrigger value="languages">Languages</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
                
                <TabsContent value="difficulty" className="space-y-6 mt-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Easy Problems</span>
                      <span className="text-sm text-muted-foreground">{easyCount}/200</span>
                    </div>
                    <Progress value={(easyCount / 200) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Medium Problems</span>
                      <span className="text-sm text-muted-foreground">{mediumCount}/150</span>
                    </div>
                    <Progress value={(mediumCount / 150) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Hard Problems</span>
                      <span className="text-sm text-muted-foreground">{hardCount}/50</span>
                    </div>
                    <Progress value={(hardCount / 50) * 100} className="h-2" />
                  </div>
                </TabsContent>
                
                <TabsContent value="languages" className="space-y-4 mt-6">
                  {userStatistics?.languages && userStatistics.languages.length > 0 ? (
                    userStatistics.languages.map((lang) => (
                      <div key={lang._id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <Code2 className="h-4 w-4" />
                          <span className="font-medium capitalize">{lang._id}</span>
                        </div>
                        <Badge variant="secondary">{lang.count} submissions</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">No submissions yet</p>
                  )}
                </TabsContent>
                
                <TabsContent value="monthly" className="space-y-4 mt-6">
                  {userStatistics?.monthlyActivity && userStatistics.monthlyActivity.length > 0 ? (
                    userStatistics.monthlyActivity.map((activity) => (
                      <div key={`${activity._id.year}-${activity._id.month}`} className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="font-medium">
                          {new Date(activity._id.year, activity._id.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <Badge variant="secondary">{activity.count} submissions</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">No activity data available</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/problems">
                  <Code2 className="h-4 w-4 mr-2" />
                  Solve Problems
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/contests">
                  <Trophy className="h-4 w-4 mr-2" />
                  Join Contest
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/leaderboard">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Rankings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Account Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Account Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Total Submissions</span>
                <span className="font-medium">{userStats?.totalSubmissions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Account Age</span>
                <span className="font-medium">{userStats?.accountAge || 0} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Member Since</span>
                <span className="font-medium">
                  {userStatistics?.basic?.joinDate ? 
                    new Date(userStatistics.basic.joinDate).toLocaleDateString() : 
                    'Unknown'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Last Active</span>
                <span className="font-medium">
                  {userStatistics?.basic?.lastSolvedDate ? 
                    new Date(userStatistics.basic.lastSolvedDate).toLocaleDateString() : 
                    'Never'
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Daily Challenge */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-900 dark:text-yellow-100">
                <Target className="h-5 w-5" />
                <span>Daily Challenge</span>
              </CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                Solve today&apos;s featured problem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  {userStats?.problemsSolved === 0 ? 'Two Sum (Perfect Start!)' : 'Array Rotation Challenge'}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {userStats?.problemsSolved === 0 ? 'Easy' : 'Medium'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">Array</Badge>
                </div>
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" asChild>
                  <Link href="/problems">Start Challenge</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
