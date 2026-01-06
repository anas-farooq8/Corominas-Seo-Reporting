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
  }, [data])
  
  // Create combined chart data for all metrics
  const activityChartData = useMemo(() => {
    if (!data || !data.kpiCards || !chartData.current.length) return []
    
    // Combine both periods into a single chart data array with aligned dayIndex
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
  }, [data, chartData])

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
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span className="text-muted-foreground">Calls (Last)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-blue-500 opacity-40" style={{ borderTop: '2px dashed' }} />
          <span className="text-muted-foreground">Calls (Previous)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-green-500" />
          <span className="text-muted-foreground">Directions (Last)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-green-500 opacity-40" style={{ borderTop: '2px dashed' }} />
          <span className="text-muted-foreground">Directions (Previous)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-purple-500" />
          <span className="text-muted-foreground">Website Clicks (Last)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-purple-500 opacity-40" style={{ borderTop: '2px dashed' }} />
          <span className="text-muted-foreground">Website Clicks (Previous)</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading Google Business Profile data..." />
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
                dataKey="dayIndex"
                tick={{ fontSize: 9 }}
                label={{ value: 'Day', position: 'insideBottom', offset: -5, fontSize: 9 }}
                height={35}
                interval={Math.floor(activityChartData.length / 6)}
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
                type="monotone"
                dataKey="currentCalls"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Calls (Last)"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="currentDirections"
                stroke="#22c55e"
                strokeWidth={2}
                name="Directions (Last)"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="currentWebsiteClicks"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Website Clicks (Last)"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                animationDuration={300}
              />
              {/* Previous Period - Dotted Lines */}
              <Line
                type="monotone"
                dataKey="previousCalls"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Calls (Previous)"
                dot={false}
                activeDot={{ r: 4 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="previousDirections"
                stroke="#22c55e"
                strokeWidth={2}
                name="Directions (Previous)"
                dot={false}
                activeDot={{ r: 4 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="previousWebsiteClicks"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Website Clicks (Previous)"
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
            <LineChart data={activityChartData} margin={{ top: 2, right: 10, left: 0, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis
                dataKey="dayIndex"
                tick={{ fontSize: 11 }}
                label={{ value: 'Day', position: 'insideBottom', offset: -10, fontSize: 12 }}
                height={50}
                interval={Math.floor(activityChartData.length / 12)}
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
              <Legend content={<CustomActivityLegend />} wrapperStyle={{ paddingTop: '5px' }} />
              {/* Current Period - Solid Lines */}
              <Line
                type="monotone"
                dataKey="currentCalls"
                stroke="#3b82f6"
                strokeWidth={2.5}
                name="Calls (Last)"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="currentDirections"
                stroke="#22c55e"
                strokeWidth={2.5}
                name="Directions (Last)"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="currentWebsiteClicks"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                name="Website Clicks (Last)"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                animationDuration={300}
              />
              {/* Previous Period - Dotted Lines */}
              <Line
                type="monotone"
                dataKey="previousCalls"
                stroke="#3b82f6"
                strokeWidth={2.5}
                name="Calls (Previous)"
                dot={false}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="previousDirections"
                stroke="#22c55e"
                strokeWidth={2.5}
                name="Directions (Previous)"
                dot={false}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
                connectNulls={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="previousWebsiteClicks"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                name="Website Clicks (Previous)"
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

