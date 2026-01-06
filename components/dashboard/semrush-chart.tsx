"use client"

import { memo, useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartLayerFilters, type LayerKey } from "./chart-layer-filters"
import { CustomSEMrushLegend, createSEMrushTooltip, formatNumber, formatDateForDisplay, formatDateWithYear, formatFullDate } from "@/lib/utils/dashboard-helpers"
import type { SEMrushParsedDailyData } from "@/lib/semrush/api"

export type TimePeriod = '1m' | '6m' | '1y' | '2y' | 'all'

interface SEMrushChartProps {
  dailyData: SEMrushParsedDailyData[]
  visibleLayers: Record<LayerKey, boolean>
  onToggleLayer: (layer: LayerKey) => void
  periodLabel?: string // Dynamic period label for chart title
  endDate?: string // End date of the data (YYYY-MM-DD format)
}

// Define layer configuration in a stable order (bottom to top visually)
const LAYER_ORDER = [
  { key: 'SERP functions' as LayerKey, dataKey: 'SERP functions', color: '#22c55e' },
  { key: 'AI Overviews' as LayerKey, dataKey: 'AI Overviews', color: '#8b5cf6' },
  { key: '51-100' as LayerKey, dataKey: '51-100', color: '#06b6d4' },
  { key: '21-50' as LayerKey, dataKey: '21-50', color: '#3b82f6' },
  { key: '11-20' as LayerKey, dataKey: '11-20', color: '#f59e0b' },
  { key: '4-10' as LayerKey, dataKey: '4-10', color: '#f97316' },
  { key: 'Top 3' as LayerKey, dataKey: 'Top 3', color: '#ef4444' },
] as const

/**
 * Calculate the total data span in months
 */
function calculateDataSpanInMonths(dailyData: SEMrushParsedDailyData[]): number {
  if (dailyData.length === 0) return 0
  
  const firstDate = new Date(
    parseInt(dailyData[0].date.substring(0, 4)),
    parseInt(dailyData[0].date.substring(4, 6)) - 1,
    parseInt(dailyData[0].date.substring(6, 8))
  )
  const lastDate = new Date(
    parseInt(dailyData[dailyData.length - 1].date.substring(0, 4)),
    parseInt(dailyData[dailyData.length - 1].date.substring(4, 6)) - 1,
    parseInt(dailyData[dailyData.length - 1].date.substring(6, 8))
  )
  
  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.ceil(diffDays / 30) // Approximate months
}

/**
 * Filter data by time period
 */
function filterDataByPeriod(
  dailyData: SEMrushParsedDailyData[], 
  period: TimePeriod,
  endDate?: string
): SEMrushParsedDailyData[] {
  if (period === 'all' || dailyData.length === 0) return dailyData
  
  // Parse end date or use last date in data
  let endDateObj: Date
  if (endDate) {
    const [year, month, day] = endDate.split('-').map(Number)
    endDateObj = new Date(year, month - 1, day)
  } else {
    const lastData = dailyData[dailyData.length - 1]
    endDateObj = new Date(
      parseInt(lastData.date.substring(0, 4)),
      parseInt(lastData.date.substring(4, 6)) - 1,
      parseInt(lastData.date.substring(6, 8))
    )
  }
  
  // Calculate start date based on period
  // For periods, we want to show complete months starting from the 1st
  let startDateObj: Date
  switch (period) {
    case '1m':
      // Last full month - start from 1st of that month
      startDateObj = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), 1)
      break
    case '6m':
      // 6 months back - start from 1st of that month (5 months before end month)
      startDateObj = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - 5, 1)
      break
    case '1y':
      // 12 months back - start from 1st of that month (11 months before end month)
      startDateObj = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - 11, 1)
      break
    case '2y':
      // 24 months back - start from 1st of that month (23 months before end month)
      startDateObj = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - 23, 1)
      break
    default:
      return dailyData
  }
  
  // Convert to YYYYMMDD format
  const startDateStr = 
    startDateObj.getFullYear() + 
    String(startDateObj.getMonth() + 1).padStart(2, '0') + 
    String(startDateObj.getDate()).padStart(2, '0')
  
  return dailyData.filter(d => d.date >= startDateStr)
}

