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
    <div className="space-y-6 p-4 md:p-8">
      {/* Property Info */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          {data.displayName}
        </h2>
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Time Zone:</span>
            <span>{data.timeZone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDateRange(data.dateRanges.startDate)} - {formatDateRange(data.dateRanges.endDate)}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-green-200 dark:border-green-900/50 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Last Month Organic Sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-end justify-between">
              <div className="text-3xl md:text-4xl font-bold text-green-700 dark:text-green-400">
                {formatNumber(data.lastMonthOrganicSessions)}
              </div>
              <div className={`flex items-center gap-1 text-lg font-bold ${
                sessionsChange.isIncrease ? 'text-green-600' : 'text-red-600'
              }`}>
                {sessionsChange.isIncrease ? (
                  <ArrowUp className="h-5 w-5" />
                ) : (
                  <ArrowDown className="h-5 w-5" />
                )}
                <span>{sessionsChange.change.toFixed(2)}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium">Current month:</span> {formatNumber(data.lastMonthOrganicSessions)} • <span className="font-medium">Previous month:</span> {formatNumber(data.previousMonthOrganicSessions)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-700 dark:text-blue-400 font-medium flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Last Month Organic Conversions
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-end justify-between">
              <div className="text-3xl md:text-4xl font-bold text-blue-700 dark:text-blue-400">
                {formatNumber(data.lastMonthOrganicConversions)}
              </div>
              <div className={`flex items-center gap-1 text-lg font-bold ${
                conversionsChange.isIncrease ? 'text-green-600' : 'text-red-600'
              }`}>
                {conversionsChange.isIncrease ? (
                  <ArrowUp className="h-5 w-5" />
                ) : (
                  <ArrowDown className="h-5 w-5" />
                )}
                <span>{conversionsChange.change.toFixed(2)}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium">Current month:</span> {formatNumber(data.lastMonthOrganicConversions)} • <span className="font-medium">Previous month:</span> {formatNumber(data.previousMonthOrganicConversions)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart - Total vs Organic */}
      <Card>
        <CardHeader>
          <CardTitle>Total Traffic vs Organic Traffic (Past 12 Months)</CardTitle>
          <CardDescription>
            Total traffic vs organic search traffic comparison • {chartData.length} days of data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={70}
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
                wrapperStyle={{ paddingTop: '10px' }}
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
        <CardHeader>
          <CardTitle>Organic Sessions vs Organic Conversions (Past 12 Months)</CardTitle>
          <CardDescription>
            Organic Sessions vs Organic Conversions over time • {chartData.length} days of data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={70}
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
                wrapperStyle={{ paddingTop: '10px' }}
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

