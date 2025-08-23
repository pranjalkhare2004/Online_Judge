'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  description?: string;
  isSolved?: boolean;
  timeLimit?: number;
  memoryLimit?: number;
}

interface ProblemListProps {
  problems: Problem[];
  loading?: boolean;
  showDescription?: boolean;
  className?: string;
}

const difficultyColors = {
  Easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  Hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const difficultyBorderColors = {
  Easy: 'border-l-green-500',
  Medium: 'border-l-yellow-500',
  Hard: 'border-l-red-500',
};

export default function ProblemList({ 
  problems, 
  loading = false, 
  showDescription = false,
  className 
}: ProblemListProps) {
  const [sortBy, setSortBy] = useState<'title' | 'difficulty' | 'acceptance'>('title');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!problems || problems.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="rounded-full bg-muted p-4 mb-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Problems Found</h3>
          <p className="text-muted-foreground text-center">
            There are no problems available at the moment. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter and sort problems
  const filteredProblems = problems
    .filter(problem => 
      filterDifficulty === 'all' || problem.difficulty === filterDifficulty
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'difficulty':
          const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'acceptance':
          return b.acceptanceRate - a.acceptanceRate;
        case 'title':
        default:
          return a.title.localeCompare(b.title);
      }
    });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <select 
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-1 rounded-md border bg-background text-sm"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'title' | 'difficulty' | 'acceptance')}
            className="px-3 py-1 rounded-md border bg-background text-sm"
          >
            <option value="title">Sort by Title</option>
            <option value="difficulty">Sort by Difficulty</option>
            <option value="acceptance">Sort by Acceptance Rate</option>
          </select>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Problems Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProblems.map((problem) => (
          <Card 
            key={problem._id} 
            className={cn(
              'transition-all hover:shadow-md border-l-4',
              difficultyBorderColors[problem.difficulty],
              problem.isSolved && 'bg-green-50 dark:bg-green-950'
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight mb-2 group">
                    <Link 
                      href={`/problems/${problem.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {problem.isSolved && (
                        <CheckCircle className="inline mr-2 h-4 w-4 text-green-600" />
                      )}
                      {problem.title}
                    </Link>
                  </CardTitle>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={difficultyColors[problem.difficulty]}>
                      {problem.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {showDescription && problem.description && (
                <CardDescription className="line-clamp-2">
                  {problem.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Tags */}
              {problem.tags && problem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {problem.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {problem.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{problem.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Stats */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{problem.totalSubmissions} submissions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{problem.acceptanceRate.toFixed(1)}% accepted</span>
                  </div>
                </div>
                
                {/* Acceptance Rate Progress */}
                <div className="space-y-1">
                  <Progress value={problem.acceptanceRate} className="h-2" />
                </div>
                
                {/* Time and Memory Limits */}
                {(problem.timeLimit || problem.memoryLimit) && (
                  <div className="flex items-center gap-4 text-xs">
                    {problem.timeLimit && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{problem.timeLimit}ms</span>
                      </div>
                    )}
                    {problem.memoryLimit && (
                      <div className="flex items-center gap-1">
                        <span>{problem.memoryLimit}MB</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Action Button */}
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/problems/${problem.slug}`}>
                    {problem.isSolved ? 'Review Solution' : 'Solve Problem'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
