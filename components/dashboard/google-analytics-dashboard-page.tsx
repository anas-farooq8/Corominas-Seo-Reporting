"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, TrendingUp, MousePointerClick } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { GADashboardData } from "@/lib/actions/google-analytics-dashboard"
import {
  formatNumber,
  calculatePercentageChange,
  getMonthYear,
  getPreviousMonthYear,
  formatDateForDisplay,
  formatFullDate,
  formatDateRange,
  CustomGATrafficLegend,
  CustomGASessionsLegend
} from "@/lib/utils/dashboard-helpers"
import { KPICard } from "./kpi-card"

interface GoogleAnalyticsDashboardPageProps {
  datasourceId?: string
  data?: GADashboardData | null
  showMetadata?: boolean
  showKPIs?: boolean
}

export function GoogleAnalyticsDashboardPage({ 
  datasourceId, 
  data: externalData, 
  showMetadata = true,
  showKPIs = true
}: GoogleAnalyticsDashboardPageProps) {
  const [data, setData] = useState<GADashboardData | null>(externalData || null)
  const [loading, setLoading] = useState(!externalData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (externalData) {
      setData(externalData)
      setLoading(false)
      return
    }
    
    let isMounted = true
    
    async function fetchDashboardData() {
      if (!datasourceId) return
      
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/google-analytics/dashboard/${datasourceId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data")
        }
        const dashboardData = await response.json()
        if (isMounted) {
          setData(dashboardData)
        }
      } catch (err) {
        console.error("Error fetching GA dashboard:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData()
    
    return () => {
      isMounted = false
    }
  }, [datasourceId, externalData])

  // Memoize chart data
  const chartData = useMemo(() => {
    if (!data) return []
    return data.dailyData.map(day => ({
      date: formatDateForDisplay(day.date),
      dateKey: day.date,
      fullDate: formatFullDate(day.date),
      totalTraffic: day.totalSessions,
      organicTraffic: day.organicSessions,
      organicConversions: day.organicConversions
    }))
  }, [data])

  // Memoize KPI calculations
  const sessionsKPI = useMemo(() => {
    if (!data) return null
    return {
      change: calculatePercentageChange(data.lastMonthOrganicSessions, data.previousMonthOrganicSessions),
      currentLabel: getMonthYear(data.dateRanges.endDate),
      previousLabel: getPreviousMonthYear(data.dateRanges.endDate)
    }
  }, [data])

  const conversionsKPI = useMemo(() => {
    if (!data) return null
    return {
      change: calculatePercentageChange(data.lastMonthOrganicConversions, data.previousMonthOrganicConversions),
      currentLabel: getMonthYear(data.dateRanges.endDate),
      previousLabel: getPreviousMonthYear(data.dateRanges.endDate)
    }
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading Google Analytics data..." />
      </div>
    )
  }

  if (error || !data || !sessionsKPI || !conversionsKPI) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "Failed to load dashboard data. Please try again later."}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${showMetadata || showKPIs ? 'p-3 sm:p-4 md:p-6 lg:p-8' : ''}`}>
      {showMetadata && (
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
      )}

      {/* KPI Cards */}
      {showKPIs && (
        <div className="grid gap-2 sm:gap-3 grid-cols-2">
          <KPICard
            title="Organic Sessions"
            icon={<TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={data.lastMonthOrganicSessions}
            previousValue={data.previousMonthOrganicSessions}
            currentLabel={sessionsKPI.currentLabel}
            previousLabel={sessionsKPI.previousLabel}
            colorScheme="green"
            percentageChange={sessionsKPI.change}
          />

          <KPICard
            title="Organic Conversions"
            icon={<MousePointerClick className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={data.lastMonthOrganicConversions}
            previousValue={data.previousMonthOrganicConversions}
            currentLabel={conversionsKPI.currentLabel}
            previousLabel={conversionsKPI.previousLabel}
            colorScheme="blue"
            percentageChange={conversionsKPI.change}
          />
        </div>
      )}

      {/* Traffic Chart - Total vs Organic */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-2 sm:py-3">
          <CardTitle className="text-base sm:text-lg md:text-xl">Total Traffic vs Organic Traffic (Past 12 Months)</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            This chart shows how many visitors come to your website each day. <strong>Total Traffic</strong> includes everyone who visits from any source (social media, ads, direct links, etc.). <strong>Organic Traffic</strong> shows visitors who found you through Google or other search engines by typing in keywords. The gap between these lines shows how much of your traffic comes from free search results versus paid or other sources. When organic traffic grows, it means more people are finding you naturally through search.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6 pb-0.5 sm:pb-0">
          {/* Mobile Chart */}
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
              <YAxis tick={{ fontSize: 10 }} width={35} />
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
                labelFormatter={(_, payload) => payload && payload[0] ? payload[0].payload.fullDate : ''}
                formatter={(value, name) => [formatNumber(Number(value ?? 0)), String(name)]}
              />
              <Line
                type="monotone"
                dataKey="totalTraffic"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Total Traffic"
                dot={false}
                activeDot={{ r: 4 }}
                animationDuration={300}
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
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Desktop Chart */}
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
              <YAxis tick={{ fontSize: 12 }} width={60} />
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
                labelFormatter={(_, payload) => payload && payload[0] ? payload[0].payload.fullDate : ''}
                formatter={(value, name) => [formatNumber(Number(value ?? 0)), String(name)]}
              />
              <Legend content={<CustomGATrafficLegend />} wrapperStyle={{ paddingTop: '5px' }} />
              <Line
                type="monotone"
                dataKey="totalTraffic"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Total Traffic"
                dot={false}
                activeDot={{ r: 6 }}
                animationDuration={300}
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
                animationDuration={300}
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
            This chart tracks how well your website converts visitors into customers. <strong>Organic Sessions</strong> are visits from people who found you through Google search. <strong>Organic Conversions</strong> are when those visitors take a desired action (like making a purchase, filling out a form, or signing up). When conversions grow faster than sessions, it means your website is getting better at turning visitors into customers. If conversions stay flat while sessions grow, you may need to improve your website&apos;s ability to convert visitors.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6 pb-0.5 sm:pb-0">
          {/* Mobile Chart */}
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
              <YAxis tick={{ fontSize: 10 }} width={35} />
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
                labelFormatter={(_, payload) => payload && payload[0] ? payload[0].payload.fullDate : ''}
                formatter={(value, name) => [formatNumber(Number(value ?? 0)), String(name)]}
              />
              <Line
                type="monotone"
                dataKey="organicTraffic"
                stroke="#22c55e"
                strokeWidth={2}
                name="Organic Sessions"
                dot={false}
                activeDot={{ r: 4 }}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="organicConversions"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Organic Conversions"
                dot={false}
                activeDot={{ r: 4 }}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Desktop Chart */}
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
              <YAxis tick={{ fontSize: 12 }} width={50} />
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
                labelFormatter={(_, payload) => payload && payload[0] ? payload[0].payload.fullDate : ''}
                formatter={(value, name) => [formatNumber(Number(value ?? 0)), String(name)]}
              />
              <Legend content={<CustomGASessionsLegend />} wrapperStyle={{ paddingTop: '5px' }} />
              <Line
                type="monotone"
                dataKey="organicTraffic"
                stroke="#22c55e"
                strokeWidth={2.5}
                name="Organic Sessions"
                dot={false}
                activeDot={{ r: 6 }}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="organicConversions"
                stroke="#3b82f6"
                strokeWidth={2.5}
                name="Organic Conversions"
                dot={false}
                activeDot={{ r: 6 }}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

