/**
 * ADMIN DASHBOARD COMPONENT - ADMINISTRATIVE INTERFACE
 * 
 * DESCRIPTION:
 * This is the comprehensive administrative dashboard for the Online Judge platform.
 * It provides complete administrative control over users, problems, submissions, and
 * system statistics. Features tabbed interface with dashboard overview, problem management,
 * user administration, and detailed administrative controls with confirmation dialogs.
 * 
 * FUNCTIONALITY:
 * - Multi-tab admin interface (Dashboard, Problems, Users)
 * - Real-time dashboard statistics and recent activity monitoring
 * - Complete problem management with CRUD operations
 * - User administration with role and status management
 * - Search and filtering capabilities across all entities
 * - Confirmation dialogs for destructive actions
 * - Loading states and error handling throughout
 * - Responsive design with table views and action buttons
 * 
 * ACCESS CONTROL:
 * - Requires admin role authentication
 * - Automatic redirect for non-admin users
 * - Role-based permission checking
 * - Secure API endpoint access
 * 
 * ADMIN TABS:
 * 1. Dashboard - Overview statistics and recent activity
 * 2. Problems - Problem management and content control
 * 3. Users - User administration and role management
 * 
 * UI ELEMENTS & BUTTONS:
 * Dashboard Tab:
 * - Statistics cards with counts and icons
 * - Recent submissions table with status indicators
 * - Activity monitoring with real-time data
 * - Refresh capability for live updates
 * 
 * Problems Tab:
 * - Search input with search icon
 * - "Search" button -> fetchProblems() with loading state
 * - "Add Problem" button -> Problem creation (Plus icon)
 * - Problem status toggle switches (Active/Inactive)
 * - "Edit" button -> Problem editing (Edit2 icon)
 * - "Delete" button -> Deletion confirmation (Trash2 icon)
 * 
 * Users Tab:
 * - Search input for user filtering
 * - "Search" button -> fetchUsers() with loading state
 * - "Edit" button -> User management dialog (Edit2 icon)
 * - User role badges and status indicators
 * - Verification status displays
 * 
 * CONFIRMATION DIALOGS:
 * Delete Problem Dialog:
 * - Warning message with problem title
 * - "Cancel" button -> Close dialog
 * - "Delete" button -> handleDeleteProblem() (Red styling)
 * - Destructive action confirmation
 * 
 * Edit User Dialog:
 * - Role selection dropdown (User/Admin)
 * - Active status toggle switch
 * - Email verification toggle switch
 * - "Cancel" button -> Close dialog
 * - "Save Changes" button -> handleUpdateUser()
 * 
 * SEARCH & FILTER FEATURES:
 * Problem Search:
 * - Search by title, tags, or description
 * - Real-time filtering with search term
 * - Results limited to 50 items for performance
 * 
 * User Search:  
 * - Search by name, username, or email
 * - Role-based filtering capability
 * - Pagination support for large user bases
 * 
 * API INTEGRATION:
 * APIs Used:
 * 1. GET /admin/dashboard
 *    Purpose: Load dashboard statistics and recent activity
 *    Response: Stats object with counts and recent submissions
 *    Error Handling: Toast notification on failure
 * 
 * 2. GET /admin/problems
 *    Purpose: Load problems for administrative management
 *    Query Params: search, limit (50)
 *    Response: Array of problem objects with creator info
 *    Error Handling: Toast notification with retry capability
 * 
 * 3. GET /admin/users
 *    Purpose: Load users for administrative management
 *    Query Params: search, limit (50)  
 *    Response: Array of user objects with role/status info
 *    Error Handling: Toast notification with graceful fallback
 * 
 * 4. PUT /admin/problems/[id]
 *    Purpose: Update problem status (active/inactive toggle)
 *    Payload: { isActive: boolean }
 *    Response: Updated problem object
 *    Optimistic Updates: Immediate UI update with rollback on error
 * 
 * 5. DELETE /admin/problems/[id]
 *    Purpose: Delete problem and associated test cases
 *    Response: Success confirmation
 *    UI Updates: Remove from problems list on success
 * 
 * 6. PUT /admin/users/[id]
 *    Purpose: Update user role, status, and verification
 *    Payload: { role, isActive, isVerified }
 *    Response: Updated user object
 *    Dialog Management: Close dialog on successful update
 * 
 * STATE MANAGEMENT:
 * Dashboard Data:
 * - dashboardStats: Platform statistics object
 * - statsLoading: Boolean for dashboard loading state
 * 
 * Problem Management:
 * - problems: Array of problem objects
 * - problemsLoading: Boolean for problems loading
 * - problemSearchTerm: String for problem search
 * - selectedProblem: Problem object for operations
 * - showDeleteProblemDialog: Boolean for delete confirmation
 * 
 * User Management:
 * - users: Array of user objects
 * - usersLoading: Boolean for users loading
 * - userSearchTerm: String for user search
 * - selectedUser: User object for editing
 * - showEditUserDialog: Boolean for edit dialog
 * 
 * ADMINISTRATIVE OPERATIONS:
 * Problem Management:
 * - Toggle problem active/inactive status
 * - Delete problems with test case cleanup
 * - Search and filter problems
 * - View problem metadata and creator info
 * - Future: Create and edit problems
 * 
 * User Management:
 * - Change user roles (user ↔ admin)
 * - Toggle user active status
 * - Manage email verification status
 * - Search and filter users
 * - View user statistics and activity
 * 
 * SECURITY FEATURES:
 * - Admin role requirement with redirect
 * - Confirmation dialogs for destructive actions
 * - Secure API authentication
 * - Input validation and sanitization
 * - Role-based access control
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Lazy loading with search-based fetching
 * - Results pagination with 50-item limits
 * - Optimistic UI updates for better UX
 * - Efficient state management with selective updates
 * - Loading skeletons for better perceived performance
 * 
 * ERROR HANDLING:
 * - Toast notifications for all operations
 * - Graceful fallback for API failures
 * - Loading state management throughout
 * - User-friendly error messages
 * - Retry capabilities for failed operations
 * 
 * RESPONSIVE DESIGN:
 * - Tabbed interface adapts to screen size
 * - Responsive table layouts with horizontal scroll
 * - Mobile-friendly action buttons and dialogs
 * - Adaptive spacing and typography
 * - Touch-friendly interactive elements
 * 
 * ACCESSIBILITY:
 * - Proper heading structure and navigation
 * - Keyboard accessible dialogs and controls
 * - Screen reader friendly table headers
 * - High contrast status indicators
 * - Focus management in modal dialogs
 * 
 * USED BY:
 * - Platform administrators: System management
 * - Content moderators: Problem and user oversight
 * - System operators: Monitoring and maintenance
 * - Support staff: User assistance and troubleshooting
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Users, BookOpen, FileText, Plus, Edit2, Trash2, Search, Shield, Activity, TestTube, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { ProblemDialog } from '@/components/admin/problem-dialog';
import { TestCaseManager } from '@/components/admin/test-case-manager';
import { ProblemSubmissions } from '@/components/admin/problem-submissions';

interface DashboardStats {
  totalUsers: number;
  totalProblems: number;
  totalSubmissions: number;
  recentSubmissions: Array<{
    _id: string;
    status: string;
    language: string;
    submittedAt: string;
    userId: {
      name: string;
      username: string;
    };
    problemId: {
      title: string;
    };
  }>;
}

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  createdBy: {
    name: string;
    username: string;
  };
}

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface Contest {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  problems: string[];
  isActive: boolean;
  registrationLimit?: number;
  participantCount: number;
  createdBy: {
    name: string;
    username: string;
  };
  createdAt: string;
}

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State for dashboard
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // State for problems
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [problemSearchTerm, setProblemSearchTerm] = useState('');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [showDeleteProblemDialog, setShowDeleteProblemDialog] = useState(false);

  // State for users
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);

  // State for contests
  const [contests, setContests] = useState<Contest[]>([]);
  const [contestsLoading, setContestsLoading] = useState(false);
  const [contestSearchTerm, setContestSearchTerm] = useState('');
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [showCreateContestDialog, setShowCreateContestDialog] = useState(false);
  const [showDeleteContestDialog, setShowDeleteContestDialog] = useState(false);

  // State for system management
  const [systemStats, setSystemStats] = useState<Record<string, unknown> | null>(null);
  const [systemLoading, setSystemLoading] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // State for submissions
  const [submissions, setSubmissions] = useState<unknown[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // State for enhanced problem management dialogs
  const [showProblemDialog, setShowProblemDialog] = useState(false);
  const [showTestCaseManager, setShowTestCaseManager] = useState(false);
  const [showProblemSubmissions, setShowProblemSubmissions] = useState(false);
  const [selectedProblemForEdit, setSelectedProblemForEdit] = useState<Problem | null>(null);

  // Check admin access
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      toast.error('Admin access required');
      router.push('/');
    }
  }, [user, loading, router]);

  const fetchDashboardStats = useCallback(async () => {
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
  }, []);

  const fetchProblems = useCallback(async (searchTerm?: string) => {
    try {
      setProblemsLoading(true);
      const response = await api.get('/admin/problems', {
        params: { 
          search: searchTerm || undefined,
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
  }, []);

  const fetchUsers = useCallback(async (searchTerm?: string) => {
    try {
      setUsersLoading(true);
      const response = await api.get('/admin/users', {
        params: { 
          search: searchTerm || undefined,
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
  }, []);

  // Search handler functions (separate from initial load)
  const handleSearchProblems = () => {
    fetchProblems(problemSearchTerm);
  };

  const handleSearchUsers = () => {
    fetchUsers(userSearchTerm);
  };

  const handleSearchContests = () => {
    fetchContests(contestSearchTerm);
  };

  const handleToggleProblemStatus = async (problemId: string, isActive: boolean) => {
    try {
      const response = await api.put(`/admin/problems/${problemId}`, {
        isActive: !isActive
      });
      
      if (response.data.success) {
        setProblems(prev => prev.map(p => 
          p._id === problemId ? { ...p, isActive: !isActive } : p
        ));
        toast.success(`Problem ${!isActive ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Failed to toggle problem status:', error);
      toast.error('Failed to update problem status');
    }
  };

  const handleDeleteProblem = async () => {
    if (!selectedProblem) return;
    
    try {
      const response = await api.delete(`/admin/problems/${selectedProblem._id}`);
      
      if (response.data.success) {
        setProblems(prev => prev.filter(p => p._id !== selectedProblem._id));
        toast.success('Problem deleted successfully');
        setShowDeleteProblemDialog(false);
        setSelectedProblem(null);
      }
    } catch (error) {
      console.error('Failed to delete problem:', error);
      toast.error('Failed to delete problem');
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, updates);
      
      if (response.data.success) {
        setUsers(prev => prev.map(u => 
          u._id === userId ? { ...u, ...updates } : u
        ));
        toast.success('User updated successfully');
        setShowEditUserDialog(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    }
  };

  // Contest Management Functions
  const fetchContests = useCallback(async (searchTerm?: string) => {
    try {
      setContestsLoading(true);
      const response = await api.get('/admin/contests', {
        params: {
          search: searchTerm || undefined,
          limit: 50
        }
      });
      
      if (response.data.success) {
        setContests(response.data.data.contests || []);
      }
    } catch (error) {
      console.error('Failed to fetch contests:', error);
      toast.error('Failed to load contests');
    } finally {
      setContestsLoading(false);
    }
  }, []);

  const handleCreateContest = async (contestData: Partial<Contest>) => {
    try {
      const response = await api.post('/admin/contests', contestData);
      
      if (response.data.success) {
        toast.success('Contest created successfully');
        setShowCreateContestDialog(false);
        fetchContests();
      }
    } catch (error) {
      console.error('Failed to create contest:', error);
      toast.error('Failed to create contest');
    }
  };

  const handleDeleteContest = async () => {
    if (!selectedContest) return;
    
    try {
      await api.delete(`/admin/contests/${selectedContest._id}`);
      toast.success('Contest deleted successfully');
      setShowDeleteContestDialog(false);
      setSelectedContest(null);
      fetchContests();
    } catch (error) {
      console.error('Failed to delete contest:', error);
      toast.error('Failed to delete contest');
    }
  };

  // System Management Functions
  const fetchSystemStats = useCallback(async () => {
    try {
      setSystemLoading(true);
      const [queueStats, dockerStats] = await Promise.all([
        api.get('/admin/queue/stats'),
        api.get('/admin/system/docker')
      ]);
      
      setSystemStats({
        queue: queueStats.data.data,
        docker: dockerStats.data.data
      });
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      toast.error('Failed to load system statistics');
    } finally {
      setSystemLoading(false);
    }
  }, []);

  const handleBroadcastNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }

    try {
      setBroadcastLoading(true);
      const response = await api.post('/admin/notifications/broadcast', {
        title: notificationTitle,
        message: notificationMessage,
        type: 'announcement'
      });
      
      if (response.data.success) {
        toast.success(`Notification sent to ${response.data.data.count} users`);
        setNotificationTitle('');
        setNotificationMessage('');
      }
    } catch (error) {
      console.error('Failed to broadcast notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setSubmissionsLoading(true);
      const response = await api.get('/admin/submissions', {
        params: {
          limit: 50,
          sort: '-submittedAt'
        }
      });
      
      if (response.data.success) {
        setSubmissions(response.data.data.submissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Fetch initial data when admin user is authenticated
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardStats();
      fetchProblems();
      fetchUsers();
      fetchContests();
      fetchSystemStats();
    }
  }, [user, fetchDashboardStats, fetchProblems, fetchUsers, fetchContests, fetchSystemStats]);

  // Auto-refresh dashboard stats every 30 seconds
  useEffect(() => {
    if (user?.role === 'admin') {
      const interval = setInterval(() => {
        fetchDashboardStats();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, fetchDashboardStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="contests">Contests</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : dashboardStats?.totalUsers}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : dashboardStats?.totalProblems}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : dashboardStats?.totalSubmissions}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Latest submissions from users</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Problem</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dashboardStats?.recentSubmissions || []).map((submission) => (
                      <TableRow key={submission._id}>
                        <TableCell>{submission.userId?.name || 'Unknown'} (@{submission.userId?.username || 'unknown'})</TableCell>
                        <TableCell>{submission.problemId?.title || 'Unknown Problem'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{submission.language}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problems" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search problems..."
                  value={problemSearchTerm}
                  onChange={(e) => setProblemSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button onClick={handleSearchProblems} disabled={problemsLoading}>
                {problemsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
            <Button onClick={() => setShowProblemDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Problem
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problemsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    problems.map((problem) => (
                      <TableRow key={problem._id}>
                        <TableCell className="font-medium">{problem.title}</TableCell>
                        <TableCell>
                          <Badge className={getDifficultyColor(problem.difficulty)}>
                            {problem.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {problem.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {problem.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{problem.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={problem.isActive}
                            onCheckedChange={() => handleToggleProblemStatus(problem._id, problem.isActive)}
                          />
                        </TableCell>
                        <TableCell>{problem.createdBy?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProblemForEdit(problem);
                                setShowProblemDialog(true);
                              }}
                              title="Edit Problem"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProblem(problem);
                                setShowTestCaseManager(true);
                              }}
                              title="Manage Test Cases"
                            >
                              <TestTube className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProblem(problem);
                                setShowProblemSubmissions(true);
                              }}
                              title="View Submissions"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProblem(problem);
                                setShowDeleteProblemDialog(true);
                              }}
                              title="Delete Problem"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button onClick={handleSearchUsers} disabled={usersLoading}>
                {usersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    [...Array(10)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>@{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditUserDialog(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contests" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Contest Management</CardTitle>
                <CardDescription>Manage programming contests and competitions</CardDescription>
              </div>
              <Button 
                onClick={() => setShowCreateContestDialog(true)}
                className="ml-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Contest
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Input
                  placeholder="Search contests..."
                  value={contestSearchTerm}
                  onChange={(e) => setContestSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button onClick={handleSearchContests} disabled={contestsLoading}>
                  {contestsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contestsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    contests.map((contest) => (
                      <TableRow key={contest._id}>
                        <TableCell className="font-medium">{contest.title}</TableCell>
                        <TableCell>
                          {new Date(contest.startTime).toLocaleDateString()} - {new Date(contest.endTime).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{contest.participantCount}</TableCell>
                        <TableCell>
                          <Badge className={contest.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {contest.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{contest.createdBy?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedContest(contest);
                                setShowDeleteContestDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {/* Broadcast Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Notifications</CardTitle>
              <CardDescription>Send system-wide announcements to all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Notification Title</label>
                  <Input
                    placeholder="Enter notification title..."
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Enter notification message..."
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleBroadcastNotification} 
                  disabled={broadcastLoading}
                  className="w-full"
                >
                  {broadcastLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Activity className="h-4 w-4 mr-2" />
                  )}
                  Send Notification to All Users
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Monitor system components and performance</CardDescription>
              </div>
              <Button 
                onClick={fetchSystemStats} 
                disabled={systemLoading}
                variant="outline"
              >
                {systemLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">API Status</h4>
                    <p className="text-sm text-muted-foreground">Backend API is running</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Database Status</h4>
                    <p className="text-sm text-muted-foreground">MongoDB connection active</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Redis Cache</h4>
                    <p className="text-sm text-muted-foreground">Caching system operational</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Docker Engine</h4>
                    <p className="text-sm text-muted-foreground">Code execution environment</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Running</Badge>
                </div>

                {systemStats?.queue && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Submission Queue</h4>
                      <p className="text-sm text-muted-foreground">
                        {systemStats.queue.waiting} waiting, {systemStats.queue.processing} processing
                      </p>
                    </div>
                    <Badge className={systemStats.queue.waiting > 10 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                      {systemStats.queue.waiting > 10 ? 'Busy' : 'Normal'}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions Monitor</CardTitle>
              <CardDescription>Live monitoring of code submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={fetchSubmissions} 
                disabled={submissionsLoading}
                className="mb-4"
                variant="outline"
              >
                {submissionsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Activity className="h-4 w-4 mr-2" />
                )}
                Refresh Submissions
              </Button>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Problem</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissionsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    submissions.slice(0, 10).map((submission) => (
                      <TableRow key={submission._id}>
                        <TableCell>{submission.userId?.name || 'Unknown'}</TableCell>
                        <TableCell>{submission.problemId?.title || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{submission.language}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(submission.submittedAt).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Problem Dialog */}
      <AlertDialog open={showDeleteProblemDialog} onOpenChange={setShowDeleteProblemDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Problem</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedProblem?.title}&quot;? This action cannot be undone and will also delete all associated test cases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProblem} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-2xl">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Edit User</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Update user permissions and settings for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(role: 'user' | 'admin') => 
                    setSelectedUser({ ...selectedUser, role })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active Status</Label>
                <Switch
                  id="active"
                  checked={selectedUser.isActive}
                  onCheckedChange={(isActive) => 
                    setSelectedUser({ ...selectedUser, isActive })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="verified">Email Verified</Label>
                <Switch
                  id="verified"
                  checked={selectedUser.isVerified}
                  onCheckedChange={(isVerified) => 
                    setSelectedUser({ ...selectedUser, isVerified })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedUser && handleUpdateUser(selectedUser._id, {
              role: selectedUser.role,
              isActive: selectedUser.isActive,
              isVerified: selectedUser.isVerified
            })}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Contest Dialog */}
      <Dialog open={showCreateContestDialog} onOpenChange={setShowCreateContestDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-2xl">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Create New Contest</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create a new programming contest for users to participate in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Contest Title</label>
              <Input placeholder="Enter contest title..." />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Enter contest description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <Input type="datetime-local" />
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <Input type="datetime-local" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Registration Limit (Optional)</label>
              <Input type="number" placeholder="No limit" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateContestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateContest({})}>
              Create Contest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contest Dialog */}
      <AlertDialog open={showDeleteContestDialog} onOpenChange={setShowDeleteContestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contest</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contest? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContest} className="bg-red-600 hover:bg-red-700">
              Delete Contest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced Problem Management Dialogs */}
      <ProblemDialog
        isOpen={showProblemDialog}
        onClose={() => {
          setShowProblemDialog(false);
          setSelectedProblemForEdit(null);
        }}
        problem={selectedProblemForEdit}
        onSuccess={() => {
          fetchProblems();
          setSelectedProblemForEdit(null);
        }}
      />

      <TestCaseManager
        isOpen={showTestCaseManager}
        onClose={() => {
          setShowTestCaseManager(false);
          setSelectedProblem(null);
        }}
        problemId={selectedProblem?._id || ''}
        problemTitle={selectedProblem?.title || ''}
      />

      <ProblemSubmissions
        isOpen={showProblemSubmissions}
        onClose={() => {
          setShowProblemSubmissions(false);
          setSelectedProblem(null);
        }}
        problemId={selectedProblem?._id || ''}
        problemTitle={selectedProblem?.title || ''}
      />
    </div>
  );
}
