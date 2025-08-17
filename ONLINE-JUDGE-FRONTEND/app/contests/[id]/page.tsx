"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, Trophy, Users, Target, AlertCircle, Play, CheckCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

type Contest = {
  id: string
  name: string
  description: string
  startTime: string
  endTime: string
  duration: number
  status: "upcoming" | "active" | "ended"
  participantCount: number
  problemCount: number
  type: "rated" | "unrated"
  difficulty: "Beginner" | "Intermediate" | "Advanced"
}

type ContestProblem = {
  id: string
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  points: number
  solvedCount: number
  tags: string[]
  solved?: boolean
}

type Participant = {
  rank: number
  username: string
  score: number
  solved: number
  penalty: number
  avatar?: string
}

const mockContest: Contest = {
  id: "weekly-342",
  name: "CodeJudge Weekly Contest #342",
  description: "Join our weekly programming contest featuring algorithmic challenges across different difficulty levels. Test your problem-solving skills and compete with programmers worldwide!",
  startTime: "2024-01-15T18:00:00Z",
  endTime: "2024-01-15T20:00:00Z",
  duration: 120,
  status: "upcoming",
  participantCount: 2341,
  problemCount: 4,
  type: "rated",
  difficulty: "Intermediate"
}

const mockProblems: ContestProblem[] = [
  {
    id: "contest-1",
    title: "Array Transformation",
    difficulty: "Easy",
    points: 500,
    solvedCount: 1234,
    tags: ["Array", "Math"],
    solved: false
  },
  {
    id: "contest-2", 
    title: "Binary Tree Paths",
    difficulty: "Medium",
    points: 1000,
    solvedCount: 876,
    tags: ["Tree", "DFS", "Backtracking"],
    solved: false
  },
  {
    id: "contest-3",
    title: "String Matching Algorithm",
    difficulty: "Medium", 
    points: 1500,
    solvedCount: 543,
    tags: ["String", "Algorithm"],
    solved: false
  },
  {
    id: "contest-4",
    title: "Graph Connectivity",
    difficulty: "Hard",
    points: 2000,
    solvedCount: 321,
    tags: ["Graph", "Union Find", "DFS"],
    solved: false
  }
]

const mockLeaderboard: Participant[] = [
  { rank: 1, username: "algorithmic_master", score: 5000, solved: 4, penalty: 0, avatar: "/placeholder-user.jpg" },
  { rank: 2, username: "code_ninja", score: 4500, solved: 4, penalty: 300, avatar: "/placeholder-user.jpg" },
  { rank: 3, username: "binary_wizard", score: 3500, solved: 3, penalty: 0, avatar: "/placeholder-user.jpg" },
  { rank: 4, username: "data_structures_pro", score: 3000, solved: 3, penalty: 180, avatar: "/placeholder-user.jpg" },
  { rank: 5, username: "dynamic_programmer", score: 2500, solved: 2, penalty: 0, avatar: "/placeholder-user.jpg" },
]