/**
 * Aggregate daily data to monthly data
 */
function aggregateToMonthly(dailyData: SEMrushParsedDailyData[]): SEMrushParsedDailyData[] {
  if (dailyData.length === 0) return []
  
  const monthlyMap = new Map<string, {
    top3: number[]
    top4to10: number[]
    top11to20: number[]
    top21to50: number[]
    top51to100: number[]
    aiOverviews: number[]
    serpFunctions: number[]
  }>()
  
  // Group by year-month
  dailyData.forEach(day => {
    const yearMonth = day.date.substring(0, 6) // YYYYMM
    if (!monthlyMap.has(yearMonth)) {
      monthlyMap.set(yearMonth, {
        top3: [],
        top4to10: [],
        top11to20: [],
        top21to50: [],
        top51to100: [],
        aiOverviews: [],
        serpFunctions: []
      })
    }
    const month = monthlyMap.get(yearMonth)!
    month.top3.push(day.top3)
    month.top4to10.push(day.top4to10)
    month.top11to20.push(day.top11to20)
    month.top21to50.push(day.top21to50)
    month.top51to100.push(day.top51to100)
    month.aiOverviews.push(day.aiOverviews)
    month.serpFunctions.push(day.serpFunctions)
  })
  
  // Calculate average for each month
  return Array.from(monthlyMap.entries()).map(([yearMonth, values]) => {
    const count = values.top3.length
    return {
      date: yearMonth + '01', // Use first day of month
      top3: Math.round(values.top3.reduce((a, b) => a + b, 0) / count),
      top4to10: Math.round(values.top4to10.reduce((a, b) => a + b, 0) / count),
      top11to20: Math.round(values.top11to20.reduce((a, b) => a + b, 0) / count),
      top21to50: Math.round(values.top21to50.reduce((a, b) => a + b, 0) / count),
      top51to100: Math.round(values.top51to100.reduce((a, b) => a + b, 0) / count),
      aiOverviews: Math.round(values.aiOverviews.reduce((a, b) => a + b, 0) / count),
      serpFunctions: Math.round(values.serpFunctions.reduce((a, b) => a + b, 0) / count),
      get totalKeywords() {
        return this.top3 + this.top4to10 + this.top11to20 + 
               this.top21to50 + this.top51to100 + 
               this.aiOverviews + this.serpFunctions
      }
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
}

export const SEMrushChart = memo(function SEMrushChart({ 
  dailyData, 
  visibleLayers, 
  onToggleLayer,
  periodLabel = 'Past 12 Months', // Default fallback
  endDate
}: SEMrushChartProps) {
  // Calculate data span to determine available periods
  const dataSpanMonths = useMemo(() => calculateDataSpanInMonths(dailyData), [dailyData])
  
  // Determine default period based on available data
  const defaultPeriod = useMemo((): TimePeriod => {
    if (dataSpanMonths >= 24) return '1y' // Show 1 year by default if we have 2+ years
    if (dataSpanMonths >= 12) return '1y'
    if (dataSpanMonths >= 6) return '6m'
    return '1m'
  }, [dataSpanMonths])
  
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(defaultPeriod)
  
  // Always show all time periods (even if data is limited)
  const availablePeriods: TimePeriod[] = ['1m', '6m', '1y', '2y', 'all']
  
  // Check if we're showing monthly aggregated data
  const isMonthlyView = useMemo(() => 
    selectedPeriod === 'all' && dataSpanMonths > 24,
    [selectedPeriod, dataSpanMonths]
  )
  
  // Filter and process data based on selected period
  const processedData = useMemo(() => {
    const filtered = filterDataByPeriod(dailyData, selectedPeriod, endDate)
    
    // If "all time" and data > 24 months, aggregate to monthly
    if (isMonthlyView) {
      return aggregateToMonthly(filtered)
    }
    
    return filtered
  }, [dailyData, selectedPeriod, endDate, isMonthlyView])
  
  // Format date for monthly view (e.g., "Jan 2024" instead of "Jan 1, 2024")
  const formatMonthYear = (dateStr: string) => {
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }
  
  const chartData = useMemo(() => 
    processedData.map((day, index) => {
      // For multi-year views (2y), include year in date to avoid duplicate labels
      const includeYear = selectedPeriod === '2y'
      
      return {
        // Use dateKey (YYYYMMDD) as unique identifier to prevent hover confusion
        id: day.date, // Unique ID for React key
        date: isMonthlyView 
          ? formatMonthYear(day.date) 
          : (includeYear ? formatDateWithYear(day.date) : formatDateForDisplay(day.date)),
        dateKey: day.date, // Original YYYYMMDD format
        fullDate: isMonthlyView ? formatMonthYear(day.date) : formatFullDate(day.date),
        'Top 3': day.top3,
        '4-10': day.top4to10,
        '11-20': day.top11to20,
        '21-50': day.top21to50,
        '51-100': day.top51to100,
        'AI Overviews': day.aiOverviews,
        'SERP functions': day.serpFunctions,
        total: day.totalKeywords,
        index: index, // Additional unique index
      }
    }), 
    [processedData, isMonthlyView, selectedPeriod]
  )
  
  const periodLabels: Record<TimePeriod, string> = {
    '1m': 'Past Month',
    '6m': 'Past 6 Months',
    '1y': 'Past Year',
    '2y': 'Past 2 Years',
    'all': 'All Time (Monthly Avg)'
  }

  const CustomTooltip = useMemo(() => createSEMrushTooltip(formatNumber), [])

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="text-base sm:text-lg md:text-xl">
                Total Ranking Keywords ({periodLabels[selectedPeriod]})
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                This chart shows how many search terms (keywords) your website appears for in Google results, grouped by how high they rank. Keywords in the <strong>Top 3</strong> positions get the most clicks, while those ranking <strong>4-10</strong> still get good visibility. Lower positions (11-100) mean fewer people see your site. The colored layers show how your keywords are distributed across these positions over time. More keywords moving into the top positions means better visibility and more potential visitors finding your website.
              </CardDescription>
            </div>
            <ChartLayerFilters visibleLayers={visibleLayers} onToggleLayer={onToggleLayer} />
          </div>
          
          {/* Time Period Toggle Buttons */}
          <div className="flex flex-wrap gap-2">
            {availablePeriods.map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className="text-xs"
              >
                {period === 'all' ? 'All Time' : period.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 md:px-6 pb-0.5 sm:pb-0">
        {/* Mobile Chart */}
        <ResponsiveContainer width="100%" height={400} className="sm:hidden">
          <AreaChart 
            data={chartData} 
            margin={{ top: 5, right: 5, left: -5, bottom: 0 }}
            key={`mobile-${selectedPeriod}-${chartData.length}`} // Force complete re-render with data length
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9 }}
              angle={-45}
              textAnchor="end"
              height={50}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis tick={{ fontSize: 10 }} width={35} />
            <Tooltip content={<CustomTooltip />} />
            {/* Render all layers to maintain consistent stacking order */}
            {LAYER_ORDER.map((layer) => (
              <Area
                key={layer.key}
                type="monotone"
                dataKey={layer.dataKey}
                stackId="1"
                stroke={layer.color}
                fill={layer.color}
                fillOpacity={0.8}
                animationDuration={400}
                animationEasing="ease-in-out"
                isAnimationActive={true}
                hide={!visibleLayers[layer.key]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        {/* Desktop Chart */}
        <ResponsiveContainer width="100%" height={500} className="hidden sm:block">
          <AreaChart 
            data={chartData} 
            margin={{ top: 5, right: 10, left: 0, bottom: 15 }}
            key={`desktop-${selectedPeriod}-${chartData.length}`} // Force complete re-render with data length
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={55}
              interval={Math.floor(chartData.length / 12)}
            />
            <YAxis tick={{ fontSize: 12 }} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomSEMrushLegend />} wrapperStyle={{ paddingTop: '20px' }} />
            {/* Render all layers to maintain consistent stacking order */}
            {LAYER_ORDER.map((layer) => (
              <Area
                key={layer.key}
                type="monotone"
                dataKey={layer.dataKey}
                stackId="1"
                stroke={layer.color}
                fill={layer.color}
                fillOpacity={0.8}
                animationDuration={400}
                animationEasing="ease-in-out"
                isAnimationActive={true}
                hide={!visibleLayers[layer.key]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})
