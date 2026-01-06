"use client"

import { useState, useEffect, useMemo } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Checkbox } from "@/components/ui/checkbox"
import type { GALandingPagesDashboardData } from "@/lib/actions/google-analytics-landing-pages"
import {
  formatNumber,
  formatDateForDisplay,
  formatFullDate,
  formatDateRange,
} from "@/lib/utils/dashboard-helpers"

interface Page4LandingPagesDashboardProps {
  datasourceId?: string
  data?: GALandingPagesDashboardData | null
  showMetadata?: boolean
}

type SortColumn = 'sessions' | 'conversions' | 'conversionRate'
type SortDirection = 'asc' | 'desc'

// Color palette for the chart lines - optimized for distinct visibility
const CHART_COLORS = [
  '#3b82f6', // blue - distinct from others
  '#22c55e', // green - distinct from others
  '#ef4444', // red - distinct from others
  '#8b5cf6', // violet/purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#d946ef', // fuchsia
  '#f59e0b', // amber
  '#6366f1', // indigo
  '#84cc16', // lime
]

export function Page4LandingPagesDashboard({ 
  datasourceId, 
  data: externalData, 
  showMetadata = true 
}: Page4LandingPagesDashboardProps) {
  const [data, setData] = useState<GALandingPagesDashboardData | null>(externalData || null)
  const [loading, setLoading] = useState(!externalData)
  const [error, setError] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<SortColumn>('sessions')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (externalData) {
      setData(externalData)
      setLoading(false)
      // Initialize only top 3 pages as selected
      const top3Urls = new Set<string>(externalData.topLandingPages.slice(0, 3).map(lp => lp.landingPage))
      setSelectedPages(top3Urls)
      return
    }
    
    let isMounted = true
    
    async function fetchDashboardData() {
      if (!datasourceId) return
      
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/google-analytics/landing-pages/${datasourceId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch landing pages data")
        }
        const dashboardData = await response.json()
        if (isMounted) {
          setData(dashboardData)
          // Initialize only top 3 pages as selected
          const top3Urls = new Set<string>(dashboardData.topLandingPages.slice(0, 3).map((lp: any) => lp.landingPage))
          setSelectedPages(top3Urls)
        }
      } catch (err) {
        console.error("Error fetching GA landing pages:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load landing pages data")
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
    
    return data.dailyData.map(day => {
      const chartPoint: any = {
        date: formatDateForDisplay(day.date),
        dateKey: day.date,
        fullDate: formatFullDate(day.date),
      }
      
      // Add each landing page's sessions to the chart point
      Object.entries(day.landingPages).forEach(([url, stats]) => {
        chartPoint[url] = stats.sessions
      })
      
      return chartPoint
    })
  }, [data])

  // Memoize sorted landing pages with colors
  const landingPagesWithColors = useMemo(() => {
    if (!data) return []
    
    return data.topLandingPages.map((lp, index) => ({
      ...lp,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))
  }, [data])

  // Use totals from API (computed from ALL landing pages, not just top 10)
  const totals = useMemo(() => {
    if (!data) return { sessions: 0, conversions: 0 }
    
    return { 
      sessions: data.totalSessions, 
      conversions: data.totalConversions 
    }
  }, [data])

  // Sort landing pages based on selected column
  const sortedLandingPages = useMemo(() => {
    const sorted = [...landingPagesWithColors]
    
    sorted.sort((a, b) => {
      let aValue: number, bValue: number
      
      switch (sortColumn) {
        case 'sessions':
          aValue = a.sessions
          bValue = b.sessions
          break
        case 'conversions':
          aValue = a.conversions
          bValue = b.conversions
          break
        case 'conversionRate':
          aValue = a.conversionRate
          bValue = b.conversionRate
          break
      }
      
      if (sortDirection === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
    
    return sorted
  }, [landingPagesWithColors, sortColumn, sortDirection])

  // Handle sort column click
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  // Handle checkbox toggle (ensure at least one is always selected)
  const handleTogglePage = (url: string) => {
    const newSelected = new Set(selectedPages)
    if (newSelected.has(url)) {
      // Only allow unchecking if there's more than one selected
      if (newSelected.size > 1) {
        newSelected.delete(url)
      }
      // If it's the last one selected, don't uncheck it
    } else {
      newSelected.add(url)
    }
    setSelectedPages(newSelected)
  }

  // Handle select all / select first only
  const handleToggleAll = () => {
    if (isAllSelected) {
      // If all selected, select only the first one
      const firstUrl = landingPagesWithColors.length > 0 ? landingPagesWithColors[0].landingPage : ''
      setSelectedPages(firstUrl ? new Set([firstUrl]) : new Set())
    } else {
      // If some selected, select only the first one
      const firstUrl = landingPagesWithColors.length > 0 ? landingPagesWithColors[0].landingPage : ''
      setSelectedPages(firstUrl ? new Set([firstUrl]) : new Set())
    }
  }

  // Determine master checkbox state
  const allPagesCount = landingPagesWithColors.length
  const selectedCount = selectedPages.size
  const isAllSelected = selectedCount === allPagesCount && allPagesCount > 0
  const isSomeSelected = selectedCount > 0 && selectedCount < allPagesCount
  const isNoneSelected = selectedCount === 0

  // Custom tooltip with sorted values
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // Sort payload by value in descending order
      const sortedPayload = [...payload].sort((a, b) => b.value - a.value)
      
      return (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          maxWidth: '400px'
        }}>
          <p style={{ 
            color: '#111827', 
            fontWeight: 600, 
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            {payload[0].payload.fullDate}
          </p>
          <div style={{ fontSize: '13px', maxHeight: '300px', overflowY: 'auto' }}>
            {sortedPayload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color, margin: '4px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <strong>{formatNumber(entry.value)}</strong>
                <span style={{ color: '#6b7280', fontSize: '12px', lineHeight: '1.2' }}>
                  {entry.name.substring(0, 60)}{entry.name.length > 60 ? '...' : ''}
                </span>
              </p>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  // Sort icon component
  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline-block opacity-40" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1 inline-block" />
      : <ArrowDown className="h-4 w-4 ml-1 inline-block" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading SEO dashboard data..." />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "Failed to load landing pages data. Please try again later."}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${showMetadata ? 'p-3 sm:p-4 md:p-6 lg:p-8' : ''}`}>
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

      {/* Landing Pages Chart + Table */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-2 sm:py-3">
          <CardTitle className="text-base sm:text-lg md:text-xl">Top Landing Pages - Organic Traffic (Past 12 Months)</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            This chart displays your top 10 landing pages that receive the most organic search traffic. Each colored line represents a different landing page and tracks how many visitors it attracted each day. <strong>Landing pages</strong> are the first pages people see when they arrive at your website from Google search. By default, the top 3 pages are shown to keep the chart readable. Use the checkboxes in the table below to show or hide specific pages. When multiple pages show similar trends, it indicates consistent overall site performance. If one page suddenly spikes, it might mean a specific article or page is ranking well for new search terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6 pb-2">
          {/* Chart */}
          <div className="mb-4">
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
                <Tooltip content={<CustomTooltip />} />
                {landingPagesWithColors.map((lp) => (
                  selectedPages.has(lp.landingPage) && (
                    <Line
                      key={lp.landingPage}
                      type="monotone"
                      dataKey={lp.landingPage}
                      stroke={lp.color}
                      strokeWidth={2}
                      name={lp.landingPage}
                      dot={false}
                      activeDot={{ r: 4 }}
                      animationDuration={300}
                    />
                  )
                ))}
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
                <Tooltip content={<CustomTooltip />} />
                {landingPagesWithColors.map((lp) => (
                  selectedPages.has(lp.landingPage) && (
                    <Line
                      key={lp.landingPage}
                      type="monotone"
                      dataKey={lp.landingPage}
                      stroke={lp.color}
                      strokeWidth={2.5}
                      name={lp.landingPage}
                      dot={false}
                      activeDot={{ r: 6 }}
                      animationDuration={300}
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-primary/10">
                <tr className="text-left">
                  <th className="pb-3 pt-2 px-2 font-semibold text-primary w-12">
                    <div className="cursor-pointer flex items-center" onClick={handleToggleAll}>
                      <Checkbox
                        checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                        className="h-5 w-5 cursor-pointer"
                        onCheckedChange={handleToggleAll}
                      />
                    </div>
                  </th>
                  <th className="pb-3 pt-2 px-2 font-semibold text-primary min-w-[150px] sm:min-w-[200px] text-xs sm:text-sm">Landing Page</th>
                  <th 
                    className="pb-3 pt-2 px-2 font-semibold text-primary text-right cursor-pointer hover:bg-primary/20 transition-colors text-xs sm:text-sm"
                    onClick={() => handleSort('sessions')}
                  >
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1">
                        <span>Organic Sessions</span>
                        <SortIcon column="sessions" />
                      </div>
                      <div className="text-[10px] sm:text-xs font-normal text-muted-foreground">
                        {formatNumber(totals.sessions)} total
                      </div>
                    </div>
                  </th>
                  <th 
                    className="pb-3 pt-2 px-2 font-semibold text-primary text-right cursor-pointer hover:bg-primary/20 transition-colors text-xs sm:text-sm"
                    onClick={() => handleSort('conversions')}
                  >
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1">
                        <span>Organic Conversions</span>
                        <SortIcon column="conversions" />
                      </div>
                      <div className="text-[10px] sm:text-xs font-normal text-muted-foreground">
                        {formatNumber(totals.conversions)} total
                      </div>
                    </div>
                  </th>
                  <th 
                    className="pb-3 pt-2 px-2 font-semibold text-primary text-right cursor-pointer hover:bg-primary/20 transition-colors text-xs sm:text-sm"
                    onClick={() => handleSort('conversionRate')}
                  >
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1">
                        <span>Conversion Rate</span>
                        <SortIcon column="conversionRate" />
                      </div>
                      <div className="text-[10px] sm:text-xs font-normal text-muted-foreground">
                        100% of total
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLandingPages.map((lp) => {
                  const sessionPercentage = totals.sessions > 0 ? (lp.sessions / totals.sessions * 100).toFixed(2) : '0.00'
                  const conversionPercentage = totals.conversions > 0 ? (lp.conversions / totals.conversions * 100).toFixed(2) : '0.00'
                  
                  return (
                    <tr key={lp.landingPage} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-1.5 sm:py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedPages.has(lp.landingPage)}
                            onCheckedChange={() => handleTogglePage(lp.landingPage)}
                            className="h-5 w-5 cursor-pointer"
                          />
                          <div 
                            className="w-4 h-4 rounded-sm flex-shrink-0" 
                            style={{ backgroundColor: lp.color }}
                          />
                        </div>
                      </td>
                      <td className="py-1.5 sm:py-3 px-2 max-w-md">
                        <div className="truncate text-[10px] sm:text-sm" title={lp.landingPage}>
                          {lp.landingPage}
                        </div>
                      </td>
                      <td className="py-1.5 sm:py-3 px-2 text-right font-medium text-[10px] sm:text-sm">
                        {formatNumber(lp.sessions)}{' '}
                        <span className="text-muted-foreground font-normal">({sessionPercentage}%)</span>
                      </td>
                      <td className="py-1.5 sm:py-3 px-2 text-right font-medium text-[10px] sm:text-sm">
                        {formatNumber(lp.conversions)}{' '}
                        <span className="text-muted-foreground font-normal">({conversionPercentage}%)</span>
                      </td>
                      <td className="py-1.5 sm:py-3 px-2 text-right font-medium text-[10px] sm:text-sm">
                        {(lp.conversionRate * 100).toFixed(2)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

