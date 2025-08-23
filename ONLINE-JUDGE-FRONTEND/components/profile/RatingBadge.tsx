'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RatingBadgeProps {
  rating: number
  className?: string
}

// Rating tier system similar to Codeforces/LeetCode
export const getRatingTier = (rating: number) => {
  if (rating < 1200) return { color: 'gray', title: 'Newbie', range: '0-1199' }
  if (rating < 1400) return { color: 'green', title: 'Pupil', range: '1200-1399' }
  if (rating < 1600) return { color: 'cyan', title: 'Specialist', range: '1400-1599' }
  if (rating < 1900) return { color: 'blue', title: 'Expert', range: '1600-1899' }
  if (rating < 2100) return { color: 'purple', title: 'Candidate Master', range: '1900-2099' }
  if (rating < 2300) return { color: 'orange', title: 'Master', range: '2100-2299' }
  if (rating < 2600) return { color: 'red', title: 'International Master', range: '2300-2599' }
  return { color: 'legendary', title: 'Legendary Grandmaster', range: '2600+' }
}

const getRatingStyles = (color: string) => {
  const styles = {
    gray: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
    green: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-700',
    blue: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
    purple: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',
    orange: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
    red: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
    legendary: 'bg-gradient-to-r from-red-500 to-yellow-500 text-white border-transparent hover:from-red-600 hover:to-yellow-600 shadow-lg'
  }
  return styles[color as keyof typeof styles] || styles.gray
}

export function RatingBadge({ rating, className }: RatingBadgeProps) {
  const tier = getRatingTier(rating)
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${getRatingStyles(tier.color)} transition-all duration-200 font-semibold ${className}`}
            role="status"
            aria-label={`Rating: ${rating} (${tier.title})`}
          >
            {tier.title} ({rating})
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">{tier.title}</p>
            <p className="text-sm text-muted-foreground">Rating Range: {tier.range}</p>
            <p className="text-xs mt-1">Current: {rating}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
