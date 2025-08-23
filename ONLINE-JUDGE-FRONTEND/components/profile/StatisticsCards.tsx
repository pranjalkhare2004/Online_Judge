'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Code, 
  Trophy, 
  Target, 
  TrendingUp
} from 'lucide-react'

interface StatisticsData {
  problemsSolved: number
  contests: number
  streak: number
  rank?: number
  totalUsers?: number
  rating: number
  solvedToday?: number
}

interface StatisticsCardsProps {
  stats: StatisticsData
  loading?: boolean
  error?: string
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: string
  loading?: boolean
}

function StatCard({ title, value, subtitle, icon, color = 'primary', loading }: StatCardProps) {
  if (loading) {
    return (
      <Card className="transition-all duration-300 hover:scale-105 hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="transition-all duration-300 hover:scale-105 hover:shadow-md cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`text-${color} group-hover:scale-110 transition-transform duration-200`}>
            {icon}
          </div>
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        
        <div className="text-2xl font-bold mb-1" role="status" aria-label={`${title}: ${value}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        {subtitle && (
          <div className="text-sm text-muted-foreground">
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatisticsCards({ stats, loading, error }: StatisticsCardsProps) {
  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="opacity-50">
            <CardContent className="p-6">
              <div className="text-center py-4 text-muted-foreground">
                <span className="text-sm">Failed to load</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Problems Solved',
      value: stats.problemsSolved || 0,
      subtitle: stats.solvedToday ? `+${stats.solvedToday} today` : undefined,
      icon: <Code className="h-5 w-5" />,
      color: 'green-600'
    },
    {
      title: 'Contests',
      value: stats.contests || 0,
      subtitle: 'Participated',
      icon: <Trophy className="h-5 w-5" />,
      color: 'yellow-600'
    },
    {
      title: 'Current Streak',
      value: `${stats.streak || 0} days`,
      subtitle: 'Keep it up!',
      icon: <Target className="h-5 w-5" />,
      color: 'blue-600'
    },
    {
      title: 'Global Rank',
      value: stats.rank ? `#${stats.rank.toLocaleString()}` : 'Unranked',
      subtitle: stats.totalUsers ? `of ${stats.totalUsers.toLocaleString()}` : undefined,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'purple-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          color={card.color}
          loading={loading}
        />
      ))}
    </div>
  )
}
