'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'
import { TrendingUp, Code2, Trophy, Target } from 'lucide-react'

interface ChartData {
  name: string
  value: number
  submissions?: number
  rating?: number
}

interface ActivityChartsProps {
  submissionData?: ChartData[]
  languageData?: ChartData[]
  difficultyData?: ChartData[]
  ratingData?: ChartData[]
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899'
}

export function ActivityCharts({ 
  submissionData = [], 
  languageData = [], 
  difficultyData = [],
  ratingData = []
}: ActivityChartsProps) {
  
  // Mock data if not provided
  const defaultSubmissionData = [
    { name: 'Jan', submissions: 12, rating: 1200 },
    { name: 'Feb', submissions: 19, rating: 1250 },
    { name: 'Mar', submissions: 23, rating: 1300 },
    { name: 'Apr', submissions: 18, rating: 1280 },
    { name: 'May', submissions: 25, rating: 1350 },
    { name: 'Jun', submissions: 30, rating: 1420 },
  ]

  const defaultLanguageData = [
    { name: 'Python', value: 45, color: COLORS.primary },
    { name: 'JavaScript', value: 25, color: COLORS.warning },
    { name: 'C++', value: 20, color: COLORS.success },
    { name: 'Java', value: 10, color: COLORS.error },
  ]

  const defaultDifficultyData = [
    { name: 'Easy', value: 60, color: COLORS.success },
    { name: 'Medium', value: 35, color: COLORS.warning },
    { name: 'Hard', value: 12, color: COLORS.error },
  ]

  const chartSubmissionData = submissionData.length > 0 ? submissionData : defaultSubmissionData
  const chartLanguageData = languageData.length > 0 ? languageData : defaultLanguageData
  const chartDifficultyData = difficultyData.length > 0 ? difficultyData : defaultDifficultyData

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Submission Timeline */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Submission & Rating Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartSubmissionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-muted-foreground" />
                <YAxis yAxisId="left" className="text-muted-foreground" />
                <YAxis yAxisId="right" orientation="right" className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="submissions" 
                  stroke={COLORS.primary} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                  name="Submissions"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="rating" 
                  stroke={COLORS.purple} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.purple, strokeWidth: 2, r: 4 }}
                  name="Rating"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Language Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Language Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartLanguageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartLanguageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {chartLanguageData.map((language, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: language.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {language.name} ({language.value}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Difficulty Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDifficultyData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-muted-foreground" />
                <YAxis dataKey="name" type="category" className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartDifficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {chartDifficultyData.map((difficulty, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: difficulty.color }}
                  />
                  <span className="text-sm font-medium">{difficulty.name}</span>
                </div>
                <Badge variant="secondary">{difficulty.value} problems</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ActivityCharts
