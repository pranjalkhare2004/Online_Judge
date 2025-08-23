'use client'

import { useState, useEffect } from 'react'
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
  Calendar,
  Users,
  ChevronRight,
  Flame,
  BarChart3,
  BookOpen,
  Award,
  Brain,
  Map,
  Star,
  Activity,
  PieChart,
  LineChart,
  Hash,
  CheckCircle2,
  PlayCircle,
  Bookmark,
  ArrowUpRight,
  Timer,
  GitBranch,
  Code,
  Database,
  Layers,
  Cpu
} from 'lucide-react'
import Link from 'next/link'

// Enhanced analytics interfaces
interface UserStats {
  problemsSolved: number
  currentStreak: number
  longestStreak: number
  rating: number
  globalRank: number
  totalSubmissions: number
  acceptanceRate: number
  contestsParticipated: number
}

interface ActivityData {
  date: string
  problems: number
  submissions: number
  contestRating: number
}

interface TopicProgress {
  name: string
  solved: number
  total: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: string
  progress: number
  lastSolved?: string
}

interface LearningPath {
  id: string
  title: string
  description: string
  difficulty: string
  estimatedTime: string
  completed: number
  total: number
  topics: string[]
  nextProblem?: {
    title: string
    difficulty: string
  }
}

export default function EnhancedDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<UserStats | null>(null)
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([])
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])

  // Simulated data - replace with real API calls
  useEffect(() => {
    if (user) {
      // Mock data - replace with actual API calls
      setStats({
        problemsSolved: 127,
        currentStreak: 15,
        longestStreak: 23,
        rating: 1456,
        globalRank: 2847,
        totalSubmissions: 234,
        acceptanceRate: 78.2,
        contestsParticipated: 12
      })

      setTopicProgress([
        { name: 'Array', solved: 45, total: 78, difficulty: 'Easy', category: 'Data Structures', progress: 58 },
        { name: 'Dynamic Programming', solved: 23, total: 67, difficulty: 'Hard', category: 'Algorithms', progress: 34 },
        { name: 'Binary Tree', solved: 34, total: 56, difficulty: 'Medium', category: 'Data Structures', progress: 61 },
        { name: 'Graph', solved: 18, total: 45, difficulty: 'Hard', category: 'Algorithms', progress: 40 },
        { name: 'Hash Table', solved: 29, total: 42, difficulty: 'Medium', category: 'Data Structures', progress: 69 },
        { name: 'Two Pointers', solved: 15, total: 28, difficulty: 'Easy', category: 'Techniques', progress: 54 }
      ])

      setLearningPaths([
        {
          id: '1',
          title: 'Data Structures Fundamentals',
          description: 'Master the core data structures used in programming interviews',
          difficulty: 'Beginner',
          estimatedTime: '4-6 weeks',
          completed: 15,
          total: 45,
          topics: ['Array', 'Linked List', 'Stack', 'Queue', 'Hash Table'],
          nextProblem: { title: 'Valid Parentheses', difficulty: 'Easy' }
        },
        {
          id: '2',
          title: 'Algorithm Design Patterns',
          description: 'Learn common algorithmic patterns and problem-solving techniques',
          difficulty: 'Intermediate',
          estimatedTime: '6-8 weeks',
          completed: 8,
          total: 35,
          topics: ['Two Pointers', 'Sliding Window', 'Binary Search', 'DFS/BFS'],
          nextProblem: { title: 'Container With Most Water', difficulty: 'Medium' }
        }
      ])
    }
  }, [user])

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Hard': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Data Structures': return Database
      case 'Algorithms': return GitBranch
      case 'Techniques': return Layers
      default: return Code
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      
      {/* Enhanced Header with Gamification */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user.username || user.name}! 👋
            </h1>
            <div className="flex items-center space-x-1">
              {[...Array(3)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
          <p className="text-muted-foreground">
            You&apos;re on a {stats?.currentStreak}-day streak! Keep it going! 🔥
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="font-mono text-base px-4 py-2">
            <Trophy className="w-4 h-4 mr-2" />
            Rating: {stats?.rating || user.rating || 1200}
          </Badge>
          <Badge variant="outline" className="text-base px-4 py-2">
            <BarChart3 className="w-4 h-4 mr-2" />
            Rank: #{stats?.globalRank || 'N/A'}
          </Badge>
          <Badge variant="default" className="text-base px-4 py-2">
            <Flame className="w-4 h-4 mr-2" />
            {stats?.currentStreak || 0} Day Streak
          </Badge>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
              Problems Solved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats?.problemsSolved || 1}</div>
            <div className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12 this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
              Acceptance Rate
            </CardTitle>
            <PieChart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats?.acceptanceRate || 85.7}%</div>
            <div className="flex items-center space-x-2 text-xs text-orange-700 dark:text-orange-300">
              <TrendingUp className="h-3 w-3" />
              <span>{stats?.totalSubmissions || 13} submissions</span>
            </div>
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
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats?.rating || user.rating || 1200}</div>
            <div className="flex items-center space-x-2 text-xs text-purple-700 dark:text-purple-300">
              <Calendar className="h-3 w-3" />
              <span>{stats?.contestsParticipated || 0} contests</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Study Streak
            </CardTitle>
            <Flame className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats?.currentStreak || 1} days</div>
            <div className="flex items-center space-x-2 text-xs text-blue-700 dark:text-blue-300">
              <Award className="h-3 w-3" />
              <span>Max: {stats?.longestStreak || 1} days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Progress</span>
          </TabsTrigger>
          <TabsTrigger value="explore" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Explore</span>
          </TabsTrigger>
          <TabsTrigger value="learn" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>Learn</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Activity & Analytics */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Recent Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                  <CardDescription>
                    Your coding journey over the past week
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { problem: 'Two Sum', status: 'ACCEPTED', time: '2h ago', difficulty: 'Easy', category: 'Array' },
                    { problem: 'Valid Parentheses', status: 'ACCEPTED', time: '1d ago', difficulty: 'Easy', category: 'Stack' },
                    { problem: 'Merge Two Sorted Lists', status: 'WRONG_ANSWER', time: '2d ago', difficulty: 'Easy', category: 'Linked List' },
                    { problem: 'Longest Substring', status: 'ACCEPTED', time: '3d ago', difficulty: 'Medium', category: 'Hash Table' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-2 h-8 rounded-full ${activity.status === 'ACCEPTED' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-medium">{activity.problem}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Hash className="w-3 h-3" />
                            <span>{activity.category}</span>
                            <span>•</span>
                            <span>{activity.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getDifficultyColor(activity.difficulty)}`}
                        >
                          {activity.difficulty}
                        </Badge>
                        <Badge 
                          variant={activity.status === 'ACCEPTED' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {activity.status === 'ACCEPTED' ? '✓ AC' : '✗ WA'}
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
                </CardContent>
              </Card>

              {/* Performance Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="h-5 w-5" />
                    <span>Performance Analytics</span>
                  </CardTitle>
                  <CardDescription>
                    Track your coding skills improvement over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
                      <div className="text-2xl font-bold text-green-600">92%</div>
                      <div className="text-sm text-green-700 dark:text-green-300">Easy Problems</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                      <div className="text-2xl font-bold text-yellow-600">68%</div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">Medium Problems</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950">
                      <div className="text-2xl font-bold text-red-600">34%</div>
                      <div className="text-sm text-red-700 dark:text-red-300">Hard Problems</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Actions & Challenges */}
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
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/learn">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Study Guide
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Daily Challenge */}
              <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border-violet-200 dark:border-violet-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-violet-900 dark:text-violet-100">
                    <Target className="h-5 w-5" />
                    <span>Daily Challenge</span>
                  </CardTitle>
                  <CardDescription className="text-violet-700 dark:text-violet-300">
                    Solve today&apos;s featured problem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-violet-900 dark:text-violet-100">
                        Container With Most Water
                      </p>
                      <Badge variant="secondary" className="text-xs">+25 XP</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="text-xs">Medium</Badge>
                      <Badge variant="outline" className="text-xs">Two Pointers</Badge>
                      <Badge variant="outline" className="text-xs">Array</Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-violet-700 dark:text-violet-300">
                      <Timer className="w-4 h-4" />
                      <span>~15 minutes</span>
                      <span>•</span>
                      <Users className="w-4 h-4" />
                      <span>1,247 solved today</span>
                    </div>
                    <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" asChild>
                      <Link href="/problems">
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Start Challenge
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Weekly Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Solve 5 problems</span>
                      <span className="text-muted-foreground">3/5</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Maintain streak</span>
                      <span className="text-green-600">✓ Done</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Try a Medium problem</span>
                      <span className="text-muted-foreground">0/1</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          
          {/* Topic Progress Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Map className="h-5 w-5" />
                <span>Topic Mastery</span>
              </CardTitle>
              <CardDescription>
                Track your progress across different programming topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topicProgress.map((topic, index) => {
                  const IconComponent = getCategoryIcon(topic.category)
                  return (
                    <div key={index} className="p-4 rounded-lg border space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{topic.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {topic.category}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="text-muted-foreground">{topic.solved}/{topic.total}</span>
                        </div>
                        <Progress value={topic.progress} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {topic.progress}% completed
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/problems?topic=${topic.name.toLowerCase()}`}>
                          Continue Practice
                        </Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Skill Radar Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Skill Distribution</span>
              </CardTitle>
              <CardDescription>
                Your strengths and areas for improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <div className="text-2xl font-bold text-blue-600">A+</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Arrays</div>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="text-2xl font-bold text-green-600">B+</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Strings</div>
                </div>
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                  <div className="text-2xl font-bold text-yellow-600">B</div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">Trees</div>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950">
                  <div className="text-2xl font-bold text-red-600">C+</div>
                  <div className="text-sm text-red-700 dark:text-red-300">DP</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Explore Tab */}
        <TabsContent value="explore" className="space-y-6">
          
          {/* Problem Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Explore Problems</span>
              </CardTitle>
              <CardDescription>
                Discover new challenges and expand your skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Interview Essentials', problems: 150, difficulty: 'Mixed', icon: Code2, desc: 'Top problems from FAANG interviews' },
                  { title: 'Data Structures', problems: 89, difficulty: 'Easy-Medium', icon: Database, desc: 'Master fundamental data structures' },
                  { title: 'Algorithms', problems: 120, difficulty: 'Medium-Hard', icon: GitBranch, desc: 'Classic algorithmic challenges' },
                  { title: 'Dynamic Programming', problems: 67, difficulty: 'Hard', icon: Layers, desc: 'Advanced optimization problems' },
                  { title: 'System Design', problems: 25, difficulty: 'Hard', icon: Cpu, desc: 'Design scalable systems' },
                  { title: 'Math & Logic', problems: 45, difficulty: 'Mixed', icon: Hash, desc: 'Mathematical problem solving' }
                ].map((category, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <category.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{category.title}</CardTitle>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{category.problems} problems</span>
                            <span>•</span>
                            <span>{category.difficulty}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-4">{category.desc}</p>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href="/problems">
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Start Practicing
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Problems */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Trending Problems</span>
              </CardTitle>
              <CardDescription>
                Popular problems solved by the community this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: 'Two Sum', difficulty: 'Easy', solvers: 1247, trend: '+15%' },
                  { title: 'Reverse Linked List', difficulty: 'Easy', solvers: 986, trend: '+8%' },
                  { title: 'Binary Tree Level Order', difficulty: 'Medium', solvers: 743, trend: '+22%' },
                  { title: 'Valid Parentheses', difficulty: 'Easy', solvers: 892, trend: '+5%' }
                ].map((problem, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{problem.title}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{problem.difficulty}</Badge>
                          <span>•</span>
                          <span>{problem.solvers} solved</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs text-green-600">
                        {problem.trend}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/problems">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learn Tab */}
        <TabsContent value="learn" className="space-y-6">
          
          {/* Learning Paths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Map className="h-5 w-5" />
                <span>Learning Paths</span>
              </CardTitle>
              <CardDescription>
                Structured courses to guide your programming journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {learningPaths.map((path) => (
                  <div key={path.id} className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{path.title}</h3>
                        <p className="text-muted-foreground">{path.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{path.estimatedTime}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>{path.difficulty}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {Math.round((path.completed / path.total) * 100)}% Complete
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{path.completed}/{path.total} problems</span>
                      </div>
                      <Progress value={(path.completed / path.total) * 100} className="h-2" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {path.topics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>

                    {path.nextProblem && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Next: {path.nextProblem.title}</p>
                            <p className="text-xs text-muted-foreground">{path.nextProblem.difficulty} difficulty</p>
                          </div>
                          <Button size="sm" asChild>
                            <Link href="/problems">
                              Continue
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Study Resources</span>
              </CardTitle>
              <CardDescription>
                Curated articles and tutorials to deepen your understanding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Time Complexity Analysis', type: 'Article', readTime: '8 min', difficulty: 'Beginner' },
                  { title: 'Master the Sliding Window', type: 'Tutorial', readTime: '15 min', difficulty: 'Intermediate' },
                  { title: 'Graph Algorithms Deep Dive', type: 'Course', readTime: '2 hours', difficulty: 'Advanced' },
                  { title: 'System Design Basics', type: 'Article', readTime: '12 min', difficulty: 'Intermediate' }
                ].map((resource, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                      <Badge variant="secondary" className="text-xs">{resource.difficulty}</Badge>
                    </div>
                    <h4 className="font-medium">{resource.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{resource.readTime}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Bookmark className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
