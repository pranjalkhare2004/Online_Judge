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
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Search, Filter, ArrowUpDown, BookmarkPlus, CheckCircle, Star, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const ProblemsPage: React.FC = () => {
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
  const [loading, setLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);

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
        toast({
          title: 'Error',
          description: 'Failed to fetch problems',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch problems. Please try again.',
        variant: 'destructive'
      });
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

  const handleSearch = (searchTerm: string) => {
    handleFilterChange('search', searchTerm);
  };

  const handleTagToggle = (tagName: string) => {
    const newTags = filters.tags?.includes(tagName)
      ? filters.tags.filter(t => t !== tagName)
      : [...(filters.tags || []), tagName];
    handleFilterChange('tags', newTags);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const clearAllFilters = () => {
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
  };

  // Memoized computed values
  const hasActiveFilters = useMemo(() => {
    return filters.difficulty !== 'All' ||
           filters.search !== '' ||
           (filters.tags && filters.tags.length > 0) ||
           filters.acceptanceRateMin !== 0 ||
           filters.acceptanceRateMax !== 100 ||
           filters.solved !== undefined;
  }, [filters]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Medium': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'Hard': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getAcceptanceRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 40) return 'text-orange-600';
    return 'text-red-600';
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Problems</h1>
        <p className="text-gray-600 mb-4">
          Explore and practice coding problems from our collection
        </p>
        
        {/* Results summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1}-
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} problems
          </p>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-sm"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search problems..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={filters.difficulty}
                  onValueChange={(value) => handleFilterChange('difficulty', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Difficulties</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                  {tagsLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-6 w-full" />
                      ))}
                    </div>
                  ) : (
                    availableTags.map((tag) => (
                      <div key={tag._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={tag._id}
                          checked={filters.tags?.includes(tag.name) || false}
                          onCheckedChange={() => handleTagToggle(tag.name)}
                        />
                        <label
                          htmlFor={tag._id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                        >
                          {tag.name} ({tag.count})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Acceptance Rate Range */}
              <div className="space-y-2">
                <Label>Acceptance Rate (%)</Label>
                <div className="px-2">
                  <Slider
                    value={[filters.acceptanceRateMin || 0, filters.acceptanceRateMax || 100]}
                    onValueChange={([min, max]) => {
                      setFilters(prev => ({ ...prev, acceptanceRateMin: min, acceptanceRateMax: max }));
                    }}
                    onValueCommit={([min, max]) => {
                      handleFilterChange('acceptanceRateMin', min);
                      handleFilterChange('acceptanceRateMax', max);
                    }}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{filters.acceptanceRateMin}%</span>
                    <span>{filters.acceptanceRateMax}%</span>
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.solved === undefined ? 'all' : filters.solved.toString()}
                  onValueChange={(value) => {
                    const solved = value === 'all' ? undefined : value === 'true';
                    handleFilterChange('solved', solved);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Problems</SelectItem>
                    <SelectItem value="true">Solved</SelectItem>
                    <SelectItem value="false">Unsolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Problems List */}
        <div className="lg:col-span-3">
          {/* Sort Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="sort">Sort by:</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="difficulty">Difficulty</SelectItem>
                    <SelectItem value="acceptanceRate">Acceptance Rate</SelectItem>
                    <SelectItem value="totalSubmissions">Submissions</SelectItem>
                    <SelectItem value="createdAt">Date Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="limit">Per page:</Label>
              <Select
                value={filters.limit?.toString()}
                onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Problems Grid */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : problems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No problems found</h3>
                  <p>Try adjusting your filters or search terms</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {problems.map((problem) => (
                <Card key={problem._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link
                            href={`/problems/${problem.slug}`}
                            className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {problem.title}
                          </Link>
                          {solvedProblems.includes(problem._id) && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {problem.isFeatured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <Badge className={getDifficultyColor(problem.difficulty)}>
                            {problem.difficulty}
                          </Badge>
                          <span className={`text-sm font-medium ${getAcceptanceRateColor(problem.acceptanceRate)}`}>
                            {problem.acceptanceRate}% Acceptance Rate
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {problem.totalSubmissions.toLocaleString()} submissions
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {problem.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="cursor-pointer hover:bg-blue-50"
                              onClick={() => handleTagToggle(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2">
                          {problem.description ? problem.description.slice(0, 150) + '...' : 'No description available'}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <BookmarkPlus className="h-4 w-4 mr-2" />
                              Add to List
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>Create New List</DropdownMenuItem>
                            <Separator />
                            <DropdownMenuItem disabled>
                              No custom lists yet
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-500">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => handlePageChange(1)}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm">
                  {pagination.currentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => handlePageChange(pagination.totalPages)}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemsPage;
