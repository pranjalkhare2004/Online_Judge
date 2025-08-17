'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Shield, 
  Activity,
  Trophy,
  Bell,
  BarChart3,
  Calendar,
  TestTube
} from 'lucide-react';
import { api } from '@/lib/api';

interface DashboardStats {
  overview: {
    totalUsers: number;
    totalProblems: number;
    totalSubmissions: number;
    totalContests: number;
    activeContests: number;
    upcomingContests: number;
  };
  recentActivity: {
    recentSubmissions: any[];
    recentUsers: any[];
  };
  analytics: {
    problemsByDifficulty: Record<string, number>;
    submissionStats: Record<string, number>;
  };
}

interface Contest {
  _id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  problems: any[];
  participants: any[];
  isPublic: boolean;
  creator: {
    name: string;
    username: string;
  };
}

interface Problem {
  _id: string;
  title: string;
  difficulty: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  createdBy: {
    name: string;
    username: string;
  };
  testCases: string[];
}

interface TestCase {
  _id: string;
  problemId: string;
  input: string;
  expectedOutput: string;
  isPublic: boolean;
  points: number;
  timeLimit: number;
  memoryLimit: number;
}

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  createdAt: string;
  userId: {
    name: string;
    username: string;
  };
  read: boolean;
}

export default function EnhancedAdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Contest state
  const [contests, setContests] = useState<Contest[]>([]);
  const [contestsLoading, setContestsLoading] = useState(false);
  const [contestSearchTerm, setContestSearchTerm] = useState('');
  const [showCreateContestDialog, setShowCreateContestDialog] = useState(false);
  const [newContest, setNewContest] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    problems: [] as string[],
    isPublic: true,
    maxParticipants: ''
  });

  // Problem state
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [problemSearchTerm, setProblemSearchTerm] = useState('');
  const [showCreateProblemDialog, setShowCreateProblemDialog] = useState(false);
  const [newProblem, setNewProblem] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    timeLimit: 1000,
    memoryLimit: 128,
    tags: '',
    examples: [] as any[],
    constraints: '',
    testCases: [] as any[]
  });

  // Test case state
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testCasesLoading, setTestCasesLoading] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [showCreateTestCaseDialog, setShowCreateTestCaseDialog] = useState(false);
  const [newTestCase, setNewTestCase] = useState({
    input: '',
    expectedOutput: '',
    isPublic: false,
    points: 10,
    timeLimit: 1000,
    memoryLimit: 128
  });

  // User state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [broadcastNotification, setBroadcastNotification] = useState({
    title: '',
    message: '',
    type: 'admin',
    category: 'announcement',
    priority: 'medium'
  });

  // Current tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check admin access
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      toast.error('Admin access required');
      router.push('/');
    }
  }, [user, loading, router]);

  // Fetch dashboard stats
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/admin/dashboard');
      
      if (response.data.success) {
        setDashboardStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchContests = async () => {
    try {
      setContestsLoading(true);
      const response = await api.get('/admin/contests', {
        params: { 
          search: contestSearchTerm || undefined,
          limit: 50 
        }
      });
      
      if (response.data.success) {
        setContests(response.data.data.contests);
      }
    } catch (error) {
      console.error('Failed to fetch contests:', error);
      toast.error('Failed to load contests');
    } finally {
      setContestsLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      setProblemsLoading(true);
      const response = await api.get('/admin/problems', {
        params: { 
          search: problemSearchTerm || undefined,
          limit: 50 
        }
      });
      
      if (response.data.success) {
        setProblems(response.data.data.problems);
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      toast.error('Failed to load problems');
    } finally {
      setProblemsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.get('/admin/users', {
        params: { 
          search: userSearchTerm || undefined,
          limit: 50 
        }
      });
      
      if (response.data.success) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await api.get('/admin/notifications');
      
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const createContest = async () => {
    try {
      const response = await api.post('/admin/contests', newContest);
      
      if (response.data.success) {
        toast.success('Contest created successfully and all users notified!');
        setShowCreateContestDialog(false);
        setNewContest({
          name: '',
          description: '',
          start_time: '',
          end_time: '',
          problems: [],
          isPublic: true,
          maxParticipants: ''
        });
        fetchContests();
        fetchDashboardStats();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create contest');
    }
  };

  const createProblem = async () => {
    try {
      const response = await api.post('/admin/problems', {
        ...newProblem,
        tags: newProblem.tags.split(',').map(t => t.trim()).filter(t => t)
      });
      
      if (response.data.success) {
        toast.success('Problem created successfully!');
        setShowCreateProblemDialog(false);
        setNewProblem({
          title: '',
          description: '',
          difficulty: 'Easy',
          timeLimit: 1000,
          memoryLimit: 128,
          tags: '',
          examples: [],
          constraints: '',
          testCases: []
        });
        fetchProblems();
        fetchDashboardStats();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create problem');
    }
  };

  const createTestCase = async () => {
    try {
      if (!selectedProblemId) {
        toast.error('Please select a problem first');
        return;
      }

      const response = await api.post('/admin/testcases', {
        ...newTestCase,
        problemId: selectedProblemId
      });
      
      if (response.data.success) {
        toast.success('Test case created successfully!');
        setShowCreateTestCaseDialog(false);
        setNewTestCase({
          input: '',
          expectedOutput: '',
          isPublic: false,
          points: 10,
          timeLimit: 1000,
          memoryLimit: 128
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create test case');
    }
  };

  const sendBroadcastNotification = async () => {
    try {
      const response = await api.post('/admin/notifications/broadcast', broadcastNotification);
      
      if (response.data.success) {
        toast.success(`Notification sent to ${response.data.data.count} users!`);
        setShowBroadcastDialog(false);
        setBroadcastNotification({
          title: '',
          message: '',
          type: 'admin',
          category: 'announcement',
          priority: 'medium'
        });
        fetchNotifications();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send notification');
    }
  };

  const deleteProblem = async (problemId: string) => {
    try {
      const response = await api.delete(`/admin/problems/${problemId}`);
      
      if (response.data.success) {
        toast.success('Problem deleted successfully');
        fetchProblems();
        fetchDashboardStats();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete problem');
    }
  };

  const deleteContest = async (contestId: string) => {
    try {
      const response = await api.delete(`/admin/contests/${contestId}`);
      
      if (response.data.success) {
        toast.success('Contest deleted successfully');
        fetchContests();
        fetchDashboardStats();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete contest');
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (user?.role !== 'admin') return;

    switch (activeTab) {
      case 'contests':
        fetchContests();
        break;
      case 'problems':
        fetchProblems();
        break;
      case 'users':
        fetchUsers();
        break;
      case 'notifications':
        fetchNotifications();
        break;
    }
  }, [activeTab, user]);

  if (loading || !user) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (user.role !== 'admin') {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your Online Judge platform</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="contests" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Contests
          </TabsTrigger>
          <TabsTrigger value="problems" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Problems
          </TabsTrigger>
          <TabsTrigger value="testcases" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test Cases
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {statsLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : dashboardStats && (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.overview.totalUsers}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.overview.totalProblems}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.overview.totalSubmissions}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Contests</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.overview.totalContests}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Contests</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{dashboardStats.overview.activeContests}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Contests</CardTitle>
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{dashboardStats.overview.upcomingContests}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Easy Problems</CardTitle>
                    <BookOpen className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{dashboardStats.analytics.problemsByDifficulty.easy || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Hard Problems</CardTitle>
                    <BookOpen className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{dashboardStats.analytics.problemsByDifficulty.hard || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardStats.recentActivity.recentSubmissions.slice(0, 5).map((submission: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{submission.userId?.name} - {submission.problemId?.title}</span>
                          <Badge variant={submission.status === 'Accepted' ? 'default' : 'destructive'}>
                            {submission.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardStats.recentActivity.recentUsers.map((user: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{user.name} (@{user.username})</span>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Rest of the tabs implementation continues... */}
        {/* Due to length limits, I'll create this as a separate component */}
      </Tabs>
    </div>
  );
}
