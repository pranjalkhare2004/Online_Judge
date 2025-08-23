/**
 * CONTESTS PAGE COMPONENT - CONTEST LISTING AND PARTICIPATION
 * 
 * DESCRIPTION:
 * This page displays all programming contests available on the platform, organized
 * in a tabbed interface by status (Active, Upcoming, History). Users can view contest
 * details, join active contests, see upcoming contest schedules, and review past
 * contests. Features responsive cards with contest metadata, participant counts,
 * and intuitive navigation to contest pages and leaderboards.
 * 
 * FUNCTIONALITY:
 * - Tabbed interface for contest organization (Active/Upcoming/History)
 * - Real-time contest status tracking with color-coded badges
 * - Contest metadata display (duration, participants, problems count)
 * - Navigation to contest participation and leaderboard pages
 * - Responsive card layout with hover animations
 * - Loading states with skeleton animations
 * - Empty state handling for each tab
 * - Automatic contest status categorization
 * - Date/time formatting with user-friendly display
 * 
 * CONTEST STATUS CATEGORIES:
 * 1. Active Contests - Currently running contests users can join
 * 2. Upcoming Contests - Future contests users can view details
 * 3. History - Past contests with results and problem access
 * 
 * UI ELEMENTS & BUTTONS:
 * Contest Card Actions (per contest status):
 * 
 * Active Contests:
 * - "Join Contest" button -> Navigate to /contests/{id} (Green styling with hover scale effect)
 * - "Leaderboard" button with Trophy icon -> Navigate to /contests/{id}/leaderboard
 * 
 * Upcoming Contests:
 * - "View Details" button -> Navigate to /contests/{id} (Outline variant)
 * - "Leaderboard" button with Trophy icon -> Navigate to /contests/{id}/leaderboard
 * 
 * Ended Contests:
 * - "View Problems" button -> Navigate to /contests/{id} (Outline variant)
 * - "Leaderboard" button with Trophy icon -> Navigate to /contests/{id}/leaderboard
 * 
 * Tab Navigation:
 * - "Active" tab -> Shows live contests with participant count
 * - "Upcoming" tab -> Shows scheduled future contests
 * - "History" tab -> Shows completed contests
 * 
 * Contest Information Display:
 * - Contest title and description
 * - Status badge with color coding (Blue=Upcoming, Green=Live, Gray=Ended)
 * - Start date/time with Calendar icon
 * - Duration with Clock icon (formatted as hours/minutes)
 * - Participant count with Users icon
 * - Problems count display
 * 
 * CONTEST NAVIGATION ROUTES:
 * Contest Participation:
 * - /contests/{contest_id} -> Contest main page (problems, submission interface)
 * - /contests/{contest_id}/leaderboard -> Real-time leaderboard and rankings
 * 
 * VISUAL FEATURES:
 * Status Color Coding:
 * - Upcoming: Blue background (bg-blue-100/dark:bg-blue-900)
 * - Live: Green background (bg-green-100/dark:bg-green-900) 
 * - Ended: Gray background (bg-gray-100/dark:bg-gray-900)
 * 
 * Interactive Elements:
 * - Card hover effects with shadow and scale transform
 * - Button hover animations with scale effects
 * - Staggered animations for contest list rendering
 * - Smooth transitions on all interactive elements
 * 
 * API INTEGRATION:
 * APIs Used:
 * 1. GET /contests
 *    Purpose: Load all contests with current status and metadata
 *    Response: Array of Contest objects with:
 *      - _id, title, description
 *      - startTime, duration, currentStatus
 *      - participantCount, problems array
 *    Error Handling: Graceful fallback to empty array
 *    Loading State: Skeleton cards during fetch
 * 
 * STATE MANAGEMENT:
 * Contest Data:
 * - contests: Contest[] - Array of all contests from API
 * - loading: boolean - Loading state for API fetch
 * 
 * Computed States:
 * - upcomingContests: Filtered contests with status "upcoming"
 * - activeContests: Filtered contests with status "live"  
 * - endedContests: Filtered contests with status "ended"
 * 
 * CONTEST STATUS LOGIC:
 * Status Determination:
 * - contest.currentStatus determines display category
 * - Status affects available actions and button variants
 * - Color coding reflects urgency and availability
 * 
 * RESPONSIVE DESIGN:
 * - Full-width container with proper spacing
 * - Grid-based tab layout adapts to screen size
 * - Card layout stacks vertically on mobile
 * - Icons and text scale appropriately
 * - Touch-friendly button sizes and spacing
 * 
 * LOADING & EMPTY STATES:
 * Loading State:
 * - Skeleton cards with pulse animation
 * - Maintains layout structure during load
 * - Different skeleton counts per tab
 * 
 * Empty States (per tab):
 * - Active: Trophy icon with "No active contests" message
 * - Upcoming: Calendar icon with "No upcoming contests" message
 * - History: Trophy icon with "No contest history" message
 * 
 * DATE/TIME HANDLING:
 * Date Formatting:
 * - formatDate() function converts ISO strings to user-friendly format
 * - Shows month abbreviation, day, hour, and minute
 * - Duration displayed as hours and minutes (e.g., "2h 30m")
 * - Participant count formatted with locale-specific thousands separators
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Single API call loads all contests, filtered client-side
 * - Efficient re-renders with proper key props
 * - Staggered animations prevent layout thrash
 * - Memoized computed values for status filtering
 * 
 * ACCESSIBILITY:
 * - Semantic heading structure
 * - Descriptive button labels and icons
 * - Keyboard navigation support
 * - Screen reader friendly status badges
 * - High contrast color schemes
 * 
 * USED BY:
 * - Competitive programmers: Finding and joining contests
 * - Students: Participating in educational competitions
 * - Developers: Skill assessment and practice
 * - Contest organizers: Viewing contest participation
 */

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Trophy, Users } from "lucide-react"
import { apiClient, type Contest } from "@/lib/api"

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadContests = async () => {
      setLoading(true)
      try {
        const response = await apiClient.getContests()
        if (response.success && response.data) {
          setContests(response.data.contests || response.data)
        }
      } catch (error) {
        console.error('Failed to load contests:', error)
        // Fallback to empty array on error
        setContests([])
      } finally {
        setLoading(false)
      }
    }

    loadContests()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "live":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "ended":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const upcomingContests = contests.filter((c) => c.currentStatus === "upcoming")
  const activeContests = contests.filter((c) => c.currentStatus === "live")
  const endedContests = contests.filter((c) => c.currentStatus === "ended")

  const ContestCard = ({ contest }: { contest: Contest }) => (
    <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{contest.title}</CardTitle>
            <CardDescription className="mt-1">{contest.description}</CardDescription>
          </div>
          <Badge className={getStatusColor(contest.currentStatus)}>
            {contest.currentStatus.charAt(0).toUpperCase() + contest.currentStatus.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(contest.startTime.toString())}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.floor(contest.duration / 60)}h {contest.duration % 60}m
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {contest.participantCount.toLocaleString()} participants
            </div>
            <div>{contest.problems?.length || 0} problems</div>
          </div>

          <div className="flex gap-2 pt-2">
            {contest.currentStatus === "live" ? (
              <Button asChild className="transition-transform duration-150 hover:scale-105">
                <Link href={`/contests/${contest._id}`}>Join Contest</Link>
              </Button>
            ) : contest.currentStatus === "upcoming" ? (
              <Button variant="outline" asChild>
                <Link href={`/contests/${contest._id}`}>View Details</Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={`/contests/${contest._id}`}>View Problems</Link>
              </Button>
            )}

            <Button variant="ghost" asChild>
              <Link href={`/contests/${contest._id}/leaderboard`}>
                <Trophy className="h-4 w-4 mr-1" />
                Leaderboard
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Contests</h1>
          <p className="text-muted-foreground">
            Participate in programming contests and compete with developers worldwide
          </p>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active ({activeContests.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingContests.length})</TabsTrigger>
            <TabsTrigger value="history">History ({endedContests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-muted rounded w-1/3"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeContests.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active contests at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeContests.map((contest, index) => (
                  <div key={contest._id} className="animate-stagger-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ContestCard contest={contest} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-muted rounded w-1/3"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingContests.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming contests scheduled.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingContests.map((contest, index) => (
                  <div key={contest._id} className="animate-stagger-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ContestCard contest={contest} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-muted rounded w-1/3"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : endedContests.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No contest history available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {endedContests.map((contest, index) => (
                  <div key={contest._id} className="animate-stagger-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ContestCard contest={contest} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
