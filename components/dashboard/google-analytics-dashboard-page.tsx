"use client"

import { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, TrendingUp, MousePointerClick, ArrowUp, ArrowDown } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { GADashboardData } from "@/lib/actions/google-analytics-dashboard"

interface GoogleAnalyticsDashboardPageProps {
  datasourceId: string
}

export function GoogleAnalyticsDashboardPage({ datasourceId }: GoogleAnalyticsDashboardPageProps) {
  const [data, setData] = useState<GADashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Lazy load data when component is mounted
    fetchDashboardData()
  }, [datasourceId])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/google-analytics/dashboard/${datasourceId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      console.error("Error fetching GA dashboard:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading Google Analytics data..." />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "Failed to load dashboard data. Please try again later."}
          action={{
            label: "Try Again",
            onClick: () => fetchDashboardData()
          }}
        />
      </div>
    )
  }

  // Format the data for charts
  const chartData = data.dailyData.map(day => ({
    date: formatDateForDisplay(day.date),
    dateKey: day.date,
    fullDate: formatFullDate(day.date),
    totalTraffic: day.totalSessions,
    organicTraffic: day.organicSessions,
    organicConversions: day.organicConversions
  }))
  

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return { change: 0, isIncrease: true }
    const change = ((current - previous) / previous) * 100
    return {
      change: Math.abs(change),
      isIncrease: change >= 0
    }
  }

  // Calculate changes
  const sessionsChange = calculatePercentageChange(
    data.lastMonthOrganicSessions,
    data.previousMonthOrganicSessions
  )
  const conversionsChange = calculatePercentageChange(
    data.lastMonthOrganicConversions,
    data.previousMonthOrganicConversions
  )

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Property Info */}
      <div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
          {data.displayName}
        </h2>
        <div className="flex flex-col gap-1 mt-1.5 sm:mt-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium">Time Zone:</span>
            <span className="truncate">{data.timeZone}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm">
              {formatDateRange(data.dateRanges.startDate)} - {formatDateRange(data.dateRanges.endDate)}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-2 sm:gap-3 grid-cols-2">
        <Card className="border-2 border-green-200 dark:border-green-900/50 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardHeader className="pb-0 px-3 sm:px-4 pt-0.5 sm:pt-1">
            <CardDescription className="text-green-700 dark:text-green-400 font-medium flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs">
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              <span className="leading-tight">Last Month Organic Sessions</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0.5 sm:pb-1 px-3 sm:px-4 pt-0.5">
            <div className="flex items-end justify-between gap-1.5">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700 dark:text-green-400">
                {formatNumber(data.lastMonthOrganicSessions)}
              </div>
              <div className={`flex items-center gap-0.5 text-sm sm:text-base font-bold flex-shrink-0 ${
                sessionsChange.isIncrease ? 'text-green-600' : 'text-red-600'
              }`}>
                {sessionsChange.isIncrease ? (
                  <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                <span className="text-xs sm:text-sm">{sessionsChange.change.toFixed(2)}%</span>
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 leading-tight">
              <span className="font-medium">Current:</span> {formatNumber(data.lastMonthOrganicSessions)} • <span className="font-medium">Previous:</span> {formatNumber(data.previousMonthOrganicSessions)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader className="pb-0 px-3 sm:px-4 pt-0.5 sm:pt-1">
            <CardDescription className="text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs">
              <MousePointerClick className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              <span className="leading-tight">Last Month Organic Conversions</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0.5 sm:pb-1 px-3 sm:px-4 pt-0.5">
            <div className="flex items-end justify-between gap-1.5">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-400">
                {formatNumber(data.lastMonthOrganicConversions)}
              </div>
              <div className={`flex items-center gap-0.5 text-sm sm:text-base font-bold flex-shrink-0 ${
                conversionsChange.isIncrease ? 'text-green-600' : 'text-red-600'
              }`}>
                {conversionsChange.isIncrease ? (
                  <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                <span className="text-xs sm:text-sm">{conversionsChange.change.toFixed(2)}%</span>
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 leading-tight">
              <span className="font-medium">Current:</span> {formatNumber(data.lastMonthOrganicConversions)} • <span className="font-medium">Previous:</span> {formatNumber(data.previousMonthOrganicConversions)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart - Total vs Organic */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-2 sm:py-3">
          <CardTitle className="text-base sm:text-lg md:text-xl">Total Traffic vs Organic Traffic (Past 12 Months)</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Total traffic vs organic search traffic comparison • {chartData.length} days of data
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6 pb-0.5 sm:pb-0">
          <ResponsiveContainer width="100%" height={300} className="sm:hidden">
            <LineChart data={chartData} margin={{ top: 2, right: 5, left: -5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                height={50}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                width={35}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ 
                  color: '#111827', 
                  fontWeight: 600, 
                  marginBottom: '6px',
                  fontSize: '11px'
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullDate
                  }
                  return label
                }}
                formatter={(value: number, name: string) => [formatNumber(value), name]}
              />
              <Line 
                type="monotone" 
                dataKey="totalTraffic" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Total Traffic"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="organicTraffic" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="Organic Traffic"
                dot={false}
                activeDot={{ r: 4 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={450} className="hidden sm:block">
            <LineChart data={chartData} margin={{ top: 2, right: 10, left: 0, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={55}
                interval={Math.floor(chartData.length / 12)}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                labelStyle={{ 
                  color: '#111827', 
                  fontWeight: 600, 
                  marginBottom: '8px' 
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullDate
                  }
                  return label
                }}
                formatter={(value: number, name: string) => [formatNumber(value), name]}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '5px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="totalTraffic" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                name="Total Traffic"
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="organicTraffic" 
                stroke="#22c55e" 
                strokeWidth={2.5}
                name="Organic Traffic"
                dot={false}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Organic Sessions vs Conversions Chart */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-2 sm:py-3">
          <CardTitle className="text-base sm:text-lg md:text-xl">Organic Sessions vs Organic Conversions (Past 12 Months)</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Organic Sessions vs Organic Conversions over time • {chartData.length} days of data
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6 pb-0.5 sm:pb-0">
          <ResponsiveContainer width="100%" height={300} className="sm:hidden">
            <LineChart data={chartData} margin={{ top: 2, right: 5, left: -5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                height={40}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                width={35}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ 
                  color: '#111827', 
                  fontWeight: 600, 
                  marginBottom: '6px',
                  fontSize: '11px'
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullDate
                  }
                  return label
                }}
                formatter={(value: number, name: string) => [formatNumber(value), name]}
              />
              <Line 
                type="monotone" 
                dataKey="organicTraffic" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="Organic Sessions"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="organicConversions" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Organic Conversions"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={450} className="hidden sm:block">
            <LineChart data={chartData} margin={{ top: 2, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={45}
                interval={Math.floor(chartData.length / 12)}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                width={50}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                labelStyle={{ 
                  color: '#111827', 
                  fontWeight: 600, 
                  marginBottom: '8px' 
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullDate
                  }
                  return label
                }}
                formatter={(value: number, name: string) => [formatNumber(value), name]}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '5px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="organicTraffic" 
                stroke="#22c55e" 
                strokeWidth={2.5}
                name="Organic Sessions"
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="organicConversions" 
                stroke="#3b82f6" 
                strokeWidth={2.5}
                name="Organic Conversions"
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to format date from YYYYMMDD to readable format (for X-axis)
function formatDateForDisplay(dateStr: string): string {
  // dateStr is in format YYYYMMDD (e.g., "20241201")
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  
  const date = new Date(`${year}-${month}-${day}`)
  
  // Show month and day for X-axis
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Helper function to format full date for tooltips
function formatFullDate(dateStr: string): string {
  // dateStr is in format YYYYMMDD (e.g., "20241201")
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  
  const date = new Date(`${year}-${month}-${day}`)
  
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// Helper function to format date range for display
function formatDateRange(dateStr: string): string {
  // dateStr is in format YYYY-MM-DD
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

