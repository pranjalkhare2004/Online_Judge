'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { userAPI, problemAPI, UserStats, Problem, RecentSubmission } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target,
  Award,
  BookOpen,
  BarChart3,
  User as UserIcon,
  Settings,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // State management
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [recommendedProblems, setRecommendedProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);

  // Fetch user statistics
  const fetchUserStats = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      setStatsLoading(true);
      const response = await userAPI.getUserStats(user._id);
      
      if (response.success && response.data) {
        setUserStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load statistics',
        variant: 'destructive'
      });
    } finally {
      setStatsLoading(false);
    }
  }, [user?._id]);

  // Fetch recent submissions
  const fetchRecentSubmissions = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      const response = await userAPI.getRecentSubmissions(user._id);
      
      if (response.success && response.data?.submissions) {
        setRecentSubmissions(response.data.submissions);
      }
    } catch (error) {
      console.error('Failed to fetch recent submissions:', error);
    }
  }, [user?._id]);

  // Fetch recommended problems
  const fetchRecommendedProblems = useCallback(async () => {
    try {
      const response = await problemAPI.getRecommendedProblems();
      
      if (response.success && response.data?.problems) {
        setRecommendedProblems(response.data.problems);
      }
    } catch (error) {
      console.error('Failed to fetch recommended problems:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effects
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserStats();
      fetchRecentSubmissions();
      fetchRecommendedProblems();
    }
  }, [isAuthenticated, user, fetchUserStats, fetchRecentSubmissions, fetchRecommendedProblems]);

  // Utility functions
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-orange-600 bg-orange-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'text-green-600';
      case 'Wrong Answer': return 'text-red-600';
      case 'Time Limit Exceeded': return 'text-orange-600';
      case 'Memory Limit Exceeded': return 'text-purple-600';
      case 'Runtime Error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSubmissionIcon = (status: string) => {
    switch (status) {
      case 'Accepted': return <CheckCircle className="h-4 w-4" />;
      case 'Wrong Answer': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return null; // Redirect will happen in useEffect
  }

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username || 'User'}!</h1>
            <p className="text-gray-600">Track your progress and continue your coding journey</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/profile">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statsLoading ? (
              Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            ) : (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Problems Solved</p>
                        <p className="text-2xl font-bold">{userStats?.problemsSolved || 0}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                        <p className="text-2xl font-bold">{userStats?.totalSubmissions || 0}</p>
                      </div>
                      <Target className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Success Rate</p>
                        <p className="text-2xl font-bold">{userStats?.acceptanceRate?.toFixed(1) || '0.0'}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Current Streak</p>
                        <p className="text-2xl font-bold">{userStats?.currentStreak || 0}</p>
                      </div>
                      <Award className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Progress by Difficulty */}
          {userStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Progress by Difficulty
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-600">Easy</span>
                    <span className="text-sm text-gray-500">
                      {userStats.problemsByDifficulty?.Easy || 0} solved
                    </span>
                  </div>
                  <Progress 
                    value={(userStats.problemsByDifficulty?.Easy || 0) * 5} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-orange-600">Medium</span>
                    <span className="text-sm text-gray-500">
                      {userStats.problemsByDifficulty?.Medium || 0} solved
                    </span>
                  </div>
                  <Progress 
                    value={(userStats.problemsByDifficulty?.Medium || 0) * 10} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-600">Hard</span>
                    <span className="text-sm text-gray-500">
                      {userStats.problemsByDifficulty?.Hard || 0} solved
                    </span>
                  </div>
                  <Progress 
                    value={(userStats.problemsByDifficulty?.Hard || 0) * 20} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="submissions" className="w-full">
                <TabsList>
                  <TabsTrigger value="submissions">Recent Submissions</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                </TabsList>
                
                <TabsContent value="submissions" className="space-y-4">
                  {recentSubmissions.length > 0 ? (
                    <div className="space-y-3">
                      {recentSubmissions.slice(0, 5).map((submission, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className={cn("flex items-center", getSubmissionStatusColor(submission.status))}>
                              {getSubmissionIcon(submission.status)}
                            </div>
                            <div>
                              <Link 
                                href={`/problems/${submission.problemSlug}`}
                                className="font-medium hover:text-blue-600 hover:underline"
                              >
                                {submission.problemTitle}
                              </Link>
                              <p className="text-sm text-gray-500">
                                {submission.language} • {formatDate(submission.submittedAt)}
                              </p>
                            </div>
                          </div>
                          <Badge className={cn("text-xs", getSubmissionStatusColor(submission.status))}>
                            {submission.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No submissions yet. Start solving problems!</p>
                      <Button asChild className="mt-4">
                        <Link href="/problems">Explore Problems</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="achievements" className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Achievements system coming soon!</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-medium">{user?.username || 'Unknown User'}</h3>
                    <p className="text-sm text-gray-500">{user?.email || 'No email'}</p>
                    <Badge variant="outline" className="mt-1">
                      {user?.role || 'user'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Joined {user?.createdAt ? formatDate(user.createdAt) : 'Recently'}
                </div>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/profile">
                    View Full Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Problems */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recommended for You
              </CardTitle>
              <CardDescription>
                Problems based on your skill level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : recommendedProblems.length > 0 ? (
                  recommendedProblems.slice(0, 3).map((problem) => (
                    <div key={problem._id} className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <Link href={`/problems/${problem.slug}`} className="block">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm hover:text-blue-600">
                              {problem.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {problem.acceptanceRate}% acceptance
                            </p>
                          </div>
                          <Badge className={cn("text-xs", getDifficultyColor(problem.difficulty))}>
                            {problem.difficulty}
                          </Badge>
                        </div>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No recommendations available
                  </p>
                )}
              </div>

              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/problems">
                  View All Problems
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Daily Challenge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Daily Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-4">
                  Challenge yourself with today&apos;s featured problem!
                </p>
                <Button asChild className="w-full">
                  <Link href="/problems?featured=true">
                    Take Challenge
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
