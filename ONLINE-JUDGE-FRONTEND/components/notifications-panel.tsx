"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Calendar, Code, Trophy, MessageSquare, CheckCircle, X, Settings } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"

type NotificationType = "submission" | "contest" | "announcement" | "message" | "achievement"

type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  metadata?: {
    problemId?: string
    contestId?: string
    status?: string
    score?: number
  }
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "submission",
    title: "Submission Accepted",
    message: "Your solution for 'Two Sum' has been accepted!",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false,
    actionUrl: "/problems/1",
    metadata: { problemId: "1", status: "accepted" }
  },
  {
    id: "2", 
    type: "contest",
    title: "Contest Starting Soon",
    message: "CodeJudge Weekly Contest #342 starts in 30 minutes. Get ready!",
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    read: false,
    actionUrl: "/contests/weekly-342",
    metadata: { contestId: "weekly-342" }
  },
  {
    id: "3",
    type: "announcement",
    title: "New Feature: Code Review",
    message: "We've added AI-powered code review to help you improve your solutions.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true,
    actionUrl: "/features/code-review"
  },
  {
    id: "4",
    type: "achievement",
    title: "Achievement Unlocked!",
    message: "You've solved 50 problems! Keep up the great work.",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    metadata: { score: 50 }
  },
  {
    id: "5",
    type: "submission",
    title: "Submission Failed",
    message: "Your solution for 'Binary Tree Maximum Path' failed test case 12.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
    actionUrl: "/problems/124",
    metadata: { problemId: "124", status: "wrong_answer" }
  },
  {
    id: "6",
    type: "contest",
    title: "Contest Results",
    message: "Results for Algorithm Masters Cup are now available. You ranked #87!",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    read: true,
    actionUrl: "/contests/masters-cup/results",
    metadata: { contestId: "masters-cup", score: 87 }
  }
]

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "submission":
      return <Code className="h-4 w-4" />
    case "contest":
      return <Trophy className="h-4 w-4" />
    case "announcement":
      return <Bell className="h-4 w-4" />
    case "message":
      return <MessageSquare className="h-4 w-4" />
    case "achievement":
      return <CheckCircle className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case "submission":
      return "text-blue-500"
    case "contest":
      return "text-yellow-500"
    case "announcement":
      return "text-purple-500"
    case "message":
      return "text-green-500"
    case "achievement":
      return "text-orange-500"
    default:
      return "text-gray-500"
  }
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case "accepted":
      return "text-green-600"
    case "wrong_answer":
    case "runtime_error":
    case "time_limit":
      return "text-red-600"
    case "compile_error":
      return "text-orange-600"
    default:
      return "text-gray-600"
  }
}

interface NotificationsPanelProps {
  trigger?: React.ReactNode
}

export function NotificationsPanel({ trigger }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [filter, setFilter] = useState<NotificationType | "all">("all")

  const unreadCount = notifications.filter(n => !n.read).length

  const filteredNotifications = filter === "all" 
    ? notifications 
    : notifications.filter(n => n.type === filter)

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="relative">
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  )

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-96 sm:w-[480px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary">
                  {unreadCount} new
                </Badge>
              )}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetDescription>
            Stay updated with your latest submissions, contests, and announcements.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as NotificationType | "all")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="submission">Submissions</TabsTrigger>
              <TabsTrigger value="contest">Contests</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              <ScrollArea className="h-[calc(100vh-240px)]">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                    <p className="text-muted-foreground">
                      You're all caught up! Check back later for updates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                      <Card 
                        key={notification.id}
                        className={`group hover:shadow-md transition-all duration-200 cursor-pointer ${
                          !notification.read ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : ""
                        }`}
                        onClick={() => {
                          markAsRead(notification.id)
                          if (notification.actionUrl) {
                            window.open(notification.actionUrl, '_blank')
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-sm leading-tight">
                                  {notification.title}
                                </h4>
                                <div className="flex items-center gap-1">
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                </span>
                                {notification.metadata?.status && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getStatusColor(notification.metadata.status)}`}
                                  >
                                    {notification.metadata.status.replace('_', ' ')}
                                  </Badge>
                                )}
                                {notification.metadata?.score && (
                                  <Badge variant="outline" className="text-xs">
                                    Rank #{notification.metadata.score}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Export for use in other components
export default NotificationsPanel