export default function ContestDetailPage({ params }: { params: { id: string } }) {
  const [contest] = useState<Contest>(mockContest)
  const [problems] = useState<ContestProblem[]>(mockProblems)
  const [leaderboard] = useState<Participant[]>(mockLeaderboard)
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const targetTime = contest.status === "upcoming" 
        ? new Date(contest.startTime).getTime()
        : new Date(contest.endTime).getTime()
      
      const difference = targetTime - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [contest.startTime, contest.endTime, contest.status])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "default"
      case "Medium": return "secondary"
      case "Hard": return "destructive"
      default: return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "warning"
      case "active": return "success"
      case "ended": return "secondary"
      default: return "outline"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{contest.name}</h1>
                <Badge variant={getStatusColor(contest.status)} className="capitalize">
                  {contest.status}
                </Badge>
                <Badge variant={contest.type === "rated" ? "default" : "outline"}>
                  {contest.type}
                </Badge>
              </div>
              <p className="text-muted-foreground max-w-3xl">
                {contest.description}
              </p>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(contest.startTime).toLocaleDateString()} at {new Date(contest.startTime).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {contest.duration} minutes
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {contest.participantCount.toLocaleString()} participants
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {contest.problemCount} problems
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {contest.status === "upcoming" && (
                <Button size="lg" className="animate-pulse-glow">
                  <Play className="h-4 w-4 mr-2" />
                  Register Now
                </Button>
              )}
              {contest.status === "active" && (
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  Join Contest
                </Button>
              )}
              {contest.status === "ended" && (
                <Button size="lg" variant="outline">
                  <Trophy className="h-4 w-4 mr-2" />
                  View Results
                </Button>
              )}
              <Button variant="outline" size="lg">
                <Calendar className="h-4 w-4 mr-2" />
                Add to Calendar
              </Button>
            </div>
          </div>

          {/* Countdown Timer */}
          {contest.status !== "ended" && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5" />
                    {contest.status === "upcoming" ? "Contest starts in:" : "Contest ends in:"}
                  </h3>
                  <div className="flex justify-center gap-8">
                    {Object.entries(timeLeft).map(([unit, value]) => (
                      <div key={unit} className="text-center">
                        <div className="text-3xl font-bold text-primary">
                          {value.toString().padStart(2, '0')}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contest Information Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Difficulty Level</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contest.difficulty}</div>
              <p className="text-xs text-muted-foreground">
                Suitable for {contest.difficulty.toLowerCase()} level programmers
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contest.problemCount}</div>
              <p className="text-xs text-muted-foreground">
                Algorithmic challenges
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contest.participantCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Registered so far
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="problems" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="problems">Problems</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="info">Contest Info</TabsTrigger>
          </TabsList>

          <TabsContent value="problems" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Contest Problems
                </CardTitle>
                <CardDescription>
                  Solve all problems to maximize your score. Problems have different point values.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {problems.map((problem, index) => (
                    <Card 
                      key={problem.id}
                      className="group hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-muted-foreground">
                                {String.fromCharCode(65 + index)}.
                              </span>
                              <Link 
                                href={`/problems/${problem.id}`}
                                className="text-lg font-semibold hover:text-primary transition-colors group-hover:text-primary"
                              >
                                {problem.title}
                              </Link>
                              <Badge variant={getDifficultyColor(problem.difficulty)}>
                                {problem.difficulty}
                              </Badge>
                              {problem.solved && (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Solved
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                              {problem.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="font-medium text-primary">
                                {problem.points} points
                              </span>
                              <span>
                                {problem.solvedCount} solved
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button 
                              asChild
                              variant={problem.solved ? "outline" : "default"}
                            >
                              <Link href={`/problems/${problem.id}`}>
                                {problem.solved ? "View Solution" : "Solve"}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Live Leaderboard
                </CardTitle>
                <CardDescription>
                  Current rankings and scores. Updated in real-time during the contest.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Solved</TableHead>
                      <TableHead className="text-right">Penalty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((participant) => (
                      <TableRow 
                        key={participant.username}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            #{participant.rank}
                            {participant.rank <= 3 && (
                              <Trophy className={`h-4 w-4 ${
                                participant.rank === 1 ? "text-yellow-500" :
                                participant.rank === 2 ? "text-gray-400" :
                                "text-amber-600"
                              }`} />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={participant.avatar} alt={participant.username} />
                              <AvatarFallback>
                                {participant.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{participant.username}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {participant.score}
                        </TableCell>
                        <TableCell className="text-right">
                          {participant.solved}/{problems.length}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {participant.penalty > 0 ? `+${participant.penalty}` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contest Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Scoring System
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Points are awarded based on problem difficulty and submission time. 
                      Earlier submissions receive more points.
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Time Penalties</h4>
                    <p className="text-sm text-muted-foreground">
                      Wrong submissions incur a 20-minute penalty. 
                      Total penalty time affects final ranking.
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Programming Languages</h4>
                    <p className="text-sm text-muted-foreground">
                      Supported: C++, Java, Python, JavaScript, Go, Rust
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contest Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium">Registration Opens</h4>
                        <p className="text-sm text-muted-foreground">
                          24 hours before contest start
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium">Contest Begins</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(contest.startTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium">Contest Ends</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(contest.endTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium">Results Published</h4>
                        <p className="text-sm text-muted-foreground">
                          Within 2 hours after contest end
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
