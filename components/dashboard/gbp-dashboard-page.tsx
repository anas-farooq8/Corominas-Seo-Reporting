"use client"

import { useState, useEffect, useMemo } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Navigation, MousePointerClick } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { GBPDashboardData } from "@/lib/actions/gbp-dashboard"
import {
  formatNumber,
  formatDateForDisplay,
  formatFullDate,
} from "@/lib/utils/dashboard-helpers"
import { KPICard } from "./kpi-card"

interface GBPDashboardPageProps {
  datasourceId?: string
  data?: GBPDashboardData | null
  showMetadata?: boolean
  showKPIs?: boolean
}

export function GBPDashboardPage({ 
  datasourceId, 
  data: externalData, 
  showMetadata = true,
  showKPIs = true
}: GBPDashboardPageProps) {
  const [data, setData] = useState<GBPDashboardData | null>(externalData || null)
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
        const response = await fetch(`/api/gbp/dashboard/${datasourceId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data")
        }
        const dashboardData = await response.json()
        if (isMounted) {
          setData(dashboardData)
        }
      } catch (err) {
        console.error("Error fetching GBP dashboard:", err)
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

  // Helper function to aggregate daily data into monthly sums
  const aggregateToMonthly = (dailyData: Array<{
    date: string
    dateKey: string
    fullDate: string
    calls: number
    directions: number
    websiteClicks: number
  }>) => {
    const monthlyMap = new Map<string, {
      calls: number
      directions: number
      websiteClicks: number
      monthKey: string
      monthLabel: string
    }>()
    
    dailyData.forEach(day => {
      // Extract year and month from YYYYMMDD format (dateKey)
      const year = day.dateKey.substring(0, 4)
      const month = day.dateKey.substring(4, 6)
      const monthKey = `${year}-${month}`
      
      // Create month label (e.g., "Aug 2025", "Sep 2025")
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          calls: 0,
          directions: 0,
          websiteClicks: 0,
          monthKey,
          monthLabel
        })
      }
      
      const monthData = monthlyMap.get(monthKey)!
      monthData.calls += day.calls
      monthData.directions += day.directions
      monthData.websiteClicks += day.websiteClicks
    })
    
    // Convert map to array and sort by month key
    return Array.from(monthlyMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  }

  // Determine if we should use monthly aggregation
  const useMonthlyAggregation = useMemo(() => {
    if (!data || !data.chartPeriod) return false
    return data.chartPeriod !== '1-month' // Aggregate for 3-month and 6-month
  }, [data])

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
    
    // If period > 1 month, aggregate to monthly data
    if (useMonthlyAggregation) {
      const currentFormatted = currentData.map(day => ({
        date: formatDateForDisplay(day.date),
        dateKey: day.date,
        fullDate: formatFullDate(day.date),
        calls: day.calls,
        directions: day.directions,
        websiteClicks: day.websiteClicks
      }))
      
      const previousFormatted = previousData.map(day => ({
        date: formatDateForDisplay(day.date),
        dateKey: day.date,
        fullDate: formatFullDate(day.date),
        calls: day.calls,
        directions: day.directions,
        websiteClicks: day.websiteClicks
      }))
      
      const currentMonthly = aggregateToMonthly(currentFormatted)
      const previousMonthly = aggregateToMonthly(previousFormatted)
      
      const current = currentMonthly.map((month, index) => ({
        dayIndex: index + 1,
        date: month.monthLabel,
        dateKey: month.monthKey,
        fullDate: month.monthLabel,
        calls: month.calls,
        directions: month.directions,
        websiteClicks: month.websiteClicks
      }))
      
      const previous = previousMonthly.map((month, index) => ({
        dayIndex: index + 1,
        date: month.monthLabel,
        dateKey: month.monthKey,
        fullDate: month.monthLabel,
        calls: month.calls,
        directions: month.directions,
        websiteClicks: month.websiteClicks
      }))
      
      return { current, previous }
    }
    
    // For 1-month period, use daily data (original behavior)
    const current = currentData.map((day, index) => ({
      dayIndex: index + 1, // Numeric x-axis starting from 1
      date: formatDateForDisplay(day.date),
      dateKey: day.date,
      fullDate: formatFullDate(day.date),
      calls: day.calls,
      directions: day.directions,
      websiteClicks: day.websiteClicks
    }))
    
    const previous = previousData.map((day, index) => ({
      dayIndex: index + 1, // Numeric x-axis starting from 1
      date: formatDateForDisplay(day.date),
      dateKey: day.date,
      fullDate: formatFullDate(day.date),
      calls: day.calls,
      directions: day.directions,
      websiteClicks: day.websiteClicks
    }))
    
    return { current, previous }
  }, [data, useMonthlyAggregation])
  
  // Create combined chart data for all metrics
  const activityChartData = useMemo(() => {
    if (!data || !data.kpiCards || !chartData.current.length) return []
    
    if (useMonthlyAggregation) {
      // For monthly data, align months by their labels
      const maxLength = Math.max(chartData.current.length, chartData.previous.length)
      const combinedData = []
      
      for (let i = 0; i < maxLength; i++) {
        const current = chartData.current[i]
        const previous = chartData.previous[i]
        
        combinedData.push({
          dayIndex: i + 1,
          // Current period data (undefined if month doesn't exist)
          currentCalls: current?.calls,
          currentDirections: current?.directions,
          currentWebsiteClicks: current?.websiteClicks,
          currentDate: current?.fullDate,
          currentDateShort: current?.date,
          // Previous period data (undefined if month doesn't exist)
          previousCalls: previous?.calls,
          previousDirections: previous?.directions,
          previousWebsiteClicks: previous?.websiteClicks,
          previousDate: previous?.fullDate,
          previousDateShort: previous?.date,
        })
      }
      
      return combinedData
    }
    
    // For daily data, combine both periods with aligned dayIndex
    // Use the maximum length to handle unequal periods
    const maxLength = Math.max(chartData.current.length, chartData.previous.length)
    const combinedData = []
    
    for (let i = 0; i < maxLength; i++) {
      const dayNum = i + 1
      const current = chartData.current[i]
      const previous = chartData.previous[i]
      
      combinedData.push({
        dayIndex: dayNum,
        // Current period data (undefined if day doesn't exist)
        currentCalls: current?.calls,
        currentDirections: current?.directions,
        currentWebsiteClicks: current?.websiteClicks,
        currentDate: current?.fullDate,
        currentDateShort: current?.date,
        // Previous period data (undefined if day doesn't exist)
        previousCalls: previous?.calls,
        previousDirections: previous?.directions,
        previousWebsiteClicks: previous?.websiteClicks,
        previousDate: previous?.fullDate,
        previousDateShort: previous?.date,
      })
    }
    
    return combinedData
  }, [data, chartData, useMonthlyAggregation])

  // Memoize KPI calculations - using kpiCards from backend
  const callsKPI = useMemo(() => {
    if (!data || !data.kpiCards) return null
    
    const kpi = data.kpiCards.calls
    
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

  const directionsKPI = useMemo(() => {
    if (!data || !data.kpiCards) return null
    
    const kpi = data.kpiCards.directions
    
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
  
  const websiteClicksKPI = useMemo(() => {
    if (!data || !data.kpiCards) return null
    
    const kpi = data.kpiCards.websiteClicks
    
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
  
  // Compute period label for chart
  const chartLabel = useMemo(() => {
    if (!data || !data.chartPeriod) return 'Past 12 Months'
    
    if (data.chartPeriod === '1-month') return 'Past Month'
    if (data.chartPeriod === '3-month') return 'Past 3 Months'
    return 'Past 6 Months'
  }, [data])
  
  // Custom legend for activity chart
  const CustomActivityLegend = () => {
    const legendItems = [
      { value: 'Calls (Last)', color: '#3b82f6', strokeDasharray: '' },
      { value: 'Directions (Last)', color: '#22c55e', strokeDasharray: '' },
      { value: 'Website Clicks (Last)', color: '#8b5cf6', strokeDasharray: '' },
      { value: 'Calls (Previous)', color: '#3b82f6', strokeDasharray: '5 5' },
      { value: 'Directions (Previous)', color: '#22c55e', strokeDasharray: '5 5' },
      { value: 'Website Clicks (Previous)', color: '#8b5cf6', strokeDasharray: '5 5' },
    ]
    
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        paddingTop: '10px',
        fontSize: '13px'
      }}>
        {legendItems.map((item) => (
          <div key={item.value} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="18" height="2" style={{ overflow: 'visible' }}>
              <line 
                x1="0" 
                y1="1" 
                x2="18" 
                y2="1" 
                stroke={item.color} 
                strokeWidth="3"
                strokeDasharray={item.strokeDasharray}
              />
            </svg>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading SEO dashboard data..." />
      </div>
    )
  }

  if (error || !data || !callsKPI || !directionsKPI || !websiteClicksKPI) {
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
            {data.businessName}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Google Business Profile Activity
          </p>
        </div>
      )}

      {/* KPI Cards */}
      {showKPIs && (
        <div className="grid gap-2 sm:gap-3 grid-cols-3">
          <KPICard
            title="Calls"
            icon={<Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={callsKPI.currentValue}
            previousValue={callsKPI.previousValue}
            currentLabel={callsKPI.currentLabel}
            previousLabel={callsKPI.previousLabel}
            colorScheme="blue"
            percentageChange={callsKPI.change}
            comparisonLabel={callsKPI.comparisonLabel}
          />

          <KPICard
            title="Directions"
            icon={<Navigation className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={directionsKPI.currentValue}
            previousValue={directionsKPI.previousValue}
            currentLabel={directionsKPI.currentLabel}
            previousLabel={directionsKPI.previousLabel}
            colorScheme="green"
            percentageChange={directionsKPI.change}
            comparisonLabel={directionsKPI.comparisonLabel}
          />

          <KPICard
            title="Website Clicks"
            icon={<MousePointerClick className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={websiteClicksKPI.currentValue}
            previousValue={websiteClicksKPI.previousValue}
            currentLabel={websiteClicksKPI.currentLabel}
            previousLabel={websiteClicksKPI.previousLabel}
            colorScheme="purple"
            percentageChange={websiteClicksKPI.change}
            comparisonLabel={websiteClicksKPI.comparisonLabel}
          />
        </div>
      )}

      {/* Activity Chart - All metrics combined */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-2 sm:py-3">
          <CardTitle className="text-base sm:text-lg md:text-xl">Business Profile Activity ({chartLabel})</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            This chart shows customer actions from your Google Business Profile. <strong>Calls</strong> are when customers tap the phone button to call you. <strong>Directions</strong> are when customers request directions to your location. <strong>Website Clicks</strong> are when customers click through to visit your website. These actions show how effectively your business profile drives customer engagement. Higher numbers mean more customers are taking action after finding your business on Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6 pb-0.5 sm:pb-0">
          {/* Mobile Chart */}
          <ResponsiveContainer width="100%" height={300} className="sm:hidden">
            <LineChart data={activityChartData} margin={{ top: 2, right: 5, left: -5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis
                dataKey={useMonthlyAggregation ? "currentDateShort" : "dayIndex"}
                tick={{ fontSize: 9 }}
                label={{ value: useMonthlyAggregation ? 'Month' : 'Day', position: 'insideBottom', offset: -5, fontSize: 9 }}
                height={35}
                interval={useMonthlyAggregation ? 0 : Math.floor(activityChartData.length / 6)}
                angle={useMonthlyAggregation ? -45 : 0}
                textAnchor={useMonthlyAggregation ? "end" : "middle"}
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
                labelFormatter={(value) => useMonthlyAggregation ? String(value) : `Day ${value}`}
                formatter={(value: any, name: any, props: any) => {
                  if (value === undefined || value === null) return [null, '']
                  const payload = props.payload
                  let label = String(name)
                  let dateInfo = ''
                  
                  if (name === 'currentCalls') {
                    label = 'Calls (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'previousCalls') {
                    label = 'Calls (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  } else if (name === 'currentDirections') {
                    label = 'Directions (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'previousDirections') {
                    label = 'Directions (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  } else if (name === 'currentWebsiteClicks') {
                    label = 'Website Clicks (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'previousWebsiteClicks') {
                    label = 'Website Clicks (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  }
                  
                  return [formatNumber(Number(value)), label + dateInfo]
                }}
              />
              {/* Current Period - Solid Lines */}
              <Line
                type={useMonthlyAggregation ? "linear" : "monotone"}
                dataKey="currentCalls"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Calls (Last)"
                dot={useMonthlyAggregation ? { r: 4 } : false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type={useMonthlyAggregation ? "linear" : "monotone"}
                dataKey="currentDirections"
                stroke="#22c55e"
                strokeWidth={2}
                name="Directions (Last)"
                dot={useMonthlyAggregation ? { r: 4 } : false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type={useMonthlyAggregation ? "linear" : "monotone"}
                dataKey="currentWebsiteClicks"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Website Clicks (Last)"
                dot={useMonthlyAggregation ? { r: 4 } : false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                animationDuration={300}
              />
              {/* Previous Period - Dotted Lines */}
              <Line
                type={useMonthlyAggregation ? "linear" : "monotone"}
                dataKey="previousCalls"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Calls (Previous)"
                dot={useMonthlyAggregation ? { r: 4 } : false}
                activeDot={{ r: 4 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type={useMonthlyAggregation ? "linear" : "monotone"}
                dataKey="previousDirections"
                stroke="#22c55e"
                strokeWidth={2}
                name="Directions (Previous)"
                dot={useMonthlyAggregation ? { r: 4 } : false}
                activeDot={{ r: 4 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type={useMonthlyAggregation ? "linear" : "monotone"}
                dataKey="previousWebsiteClicks"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Website Clicks (Previous)"
                dot={useMonthlyAggregation ? { r: 4 } : false}
                activeDot={{ r: 4 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Desktop Chart */}
          <ResponsiveContainer width="100%" height={450} className="hidden sm:block">
            <LineChart data={activityChartData} margin={{ top: 2, right: 10, left: 0, bottom: useMonthlyAggregation ? 35 : 15 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis
                dataKey={useMonthlyAggregation ? "currentDateShort" : "dayIndex"}
                tick={{ fontSize: 11 }}
                label={{ value: useMonthlyAggregation ? 'Month' : 'Day', position: 'insideBottom', offset: useMonthlyAggregation ? -15 : -10, fontSize: 12 }}
                height={useMonthlyAggregation ? 70 : 50}
                interval={useMonthlyAggregation ? 0 : Math.floor(activityChartData.length / 12)}
                angle={useMonthlyAggregation ? -45 : 0}
                textAnchor={useMonthlyAggregation ? "end" : "middle"}
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
                labelFormatter={(value) => useMonthlyAggregation ? String(value) : `Day ${value}`}
                formatter={(value: any, name: any, props: any) => {
                  if (value === undefined || value === null) return [null, '']
                  const payload = props.payload
                  let label = String(name)
                  let dateInfo = ''
                  
                  if (name === 'currentCalls') {
                    label = 'Calls (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'previousCalls') {
                    label = 'Calls (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  } else if (name === 'currentDirections') {
                    label = 'Directions (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'previousDirections') {
                    label = 'Directions (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  } else if (name === 'currentWebsiteClicks') {
                    label = 'Website Clicks (Last)'
                    dateInfo = payload.currentDate ? ` - ${payload.currentDate}` : ''
                  } else if (name === 'previousWebsiteClicks') {
                    label = 'Website Clicks (Previous)'
                    dateInfo = payload.previousDate ? ` - ${payload.previousDate}` : ''
                  }
                  
                  return [formatNumber(Number(value)), label + dateInfo]
                }}
              />
              <Legend content={<CustomActivityLegend />} wrapperStyle={{ paddingTop: '20px' }} />
              {/* Current Period - Solid Lines */}
              <Line
                type={useMonthlyAggregation ? "linear" : "monotone"}
                dataKey="currentCalls"
                stroke="#3b82f6"
                strokeWidth={2.5}
                name="Calls (Last)"
                dot={useMonthlyAggregation ? { r: 5 } : false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type={useMonthlyAggregation ? "linear" : "monotone"}
                dataKey="currentDirections"
                stroke="#22c55e"
                strokeWidth={2.5}
                name="Directions (Last)"
                dot={useMonthlyAggregation ? { r: 5 } : false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type={useMonthlyAggregation ? "linear" : "monotone"}
                dataKey="currentWebsiteClicks"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                name="Website Clicks (Last)"
                dot={useMonthlyAggregation ? { r: 5 } : false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                animationDuration={300}
              />
              {/* Previous Period - Dotted Lines */}
              <Line
                type={useMonthlyAggregation ? "linear" : "monotone"}
                dataKey="previousCalls"
                stroke="#3b82f6"
                strokeWidth={2.5}
                name="Calls (Previous)"
                dot={useMonthlyAggregation ? { r: 5 } : false}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type={useMonthlyAggregation ? "linear" : "monotone"}
                dataKey="previousDirections"
                stroke="#22c55e"
                strokeWidth={2.5}
                name="Directions (Previous)"
                dot={useMonthlyAggregation ? { r: 5 } : false}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type={useMonthlyAggregation ? "linear" : "monotone"}
                dataKey="previousWebsiteClicks"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                name="Website Clicks (Previous)"
                dot={useMonthlyAggregation ? { r: 5 } : false}
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

