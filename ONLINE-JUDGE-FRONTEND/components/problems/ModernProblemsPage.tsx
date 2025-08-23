'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { problemAPI, Problem, PaginationInfo, TagData, FilterOptions } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/lib/toast-utils';
import { useAuth } from '@/contexts/auth-context';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  BookmarkPlus, 
  CheckCircle, 
  Star, 
  TrendingUp, 
  Grid3X3,
  List,
  Heart,
  Share2,
  Clock,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Settings,
  Target,
  Zap,
  Bookmark,
  Award,
  Calendar,
  BarChart3,
  Lightbulb,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Link from 'next/link';

interface ProblemList {
  id: string;
  name: string;
  description: string;
  problemCount: number;
  isDefault: boolean;
  color: string;
}

const ModernProblemsPage: React.FC = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // State management
  const [problems, setProblems] = useState<Problem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit: 20
  });
  const [availableTags, setAvailableTags] = useState<TagData[]>([]);
  const [solvedProblems, setSolvedProblems] = useState<string[]>([]);
  const [favoriteProblems, setFavoriteProblems] = useState<string[]>([]);
  const [userLists, setUserLists] = useState<ProblemList[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    limit: 20,
    difficulty: 'All',
    search: '',
    tags: [],
    acceptanceRateMin: 0,
    acceptanceRateMax: 100,
    sortBy: 'title',
    sortOrder: 'asc',
    solved: undefined
  });

  // Default problem lists
  const defaultLists: ProblemList[] = [
    { id: 'favorites', name: 'Favorites', description: 'Your bookmarked problems', problemCount: favoriteProblems.length, isDefault: true, color: 'bg-red-500' },
    { id: 'todo', name: 'To Do', description: 'Problems to solve later', problemCount: 0, isDefault: true, color: 'bg-blue-500' },
    { id: 'interview', name: 'Interview Prep', description: 'Common interview questions', problemCount: 0, isDefault: true, color: 'bg-green-500' },
    { id: 'recent', name: 'Recently Viewed', description: 'Recently accessed problems', problemCount: 0, isDefault: true, color: 'bg-purple-500' }
  ];

  // Quick filter presets
  const quickFilters = [
    { name: 'Beginner Friendly', filters: { difficulty: 'Easy', acceptanceRateMin: 60 } },
    { name: 'Interview Prep', tags: ['Array', 'String', 'Hash Table', 'Two Pointers'] },
    { name: 'Unsolved Only', filters: { solved: false } },
    { name: 'High Acceptance', filters: { acceptanceRateMin: 70 } }
  ];

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: FilterOptions = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      difficulty: searchParams.get('difficulty') || 'All',
      search: searchParams.get('search') || '',
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
      acceptanceRateMin: parseInt(searchParams.get('minAcceptance') || '0'),
      acceptanceRateMax: parseInt(searchParams.get('maxAcceptance') || '100'),
      sortBy: searchParams.get('sortBy') || 'title',
      sortOrder: searchParams.get('sortOrder') || 'asc',
      solved: searchParams.get('solved') ? searchParams.get('solved') === 'true' : undefined
    };
    setFilters(urlFilters);
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = (newFilters: FilterOptions) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'All') {
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(','));
        } else if (!Array.isArray(value)) {
          params.set(key, value.toString());
        }
      }
    });

    const newURL = `${window.location.pathname}?${params.toString()}`;
    router.replace(newURL);
  };

  // Fetch problems
  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await problemAPI.getProblems(filters);
      
      if (response.success && response.data) {
        setProblems(response.data.problems);
        setPagination(response.data.pagination);
      } else {
        showErrorToast('Failed to fetch problems');
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      showErrorToast('Failed to fetch problems. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch available tags
  const fetchTags = useCallback(async () => {
    try {
      setTagsLoading(true);
      const response = await problemAPI.getPopularTags();
      if (response.success && response.data?.tags) {
        setAvailableTags(response.data.tags);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setTagsLoading(false);
    }
  }, []);

  // Fetch solved problems for authenticated users
  const fetchSolvedProblems = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await problemAPI.getSolvedProblems();
      if (response.success && response.data?.solvedProblems) {
        setSolvedProblems(response.data.solvedProblems);
      }
    } catch (error) {
      console.error('Failed to fetch solved problems:', error);
    }
  }, [user]);

  // Effects
  useEffect(() => {
    fetchProblems();
  }, [filters]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchSolvedProblems();
  }, [user]);

  // Filter handlers
  const handleFilterChange = (key: keyof FilterOptions, value: string | number | boolean | string[] | undefined) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleQuickFilter = (quickFilter: any) => {
    const newFilters = { ...filters, ...quickFilter.filters, tags: quickFilter.tags || filters.tags, page: 1 };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleTagToggle = (tagName: string) => {
    const newTags = filters.tags?.includes(tagName)
      ? filters.tags.filter(t => t !== tagName)
      : [...(filters.tags || []), tagName];
    handleFilterChange('tags', newTags);
  };

  const toggleFavorite = (problemId: string) => {
    setFavoriteProblems(prev => 
      prev.includes(problemId) 
        ? prev.filter(id => id !== problemId)
        : [...prev, problemId]
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedProblems.length === 0) {
      showWarningToast('Please select problems to perform bulk actions');
      return;
    }
    
    // Handle bulk actions
    showSuccessToast(`${action} applied to ${selectedProblems.length} problems`);
    setSelectedProblems([]);
  };

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return filters.difficulty !== 'All' ||
           filters.search !== '' ||
           (filters.tags && filters.tags.length > 0) ||
           filters.acceptanceRateMin !== 0 ||
           filters.acceptanceRateMax !== 100 ||
           filters.solved !== undefined;
  }, [filters]);

  const userStats = useMemo(() => {
    const totalSolved = solvedProblems.length;
    const totalProblems = pagination.totalCount;
    const progressPercentage = totalProblems > 0 ? (totalSolved / totalProblems) * 100 : 0;
    
    return { totalSolved, totalProblems, progressPercentage };
  }, [solvedProblems, pagination.totalCount]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-100';
      case 'Medium': return 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100';
      case 'Hard': return 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-900 dark:text-rose-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getAcceptanceRateColor = (rate: number) => {
    if (rate >= 70) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  // Render loading skeleton
  if (loading && problems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Problems Collection
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                {user ? `Welcome back, ${user.username}!` : 'Explore and practice coding problems'} 
              </p>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{userStats.totalSolved}</div>
                        <div className="text-xs opacity-90">Solved</div>
                      </div>
                      <div className="h-8 w-px bg-white/20"></div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{userStats.totalProblems}</div>
                        <div className="text-xs opacity-90">Total</div>
                      </div>
                      <div className="h-8 w-px bg-white/20"></div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{Math.round(userStats.progressPercentage)}%</div>
                        <div className="text-xs opacity-90">Progress</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {/* Quick Filter Presets */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Quick Filters:</span>
              {quickFilters.map((quickFilter) => (
                <Button
                  key={quickFilter.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFilter(quickFilter)}
                  className="hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {quickFilter.name}
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">View:</span>
              <div className="flex border rounded-lg p-1 bg-background">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-7 px-2"
                >
                  <Grid3X3 className="h-3 w-3" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-7 px-2"
                >
                  <List className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Lists Management */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  My Lists
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Problem Lists</DialogTitle>
                  <DialogDescription>
                    Organize your problems into custom lists
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {defaultLists.map((list) => (
                    <Card key={list.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`w-3 h-3 rounded-full ${list.color} mt-1`}></div>
                          <div className="flex-1">
                            <h3 className="font-medium">{list.name}</h3>
                            <p className="text-sm text-muted-foreground">{list.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {list.problemCount} problems
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Filters Sidebar */}
          <div className={`lg:col-span-1 space-y-6 ${filtersCollapsed ? 'hidden lg:block' : ''}`}>
            <Card className="bg-background/60 backdrop-blur-sm border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    Filters
                  </div>
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const defaultFilters: FilterOptions = {
                          page: 1,
                          limit: 20,
                          difficulty: 'All',
                          search: '',
                          tags: [],
                          acceptanceRateMin: 0,
                          acceptanceRateMax: 100,
                          sortBy: 'title',
                          sortOrder: 'asc',
                          solved: undefined
                        };
                        setFilters(defaultFilters);
                        updateURL(defaultFilters);
                      }}
                      className="text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Search */}
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm font-medium">Search Problems</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by title, tags, or description..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>

                {/* Difficulty with Visual Indicators */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Difficulty Level</Label>
                  <Select
                    value={filters.difficulty}
                    onValueChange={(value) => handleFilterChange('difficulty', value)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Difficulties</SelectItem>
                      <SelectItem value="Easy">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span>Easy</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          <span>Medium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Hard">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                          <span>Hard</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select
                    value={filters.solved === undefined ? 'All' : filters.solved ? 'Solved' : 'Unsolved'}
                    onValueChange={(value) => {
                      if (value === 'All') {
                        handleFilterChange('solved', undefined);
                      } else {
                        handleFilterChange('solved', value === 'Solved');
                      }
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Problems</SelectItem>
                      <SelectItem value="Solved">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Solved</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Unsolved">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Unsolved</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Acceptance Rate Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Acceptance Rate</Label>
                    <span className="text-xs text-muted-foreground">
                      {filters.acceptanceRateMin}% - {filters.acceptanceRateMax}%
                    </span>
                  </div>
                  <div className="px-2">
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[filters.acceptanceRateMin, filters.acceptanceRateMax]}
                      onValueChange={([min, max]) => {
                        handleFilterChange('acceptanceRateMin', min);
                        handleFilterChange('acceptanceRateMax', max);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Collapsible Tags Section */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <Label className="text-sm font-medium cursor-pointer">Tags</Label>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 mt-3">
                    <ScrollArea className="h-48 border rounded-md p-3 bg-muted/30">
                      {tagsLoading ? (
                        <div className="space-y-2">
                          {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-6 w-full" />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {availableTags.map((tag) => (
                            <div key={tag._id} className="flex items-center space-x-2">
                              <Checkbox
                                id={tag._id}
                                checked={filters.tags?.includes(tag.name) || false}
                                onCheckedChange={() => handleTagToggle(tag.name)}
                              />
                              <label
                                htmlFor={tag._id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer flex items-center justify-between"
                              >
                                <span>{tag.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {tag.count}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    {filters.tags && filters.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {filters.tags.map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="default" 
                            className="text-xs cursor-pointer"
                            onClick={() => handleTagToggle(tag)}
                          >
                            {tag}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Sort Options */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => handleFilterChange('sortBy', value)}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="difficulty">Difficulty</SelectItem>
                        <SelectItem value="acceptanceRate">Acceptance</SelectItem>
                        <SelectItem value="totalSubmissions">Popularity</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.sortOrder}
                      onValueChange={(value) => handleFilterChange('sortOrder', value)}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1}-
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} problems
                </p>
                {selectedProblems.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{selectedProblems.length} selected</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Bulk Actions
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleBulkAction('Add to Favorites')}>
                          <Heart className="h-4 w-4 mr-2" />
                          Add to Favorites
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkAction('Add to List')}>
                          <BookmarkPlus className="h-4 w-4 mr-2" />
                          Add to List
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSelectedProblems([])}>
                          <X className="h-4 w-4 mr-2" />
                          Clear Selection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                {filtersCollapsed ? 'Show' : 'Hide'} Filters
              </Button>
            </div>

            {/* Problems Display */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : problems.length === 0 ? (
              <Card className="bg-background/60 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <div className="text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No problems found</h3>
                    <p>Try adjusting your filters or search terms</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {problems.map((problem) => (
                  <Card 
                    key={problem._id} 
                    className="group hover:shadow-lg transition-all duration-200 bg-background/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {/* Selection Checkbox */}
                          <Checkbox
                            checked={selectedProblems.includes(problem._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProblems(prev => [...prev, problem._id]);
                              } else {
                                setSelectedProblems(prev => prev.filter(id => id !== problem._id));
                              }
                            }}
                            className="mt-1"
                          />

                          {/* Problem Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Link
                                href={`/problems/${problem.slug}`}
                                className="text-xl font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                              >
                                {problem.title}
                              </Link>
                              
                              {/* Status Indicators */}
                              <div className="flex items-center space-x-2">
                                {solvedProblems.includes(problem._id) && (
                                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                                )}
                                {favoriteProblems.includes(problem._id) && (
                                  <Heart className="h-5 w-5 text-rose-500 fill-current" />
                                )}
                                {problem.isFeatured && (
                                  <Star className="h-5 w-5 text-amber-500 fill-current" />
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-4">
                              <Badge className={getDifficultyColor(problem.difficulty)}>
                                {problem.difficulty}
                              </Badge>
                              <span className={`text-sm font-medium ${getAcceptanceRateColor(problem.acceptanceRate)}`}>
                                {problem.acceptanceRate}% Acceptance
                              </span>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                {problem.totalSubmissions.toLocaleString()} submissions
                              </span>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                24 discussions
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {problem.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="cursor-pointer hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950 dark:hover:border-blue-800 transition-colors"
                                  onClick={() => handleTagToggle(tag)}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {problem.description ? problem.description.slice(0, 200) + '...' : 'Click to view problem description'}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(problem._id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Heart className={`h-4 w-4 ${favoriteProblems.includes(problem._id) ? 'text-rose-500 fill-current' : ''}`} />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <BookmarkPlus className="h-4 w-4 mr-2" />
                                Add to List
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {defaultLists.map((list) => (
                                <DropdownMenuItem key={list.id}>
                                  <div className={`w-2 h-2 rounded-full ${list.color} mr-2`}></div>
                                  {list.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Plus className="h-4 w-4 mr-2" />
                                Create New List
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Solutions
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Discussions
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share Problem
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Enhanced Pagination */}
            {pagination.totalPages > 1 && (
              <Card className="bg-background/60 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasPrev}
                        onClick={() => {
                          const newFilters = { ...filters, page: 1 };
                          setFilters(newFilters);
                          updateURL(newFilters);
                        }}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasPrev}
                        onClick={() => {
                          const newFilters = { ...filters, page: pagination.currentPage - 1 };
                          setFilters(newFilters);
                          updateURL(newFilters);
                        }}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = pagination.currentPage - 2 + i;
                          if (pageNum < 1 || pageNum > pagination.totalPages) return null;
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === pagination.currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const newFilters = { ...filters, page: pageNum };
                                setFilters(newFilters);
                                updateURL(newFilters);
                              }}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasNext}
                        onClick={() => {
                          const newFilters = { ...filters, page: pagination.currentPage + 1 };
                          setFilters(newFilters);
                          updateURL(newFilters);
                        }}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasNext}
                        onClick={() => {
                          const newFilters = { ...filters, page: pagination.totalPages };
                          setFilters(newFilters);
                          updateURL(newFilters);
                        }}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernProblemsPage;
