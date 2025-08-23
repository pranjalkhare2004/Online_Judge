'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Trophy, 
  Star, 
  Flame, 
  Zap, 
  Target, 
  Crown, 
  Shield, 
  Award,
  CheckCircle,
  Lock,
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'solver' | 'streak' | 'contest' | 'speed' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: string
  progress?: number
  requirement?: number
  points: number
}

interface AchievementSystemProps {
  achievements: Achievement[]
  totalPoints: number
}

// Comprehensive achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // Solver Achievements
  {
    id: 'first-blood',
    name: 'First Blood',
    description: 'Solved your first problem',
    icon: '🎯',
    category: 'solver',
    rarity: 'common',
    points: 10
  },
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: 'Solved 10 problems',
    icon: '🧩',
    category: 'solver',
    rarity: 'common',
    requirement: 10,
    points: 25
  },
  {
    id: 'dedicated-coder',
    name: 'Dedicated Coder',
    description: 'Solved 50 problems',
    icon: '👨‍💻',
    category: 'solver',
    rarity: 'rare',
    requirement: 50,
    points: 100
  },
  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Solved 100 problems',
    icon: '💯',
    category: 'solver',
    rarity: 'epic',
    requirement: 100,
    points: 250
  },
  {
    id: 'elite-solver',
    name: 'Elite Solver',
    description: 'Solved 500 problems',
    icon: '🏆',
    category: 'solver',
    rarity: 'legendary',
    requirement: 500,
    points: 1000
  },

  // Streak Achievements
  {
    id: 'consistent',
    name: 'Consistent',
    description: 'Maintained a 3-day streak',
    icon: '📅',
    category: 'streak',
    rarity: 'common',
    requirement: 3,
    points: 15
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintained a 7-day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'rare',
    requirement: 7,
    points: 50
  },
  {
    id: 'month-master',
    name: 'Month Master',
    description: 'Maintained a 30-day streak',
    icon: '🌟',
    category: 'streak',
    rarity: 'epic',
    requirement: 30,
    points: 200
  },
  {
    id: 'year-veteran',
    name: 'Year Veteran',
    description: 'Maintained a 365-day streak',
    icon: '👑',
    category: 'streak',
    rarity: 'legendary',
    requirement: 365,
    points: 1500
  },

  // Contest Achievements
  {
    id: 'contest-debut',
    name: 'Contest Debut',
    description: 'Participated in your first contest',
    icon: '🏟️',
    category: 'contest',
    rarity: 'common',
    points: 20
  },
  {
    id: 'top-performer',
    name: 'Top Performer',
    description: 'Finished in top 10% of a contest',
    icon: '🥇',
    category: 'contest',
    rarity: 'rare',
    points: 100
  },
  {
    id: 'contest-winner',
    name: 'Contest Winner',
    description: 'Won a contest (1st place)',
    icon: '👑',
    category: 'contest',
    rarity: 'legendary',
    points: 500
  },

  // Speed Achievements
  {
    id: 'lightning-fast',
    name: 'Lightning Fast',
    description: 'Solved a problem in under 1 minute',
    icon: '⚡',
    category: 'speed',
    rarity: 'rare',
    points: 75
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Solved 10 problems in under 2 minutes each',
    icon: '🏃‍♂️',
    category: 'speed',
    rarity: 'epic',
    requirement: 10,
    points: 200
  },

  // Special Achievements
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Achieved 100% accuracy in 10 consecutive submissions',
    icon: '💎',
    category: 'special',
    rarity: 'legendary',
    requirement: 10,
    points: 300
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Solved problems in 5 different languages',
    icon: '🌍',
    category: 'special',
    rarity: 'epic',
    requirement: 5,
    points: 150
  }
]

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return {
        badge: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200',
        border: 'border-gray-300 dark:border-gray-600',
        bg: 'bg-gray-50 dark:bg-gray-800/50'
      }
    case 'rare':
      return {
        badge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200',
        border: 'border-blue-300 dark:border-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-900/50'
      }
    case 'epic':
      return {
        badge: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200',
        border: 'border-purple-300 dark:border-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-900/50'
      }
    case 'legendary':
      return {
        badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200',
        border: 'border-amber-300 dark:border-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-900/50'
      }
    default:
      return {
        badge: 'bg-gray-100 text-gray-800 border-gray-300',
        border: 'border-gray-300',
        bg: 'bg-gray-50'
      }
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'solver':
      return <Target className="h-4 w-4" />
    case 'streak':
      return <Flame className="h-4 w-4" />
    case 'contest':
      return <Trophy className="h-4 w-4" />
    case 'speed':
      return <Zap className="h-4 w-4" />
    case 'special':
      return <Sparkles className="h-4 w-4" />
    default:
      return <Award className="h-4 w-4" />
  }
}

export function AchievementSystem({ achievements, totalPoints }: AchievementSystemProps) {
  const unlockedAchievements = achievements.filter(a => a.unlockedAt)
  const inProgressAchievements = achievements.filter(a => !a.unlockedAt && a.progress !== undefined)
  const lockedAchievements = achievements.filter(a => !a.unlockedAt && a.progress === undefined)

  const categories = ['solver', 'streak', 'contest', 'speed', 'special']
  const rarities = ['common', 'rare', 'epic', 'legendary']

  return (
    <div className="space-y-6">
      
      {/* Achievement Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievement Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-emerald-600">{unlockedAchievements.length}</div>
              <div className="text-sm text-muted-foreground">Unlocked</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-amber-600">{inProgressAchievements.length}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Completion</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Unlocked Achievements ({unlockedAchievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlockedAchievements.map((achievement) => {
                const colors = getRarityColor(achievement.rarity)
                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg} relative overflow-hidden`}
                  >
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{achievement.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs border ${colors.badge}`}>
                            {achievement.rarity}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getCategoryIcon(achievement.category)}
                            <span className="capitalize">{achievement.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        +{achievement.points} points
                      </span>
                      {achievement.unlockedAt && (
                        <span className="text-muted-foreground">
                          {format(new Date(achievement.unlockedAt), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress Achievements */}
      {inProgressAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-600" />
              In Progress ({inProgressAchievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgressAchievements.map((achievement) => {
                const colors = getRarityColor(achievement.rarity)
                const progressPercentage = achievement.requirement 
                  ? ((achievement.progress || 0) / achievement.requirement) * 100 
                  : 0
                
                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg}`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-2xl opacity-75">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{achievement.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={`text-xs border ${colors.badge}`}>
                            {achievement.rarity}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getCategoryIcon(achievement.category)}
                            <span className="capitalize">{achievement.category}</span>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <Progress value={progressPercentage} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {achievement.progress}/{achievement.requirement}
                            </span>
                            <span>+{achievement.points} points</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Locked Achievements ({lockedAchievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedAchievements.slice(0, 6).map((achievement) => {
                const colors = getRarityColor(achievement.rarity)
                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg} opacity-60`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl grayscale">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{achievement.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs border ${colors.badge}`}>
                            {achievement.rarity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            +{achievement.points} points
                          </span>
                        </div>
                      </div>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )
              })}
            </div>
            {lockedAchievements.length > 6 && (
              <div className="text-center mt-4">
                <Button variant="outline" size="sm">
                  View All Locked Achievements ({lockedAchievements.length - 6} more)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AchievementSystem
