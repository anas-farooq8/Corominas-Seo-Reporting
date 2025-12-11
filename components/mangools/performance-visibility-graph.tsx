"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, TrendingUp } from "lucide-react"
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts'
import type { MangoolsStatsResponse } from "@/lib/mangools/api"

interface PerformanceVisibilityGraphProps {
  monthAData: MangoolsStatsResponse
  monthBData: MangoolsStatsResponse
  monthAName: string
  monthBName: string
}

interface IndexStats {
  lastValue: number
  firstValue: number
  percentChange: number
}

export function PerformanceVisibilityGraph({
  monthAData,
  monthBData,
  monthAName,
  monthBName,
}: PerformanceVisibilityGraphProps) {
  // Calculate stats for Month A
  const monthADates = Object.keys(monthAData.stats.timeframes).sort()
  const monthAPerfFirst = monthAData.stats.timeframes[monthADates[0]]?.performance_index ?? 0
  const monthAPerfLast = monthAData.stats.timeframes[monthADates[monthADates.length - 1]]?.performance_index ?? 0
  const monthAVisFirst = monthAData.stats.timeframes[monthADates[0]]?.visibility_index ?? 0
  const monthAVisLast = monthAData.stats.timeframes[monthADates[monthADates.length - 1]]?.visibility_index ?? 0

  const monthAPerfStats: IndexStats = {
    lastValue: monthAPerfLast,
    firstValue: monthAPerfFirst,
    percentChange: monthAPerfFirst > 0 ? ((monthAPerfLast - monthAPerfFirst) / monthAPerfFirst) * 100 : 0,
  }

  const monthAVisStats: IndexStats = {
    lastValue: monthAVisLast,
    firstValue: monthAVisFirst,
    percentChange: monthAVisFirst > 0 ? ((monthAVisLast - monthAVisFirst) / monthAVisFirst) * 100 : 0,
  }

  // Calculate stats for Month B
  const monthBDates = Object.keys(monthBData.stats.timeframes).sort()
  const monthBPerfFirst = monthBData.stats.timeframes[monthBDates[0]]?.performance_index ?? 0
  const monthBPerfLast = monthBData.stats.timeframes[monthBDates[monthBDates.length - 1]]?.performance_index ?? 0
  const monthBVisFirst = monthBData.stats.timeframes[monthBDates[0]]?.visibility_index ?? 0
  const monthBVisLast = monthBData.stats.timeframes[monthBDates[monthBDates.length - 1]]?.visibility_index ?? 0

  const monthBPerfStats: IndexStats = {
    lastValue: monthBPerfLast,
    firstValue: monthBPerfFirst,
    percentChange: monthBPerfFirst > 0 ? ((monthBPerfLast - monthBPerfFirst) / monthBPerfFirst) * 100 : 0,
  }

  const monthBVisStats: IndexStats = {
    lastValue: monthBVisLast,
    firstValue: monthBVisFirst,
    percentChange: monthBVisFirst > 0 ? ((monthBVisLast - monthBVisFirst) / monthBVisFirst) * 100 : 0,
  }

  // Calculate comparison (Month B vs Month A)
  const perfComparison = monthAPerfStats.lastValue > 0 
    ? ((monthBPerfStats.lastValue - monthAPerfStats.lastValue) / monthAPerfStats.lastValue) * 100 
    : 0
  const visComparison = monthAVisStats.lastValue > 0 
    ? ((monthBVisStats.lastValue - monthAVisStats.lastValue) / monthAVisStats.lastValue) * 100 
    : 0

  const formatPercent = (value: number) => {
    const formatted = Math.abs(value).toFixed(2)
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`
  }

  const getPercentColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600"
  }

  // Combine data from both months
  // First, get all unique dates from both months
  const allDates = [...new Set([...monthADates, ...monthBDates])].sort()
  
  const chartData = allDates.map((date, index) => {
    const timeframeA = monthAData.stats.timeframes[date]
    const timeframeB = monthBData.stats.timeframes[date]
    const dateObj = new Date(date)
    const dayOfMonth = dateObj.getDate()
    
    return {
      date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      fullDate: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      // Month A data
      performanceIndexA: timeframeA?.performance_index ?? null,
      visibilityIndexA: timeframeA?.visibility_index ?? null,
      // Month B data
      performanceIndexB: timeframeB?.performance_index ?? null,
      visibilityIndexB: timeframeB?.visibility_index ?? null,
      // Show label only for even days (skip odd days)
      showLabel: dayOfMonth % 2 === 0,
    }
  })

  // Custom tooltip to show names with values including year (date shown only once)
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      // Get the full date with year from the data
      const dataPoint = payload[0]?.payload
      const dateWithYear = dataPoint?.fullDate || ''
      
      // Group by metric type
      const perfA = payload.find(p => p.dataKey === 'performanceIndexA')
      const perfB = payload.find(p => p.dataKey === 'performanceIndexB')
      const visA = payload.find(p => p.dataKey === 'visibilityIndexA')
      const visB = payload.find(p => p.dataKey === 'visibilityIndexB')
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-xs font-semibold text-muted-foreground mb-2">{dateWithYear}</p>
          {/* Performance Index */}
          {(perfA || perfB) && (
            <div className="mb-2">
              <p className="text-xs font-medium text-muted-foreground">Performance Index</p>
              {perfA && perfA.value !== null && (
                <p className="text-sm font-semibold" style={{ color: '#fdba74' }}>
                  {monthAName}: {typeof perfA.value === 'number' ? perfA.value.toFixed(2) : perfA.value}
                </p>
              )}
              {perfB && perfB.value !== null && (
                <p className="text-sm font-semibold" style={{ color: '#f97316' }}>
                  {monthBName}: {typeof perfB.value === 'number' ? perfB.value.toFixed(2) : perfB.value}
                </p>
              )}
            </div>
          )}
          {/* Visibility Index */}
          {(visA || visB) && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Visibility Index</p>
              {visA && visA.value !== null && (
                <p className="text-sm font-semibold" style={{ color: '#93c5fd' }}>
                  {monthAName}: {typeof visA.value === 'number' ? visA.value.toFixed(2) : visA.value}
                </p>
              )}
              {visB && visB.value !== null && (
                <p className="text-sm font-semibold" style={{ color: '#3b82f6' }}>
                  {monthBName}: {typeof visB.value === 'number' ? visB.value.toFixed(2) : visB.value}
                </p>
              )}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Index and Visibility</CardTitle>
        <CardDescription>
          These charts track two key metrics over time: Performance Index (orange line) measures how well your keywords are ranking on average higher scores mean better positions in search results. Visibility Index (blue area) shows how often your website appears in search results for these keywords. Rising lines indicate growing SEO strength and more opportunities for organic traffic. The percentages below show monthly trends and comparisons.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Line Chart */}
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorVisibility" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  tick={(props: any) => {
                    const { x, y, payload, index } = props
                    const dataPoint = chartData[index]
                    // Only show label for even days
                    if (dataPoint?.showLabel) {
                      return (
                        <text x={x} y={y + 10} textAnchor="middle" fill="#9ca3af" fontSize={12}>
                          {payload.value}
                        </text>
                      )
                    }
                    // Return empty element instead of null
                    return <></>
                  }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Month A - Visibility (lighter blue area) */}
                <Area
                  type="monotone"
                  dataKey="visibilityIndexA"
                  stroke="#93c5fd"
                  strokeWidth={2}
                  fill="url(#colorVisibility)"
                  fillOpacity={0.3}
                  name="Visibility Index"
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                  legendType="none"
                />
                {/* Month B - Visibility (darker blue area) */}
                <Area
                  type="monotone"
                  dataKey="visibilityIndexB"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorVisibility)"
                  fillOpacity={0.6}
                  name="Visibility Index"
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
                {/* Month A - Performance (lighter orange) */}
                <Line 
                  type="monotone" 
                  dataKey="performanceIndexA" 
                  stroke="#fdba74" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Performance Index"
                  activeDot={{ r: 4 }}
                  connectNulls
                  legendType="none"
                />
                {/* Month B - Performance (darker orange) */}
                <Line 
                  type="monotone" 
                  dataKey="performanceIndexB" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={false}
                  name="Performance Index"
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Below Chart */}
          <div className="space-y-4 pt-4 border-t">
            {/* Performance Index */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Performance Index</div>
                </div>
                <div className="space-y-2 pl-10">
                  {/* Month A */}
                  <div>
                    <div className="text-xs text-muted-foreground">{monthAName}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-orange-400">
                        {monthAPerfStats.lastValue.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                      <span className={`text-xs font-semibold ${getPercentColor(monthAPerfStats.percentChange)}`}>
                        {monthAPerfStats.percentChange >= 0 ? '▲' : '▼'} {formatPercent(monthAPerfStats.percentChange)}
                      </span>
                    </div>
                  </div>
                  {/* Month B */}
                  <div>
                    <div className="text-xs text-muted-foreground">{monthBName}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-orange-600">
                        {monthBPerfStats.lastValue.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                      <span className={`text-xs font-semibold ${getPercentColor(monthBPerfStats.percentChange)}`}>
                        {monthBPerfStats.percentChange >= 0 ? '▲' : '▼'} {formatPercent(monthBPerfStats.percentChange)}
                      </span>
                    </div>
                  </div>
                  {/* Comparison */}
                  <div className="pt-1 border-t">
                    <div className="text-xs text-muted-foreground">vs {monthAName}</div>
                    <div className={`text-sm font-semibold ${getPercentColor(perfComparison)}`}>
                      {perfComparison >= 0 ? '▲' : '▼'} {formatPercent(perfComparison)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visibility Index */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                    <Eye className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Visibility Index</div>
                </div>
                <div className="space-y-2 pl-10">
                  {/* Month A */}
                  <div>
                    <div className="text-xs text-muted-foreground">{monthAName}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-400">
                        {monthAVisStats.lastValue.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                      <span className={`text-xs font-semibold ${getPercentColor(monthAVisStats.percentChange)}`}>
                        {monthAVisStats.percentChange >= 0 ? '▲' : '▼'} {formatPercent(monthAVisStats.percentChange)}
                      </span>
                    </div>
                  </div>
                  {/* Month B */}
                  <div>
                    <div className="text-xs text-muted-foreground">{monthBName}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-600">
                        {monthBVisStats.lastValue.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                      <span className={`text-xs font-semibold ${getPercentColor(monthBVisStats.percentChange)}`}>
                        {monthBVisStats.percentChange >= 0 ? '▲' : '▼'} {formatPercent(monthBVisStats.percentChange)}
                      </span>
                    </div>
                  </div>
                  {/* Comparison */}
                  <div className="pt-1 border-t">
                    <div className="text-xs text-muted-foreground">vs {monthAName}</div>
                    <div className={`text-sm font-semibold ${getPercentColor(visComparison)}`}>
                      {visComparison >= 0 ? '▲' : '▼'} {formatPercent(visComparison)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


