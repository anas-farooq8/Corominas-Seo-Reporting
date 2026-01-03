"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, MousePointerClick } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { GADashboardData } from "@/lib/actions/google-analytics-dashboard"
import {
  formatNumber,
  formatDateForDisplay,
  formatFullDate,
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

  // Memoize chart data - process both current and previous periods with numeric x-axis
  const chartData = useMemo(() => {
    if (!data || !data.currentPeriod || !data.previousPeriod) return { current: [], previous: [] }
    
    // Separate current and previous period data
    const currentData = data.dailyData.filter(day => {
      const dateNum = parseInt(day.date)
      return dateNum >= data.currentPeriod.startYYYYMMDD && dateNum <= data.currentPeriod.endYYYYMMDD
    })
    
    const previousData = data.dailyData.filter(day => {
      const dateNum = parseInt(day.date)
      return dateNum >= data.previousPeriod.startYYYYMMDD && dateNum <= data.previousPeriod.endYYYYMMDD
    })
    
    // Create arrays with numeric day index (1, 2, 3, ...)
    const current = currentData.map((day, index) => ({
      dayIndex: index + 1, // Numeric x-axis starting from 1
      date: formatDateForDisplay(day.date),
      dateKey: day.date,
      fullDate: formatFullDate(day.date),
      totalTraffic: day.totalSessions,
      organicTraffic: day.organicSessions,
      organicConversions: day.organicConversions
    }))
    
    const previous = previousData.map((day, index) => ({
      dayIndex: index + 1, // Numeric x-axis starting from 1
      date: formatDateForDisplay(day.date),
      dateKey: day.date,
      fullDate: formatFullDate(day.date),
      totalTraffic: day.totalSessions,
      organicTraffic: day.organicSessions,
      organicConversions: day.organicConversions
    }))
    
    return { current, previous }
  }, [data])
  
  // Create filtered chart data for Total Traffic vs Organic Traffic (uses sessions period)
  const trafficChartData = useMemo(() => {
    if (!data || !data.kpiCards || !data.chartPeriods || !chartData.current.length) return []
    
    const sessionsPeriod = data.kpiCards.organicSessions.periodType
    const conversionsPeriod = data.kpiCards.organicConversions.periodType
    
    // Determine which period to use for traffic chart (sessions period)
    const monthsMap: Record<'1-month' | '3-month' | '6-month', number> = { 
      '1-month': 1, 
      '3-month': 3, 
      '6-month': 6 
    }
    const sessionsMonths = monthsMap[sessionsPeriod]
    const conversionsMonths = monthsMap[conversionsPeriod]
    
    // If sessions period is smaller than conversions, filter the data
    let currentFiltered = chartData.current
    let previousFiltered = chartData.previous
    
    if (sessionsMonths < conversionsMonths) {
      // Calculate how many days to keep from the end of current data
      const currentEndDate = new Date(
        parseInt(chartData.current[chartData.current.length - 1].dateKey.substring(0, 4)),
        parseInt(chartData.current[chartData.current.length - 1].dateKey.substring(4, 6)) - 1,
        parseInt(chartData.current[chartData.current.length - 1].dateKey.substring(6, 8))
      )
      
      const startDate = new Date(currentEndDate.getFullYear(), currentEndDate.getMonth() - sessionsMonths + 1, 1)
      const startYYYYMMDD = parseInt(
        startDate.getFullYear() + 
        String(startDate.getMonth() + 1).padStart(2, '0') + 
        String(startDate.getDate()).padStart(2, '0')
      )
      
      currentFiltered = chartData.current.filter(d => parseInt(d.dateKey) >= startYYYYMMDD)
      
      // Filter previous period as well to match the same number of months
      const prevEndDate = new Date(
        parseInt(chartData.previous[chartData.previous.length - 1].dateKey.substring(0, 4)),
        parseInt(chartData.previous[chartData.previous.length - 1].dateKey.substring(4, 6)) - 1,
        parseInt(chartData.previous[chartData.previous.length - 1].dateKey.substring(6, 8))
      )
      
      const prevStartDate = new Date(prevEndDate.getFullYear(), prevEndDate.getMonth() - sessionsMonths + 1, 1)
      const prevStartYYYYMMDD = parseInt(
        prevStartDate.getFullYear() + 
        String(prevStartDate.getMonth() + 1).padStart(2, '0') + 
        String(prevStartDate.getDate()).padStart(2, '0')
      )
      
      previousFiltered = chartData.previous.filter(d => parseInt(d.dateKey) >= prevStartYYYYMMDD)
    }
    
    // Combine both periods into a single chart data array with aligned dayIndex
    // Use the maximum length to handle unequal periods
    const maxLength = Math.max(currentFiltered.length, previousFiltered.length)
    const combinedData = []
    
    for (let i = 0; i < maxLength; i++) {
      const dayNum = i + 1
      const current = currentFiltered[i]
      const previous = previousFiltered[i]
      
      combinedData.push({
        dayIndex: dayNum,
        // Current period data (undefined if day doesn't exist)
        currentTotalTraffic: current?.totalTraffic,
        currentOrganicTraffic: current?.organicTraffic,
        currentDate: current?.fullDate,
        currentDateShort: current?.date,
        // Previous period data (undefined if day doesn't exist)
        previousTotalTraffic: previous?.totalTraffic,
        previousOrganicTraffic: previous?.organicTraffic,
        previousDate: previous?.fullDate,
        previousDateShort: previous?.date,
      })
    }
    
    return combinedData
  }, [data, chartData])
  
  // Create sessions/conversions chart data (uses conversions period)
  const sessionsConversionsChartData = useMemo(() => {
    if (!data || !data.kpiCards || !chartData.current.length) return []
    
    const sessionsPeriod = data.kpiCards.organicSessions.periodType
    const conversionsPeriod = data.kpiCards.organicConversions.periodType
    
    // Determine which period to use (conversions period for this chart)
    const monthsMap: Record<'1-month' | '3-month' | '6-month', number> = { 
      '1-month': 1, 
      '3-month': 3, 
      '6-month': 6 
    }
    const sessionsMonths = monthsMap[sessionsPeriod]
    const conversionsMonths = monthsMap[conversionsPeriod]
    
    // Use full data if conversions >= sessions, otherwise filter
    let currentFiltered = chartData.current
    let previousFiltered = chartData.previous
    
    // If conversions period is smaller (rare case), filter the data
    if (conversionsMonths < Math.max(sessionsMonths, conversionsMonths)) {
      const currentEndDate = new Date(
        parseInt(chartData.current[chartData.current.length - 1].dateKey.substring(0, 4)),
        parseInt(chartData.current[chartData.current.length - 1].dateKey.substring(4, 6)) - 1,
        parseInt(chartData.current[chartData.current.length - 1].dateKey.substring(6, 8))
      )
      
      const startDate = new Date(currentEndDate.getFullYear(), currentEndDate.getMonth() - conversionsMonths + 1, 1)
      const startYYYYMMDD = parseInt(
        startDate.getFullYear() + 
        String(startDate.getMonth() + 1).padStart(2, '0') + 
        String(startDate.getDate()).padStart(2, '0')
      )
      
      currentFiltered = chartData.current.filter(d => parseInt(d.dateKey) >= startYYYYMMDD)
      
      const prevEndDate = new Date(
        parseInt(chartData.previous[chartData.previous.length - 1].dateKey.substring(0, 4)),
        parseInt(chartData.previous[chartData.previous.length - 1].dateKey.substring(4, 6)) - 1,
        parseInt(chartData.previous[chartData.previous.length - 1].dateKey.substring(6, 8))
      )
      
      const prevStartDate = new Date(prevEndDate.getFullYear(), prevEndDate.getMonth() - conversionsMonths + 1, 1)
      const prevStartYYYYMMDD = parseInt(
        prevStartDate.getFullYear() + 
        String(prevStartDate.getMonth() + 1).padStart(2, '0') + 
        String(prevStartDate.getDate()).padStart(2, '0')
      )
      
      previousFiltered = chartData.previous.filter(d => parseInt(d.dateKey) >= prevStartYYYYMMDD)
    }
    
    // Combine both periods
    const maxLength = Math.max(currentFiltered.length, previousFiltered.length)
    const combinedData = []
    
    for (let i = 0; i < maxLength; i++) {
      const dayNum = i + 1
      const current = currentFiltered[i]
      const previous = previousFiltered[i]
      
      combinedData.push({
        dayIndex: dayNum,
        // Current period data
        currentOrganicSessions: current?.organicTraffic,
        currentOrganicConversions: current?.organicConversions,
        currentDate: current?.fullDate,
        currentDateShort: current?.date,
        // Previous period data
        previousOrganicSessions: previous?.organicTraffic,
        previousOrganicConversions: previous?.organicConversions,
        previousDate: previous?.fullDate,
        previousDateShort: previous?.date,
      })
    }
    
    return combinedData
  }, [data, chartData])

  // Memoize KPI calculations - using kpiCards from backend
  const sessionsKPI = useMemo(() => {
    if (!data || !data.kpiCards) return null
    
    const kpi = data.kpiCards.organicSessions
    
    return {
      change: {
        change: kpi.change,
        isIncrease: kpi.isIncrease
      },
      currentValue: Math.round(kpi.current),
      previousValue: Math.round(kpi.previous),
      currentLabel: `Last ${kpi.periodType === '1-month' ? 'Month' : kpi.periodType.replace('-month', ' Months')}`,
      previousLabel: `Previous ${kpi.periodType === '1-month' ? 'Month' : kpi.periodType.replace('-month', ' Months')}`,
      comparisonLabel: kpi.periodLabel
    }
  }, [data])

  const conversionsKPI = useMemo(() => {
    if (!data || !data.kpiCards) return null
    
    const kpi = data.kpiCards.organicConversions
    
    return {
      change: {
        change: kpi.change,
        isIncrease: kpi.isIncrease
      },
      currentValue: Math.round(kpi.current),
      previousValue: Math.round(kpi.previous),
      currentLabel: `Last ${kpi.periodType === '1-month' ? 'Month' : kpi.periodType.replace('-month', ' Months')}`,
      previousLabel: `Previous ${kpi.periodType === '1-month' ? 'Month' : kpi.periodType.replace('-month', ' Months')}`,
      comparisonLabel: kpi.periodLabel
    }
  }, [data])
  
  // Compute period labels for charts
  const chartLabels = useMemo(() => {
    if (!data || !data.chartPeriods) return {
      trafficChart: 'Past 12 Months',
      sessionsConversionsChart: 'Past 12 Months'
    }
    
    const formatPeriod = (period: '1-month' | '3-month' | '6-month') => {
      if (period === '1-month') return 'Past Month'
      if (period === '3-month') return 'Past 3 Months'
      return 'Past 6 Months'
    }
    
    return {
      trafficChart: formatPeriod(data.chartPeriods.trafficChart),
      sessionsConversionsChart: formatPeriod(data.chartPeriods.sessionsConversionsChart)
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
              <span className="font-medium">Currency:</span>
              <span className="truncate">{data.currencyCode}</span>
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
            currentValue={sessionsKPI.currentValue}
            previousValue={sessionsKPI.previousValue}
            currentLabel={sessionsKPI.currentLabel}
            previousLabel={sessionsKPI.previousLabel}
            colorScheme="green"
            percentageChange={sessionsKPI.change}
            comparisonLabel={sessionsKPI.comparisonLabel}
          />

          <KPICard
            title="Organic Conversions"
            icon={<MousePointerClick className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={conversionsKPI.currentValue}
            previousValue={conversionsKPI.previousValue}
            currentLabel={conversionsKPI.currentLabel}
            previousLabel={conversionsKPI.previousLabel}
            colorScheme="blue"
            percentageChange={conversionsKPI.change}
            comparisonLabel={conversionsKPI.comparisonLabel}
          />
        </div>
      )}

      {/* Traffic Chart - Total vs Organic */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-2 sm:py-3">
          <CardTitle className="text-base sm:text-lg md:text-xl">Total Traffic vs Organic Traffic ({chartLabels.trafficChart})</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            This chart shows how many visitors come to your website each day. <strong>Total Traffic</strong> includes everyone who visits from any source (social media, ads, direct links, etc.). <strong>Organic Traffic</strong> shows visitors who found you through Google or other search engines by typing in keywords. The gap between these lines shows how much of your traffic comes from free search results versus paid or other sources. When organic traffic grows, it means more people are finding you naturally through search.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6 pb-0.5 sm:pb-0">
          {/* Mobile Chart */}
          <ResponsiveContainer width="100%" height={300} className="sm:hidden">
            <LineChart data={trafficChartData} margin={{ top: 2, right: 5, left: -5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis
                dataKey="dayIndex"
                tick={{ fontSize: 9 }}
                label={{ value: 'Day', position: 'insideBottom', offset: -5, fontSize: 9 }}
                height={35}
                interval={Math.floor(trafficChartData.length / 6)}
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
                labelFormatter={(value) => `Day ${value}`}
                formatter={(value: any, name: any, props: any) => {
                  if (value === undefined || value === null) return [null, '']
                  const payload = props.payload
                  let label = String(name)
                  let dateInfo = ''
                  
                  if (name === 'currentTotalTraffic') {
                    label = 'Total Traffic (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'currentOrganicTraffic') {
                    label = 'Organic Traffic (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'previousTotalTraffic') {
                    label = 'Total Traffic (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  } else if (name === 'previousOrganicTraffic') {
                    label = 'Organic Traffic (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  }
                  
                  return [formatNumber(Number(value)), label + dateInfo]
                }}
              />
              {/* Current Period - Solid Lines */}
              <Line
                type="monotone"
                dataKey="currentTotalTraffic"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Total Traffic (Last)"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="currentOrganicTraffic"
                stroke="#22c55e"
                strokeWidth={2}
                name="Organic Traffic (Last)"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                animationDuration={300}
              />
              {/* Previous Period - Dotted Lines */}
              <Line
                type="monotone"
                dataKey="previousTotalTraffic"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Total Traffic (Previous)"
                dot={false}
                activeDot={{ r: 4 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="previousOrganicTraffic"
                stroke="#22c55e"
                strokeWidth={2}
                name="Organic Traffic (Previous)"
                dot={false}
                activeDot={{ r: 4 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Desktop Chart */}
          <ResponsiveContainer width="100%" height={450} className="hidden sm:block">
            <LineChart data={trafficChartData} margin={{ top: 2, right: 10, left: 0, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis
                dataKey="dayIndex"
                tick={{ fontSize: 11 }}
                label={{ value: 'Day', position: 'insideBottom', offset: -10, fontSize: 12 }}
                height={50}
                interval={Math.floor(trafficChartData.length / 12)}
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
                labelFormatter={(value) => `Day ${value}`}
                formatter={(value: any, name: any, props: any) => {
                  if (value === undefined || value === null) return [null, '']
                  const payload = props.payload
                  let label = String(name)
                  let dateInfo = ''
                  
                  if (name === 'currentTotalTraffic') {
                    label = 'Total Traffic (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'currentOrganicTraffic') {
                    label = 'Organic Traffic (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'previousTotalTraffic') {
                    label = 'Total Traffic (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  } else if (name === 'previousOrganicTraffic') {
                    label = 'Organic Traffic (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  }
                  
                  return [formatNumber(Number(value)), label + dateInfo]
                }}
              />
              <Legend content={<CustomGATrafficLegend />} wrapperStyle={{ paddingTop: '5px' }} />
              {/* Current Period - Solid Lines */}
              <Line
                type="monotone"
                dataKey="currentTotalTraffic"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Total Traffic (Last)"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="currentOrganicTraffic"
                stroke="#22c55e"
                strokeWidth={2.5}
                name="Organic Traffic (Last)"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                animationDuration={300}
              />
              {/* Previous Period - Dotted Lines */}
              <Line
                type="monotone"
                dataKey="previousTotalTraffic"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Total Traffic (Previous)"
                dot={false}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="previousOrganicTraffic"
                stroke="#22c55e"
                strokeWidth={2.5}
                name="Organic Traffic (Previous)"
                dot={false}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Organic Sessions vs Conversions Chart */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-2 sm:py-3">
          <CardTitle className="text-base sm:text-lg md:text-xl">Organic Sessions vs Organic Conversions ({chartLabels.sessionsConversionsChart})</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            This chart tracks how well your website converts visitors into customers. <strong>Organic Sessions</strong> are visits from people who found you through Google search. <strong>Organic Conversions</strong> are when those visitors take a desired action (like making a purchase, filling out a form, or signing up). When conversions grow faster than sessions, it means your website is getting better at turning visitors into customers. If conversions stay flat while sessions grow, you may need to improve your website&apos;s ability to convert visitors.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6 pb-0.5 sm:pb-0">
          {/* Mobile Chart */}
          <ResponsiveContainer width="100%" height={300} className="sm:hidden">
            <LineChart data={sessionsConversionsChartData} margin={{ top: 2, right: 5, left: -5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis
                dataKey="dayIndex"
                tick={{ fontSize: 9 }}
                label={{ value: 'Day', position: 'insideBottom', offset: -5, fontSize: 9 }}
                height={35}
                interval={Math.floor(sessionsConversionsChartData.length / 6)}
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
                labelFormatter={(value) => `Day ${value}`}
                formatter={(value: any, name: any, props: any) => {
                  if (value === undefined || value === null) return [null, '']
                  const payload = props.payload
                  let label = String(name)
                  let dateInfo = ''
                  
                  if (name === 'currentOrganicSessions') {
                    label = 'Organic Sessions (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'currentOrganicConversions') {
                    label = 'Organic Conversions (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'previousOrganicSessions') {
                    label = 'Organic Sessions (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  } else if (name === 'previousOrganicConversions') {
                    label = 'Organic Conversions (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  }
                  
                  return [formatNumber(Number(value)), label + dateInfo]
                }}
              />
              {/* Current Period - Solid Lines */}
              <Line
                type="monotone"
                dataKey="currentOrganicSessions"
                stroke="#22c55e"
                strokeWidth={2}
                name="Organic Sessions (Last)"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="currentOrganicConversions"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Organic Conversions (Last)"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                animationDuration={300}
              />
              {/* Previous Period - Dotted Lines */}
              <Line
                type="monotone"
                dataKey="previousOrganicSessions"
                stroke="#22c55e"
                strokeWidth={2}
                name="Organic Sessions (Previous)"
                dot={false}
                activeDot={{ r: 4 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="previousOrganicConversions"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Organic Conversions (Previous)"
                dot={false}
                activeDot={{ r: 4 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Desktop Chart */}
          <ResponsiveContainer width="100%" height={450} className="hidden sm:block">
            <LineChart data={sessionsConversionsChartData} margin={{ top: 2, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis
                dataKey="dayIndex"
                tick={{ fontSize: 11 }}
                label={{ value: 'Day', position: 'insideBottom', offset: 0, fontSize: 12 }}
                height={45}
                interval={Math.floor(sessionsConversionsChartData.length / 12)}
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
                labelFormatter={(value) => `Day ${value}`}
                formatter={(value: any, name: any, props: any) => {
                  if (value === undefined || value === null) return [null, '']
                  const payload = props.payload
                  let label = String(name)
                  let dateInfo = ''
                  
                  if (name === 'currentOrganicSessions') {
                    label = 'Organic Sessions (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'currentOrganicConversions') {
                    label = 'Organic Conversions (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'previousOrganicSessions') {
                    label = 'Organic Sessions (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  } else if (name === 'previousOrganicConversions') {
                    label = 'Organic Conversions (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  }
                  
                  return [formatNumber(Number(value)), label + dateInfo]
                }}
              />
              <Legend content={<CustomGASessionsLegend />} wrapperStyle={{ paddingTop: '5px' }} />
              {/* Current Period - Solid Lines */}
              <Line
                type="monotone"
                dataKey="currentOrganicSessions"
                stroke="#22c55e"
                strokeWidth={2.5}
                name="Organic Sessions (Last)"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="currentOrganicConversions"
                stroke="#3b82f6"
                strokeWidth={2.5}
                name="Organic Conversions (Last)"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                animationDuration={300}
              />
              {/* Previous Period - Dotted Lines */}
              <Line
                type="monotone"
                dataKey="previousOrganicSessions"
                stroke="#22c55e"
                strokeWidth={2.5}
                name="Organic Sessions (Previous)"
                dot={false}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="previousOrganicConversions"
                stroke="#3b82f6"
                strokeWidth={2.5}
                name="Organic Conversions (Previous)"
                dot={false}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

