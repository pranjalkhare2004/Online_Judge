/**
 * DASHBOARD LOADING COMPONENT - SKELETON LOADING STATE
 * 
 * DESCRIPTION:
 * This component provides a comprehensive skeleton loading interface that mimics
 * the structure of the main dashboard while data is being fetched. It creates
 * placeholder elements with animated shimmer effects to maintain layout
 * structure and provide visual feedback during loading states. The component
 * matches the exact layout of dashboard cards, charts, and content areas.
 * 
 * FUNCTIONALITY:
 * - Skeleton placeholders for all major dashboard sections
 * - Animated pulse effects on loading elements
 * - Maintains responsive grid layouts during load
 * - Prevents layout shift when real content loads
 * - Provides visual hierarchy with varied skeleton sizes
 * - Covers welcome section, statistics, activities, and submissions
 * - Responsive design matching actual dashboard layout
 * 
 * SKELETON SECTIONS:
 * 1. Welcome Section - Page title and subtitle placeholders
 * 2. Statistics Cards - 4-card grid with metrics placeholders
 * 3. Recent Activity - Activity list with user actions
 * 4. Quick Actions - Action button placeholders
 * 5. Performance Chart - Chart visualization placeholders
 * 6. Recent Submissions - Submission history placeholders
 * 
 * UI ELEMENTS & COMPONENTS:
 * Welcome Section:
 * - Main title skeleton (h-8 w-64)
 * - Subtitle skeleton (h-4 w-48)
 * - Proper spacing between elements
 * 
 * Statistics Cards Grid (4 cards):
 * - Card headers with title and icon placeholders
 * - Main metric skeletons (h-7 w-16)
 * - Description skeletons (h-3 w-20)
 * - Responsive grid: 1 column mobile, 2 tablet, 4 desktop
 * 
 * Recent Activity Section (5 items):
 * - User avatar placeholder (h-8 w-8 rounded)
 * - Activity description (h-4 w-48)
 * - Timestamp placeholder (h-3 w-24)
 * - Status badge placeholder (h-6 w-16)
 * - Proper spacing with flex layouts
 * 
 * Quick Actions Card (3 actions):
 * - Action button skeletons (h-10 w-full)
 * - Consistent spacing between actions
 * - Full-width button placeholders
 * 
 * Performance Chart Card:
 * - Chart title placeholder
 * - Multiple progress bar placeholders (h-2 w-full)
 * - Label and value pairs for each metric
 * - Simulates data visualization layout
 * 
 * Recent Submissions Section (3 submissions):
 * - Problem icon placeholder (h-8 w-8 rounded)
 * - Problem title skeleton (h-4 w-48)
 * - Submission details (h-3 w-24)
 * - Status and timing placeholders
 * - Border and padding matching actual content
 * 
 * RESPONSIVE DESIGN:
 * Grid Layouts:
 * - Statistics: gap-4 md:grid-cols-2 lg:grid-cols-4
 * - Main content: gap-6 lg:grid-cols-3 (2:1 ratio)
 * - Adapts to screen sizes with proper breakpoints
 * 
 * Spacing System:
 * - Container: py-8 space-y-8 for vertical rhythm
 * - Cards: space-y-4 for internal spacing
 * - Items: space-x-3 for horizontal alignment
 * 
 * ANIMATION EFFECTS:
 * Skeleton Animations:
 * - Built-in animate-pulse class for shimmer effect
 * - Consistent animation timing across all elements
 * - Maintains visual interest during loading
 * - Smooth transitions when content loads
 * 
 * LAYOUT STRUCTURE:
 * Container Layout:
 * - Full container width with responsive margins
 * - Vertical spacing with space-y-8
 * - Proper section separation
 * 
 * Card Components:
 * - Uses shadcn/ui Card components for consistency
 * - CardHeader and CardContent maintain structure
 * - Separator components for visual breaks
 * 
 * SKELETON SIZING:
 * Size Variations:
 * - Titles: h-6 to h-8 (24px to 32px height)
 * - Subtitles: h-4 (16px height)
 * - Small text: h-3 (12px height)
 * - Metrics: h-7 (28px height)
 * - Buttons: h-10 (40px height)
 * - Progress bars: h-2 (8px height)
 * 
 * Width Variations:
 * - Short labels: w-16 to w-28
 * - Medium content: w-32 to w-48
 * - Long content: w-64+
 * - Full width: w-full for containers
 * 
 * ACCESSIBILITY:
 * - Maintains semantic structure during loading
 * - Screen readers can navigate skeleton layout
 * - Visual hierarchy preserved with sizing
 * - No interactive elements during loading state
 * 
 * PERFORMANCE BENEFITS:
 * - Prevents cumulative layout shift (CLS)
 * - Provides immediate visual feedback
 * - Maintains user engagement during data fetch
 * - Smooth transition to actual content
 * - Reduces perceived loading time
 * 
 * COMPONENT INTEGRATION:
 * - Integrates with Next.js 14 loading.tsx pattern
 * - Used by page-level route loading states
 * - Compatible with Suspense boundaries
 * - Works with streaming SSR
 * 
 * USED BY:
 * - Dashboard page during initial load
 * - Any page requiring comprehensive loading state
 * - Route transitions with data fetching
 * - Components with complex data dependencies
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Performance Chart */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
