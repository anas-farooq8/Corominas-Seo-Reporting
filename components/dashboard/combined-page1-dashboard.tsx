"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { Calendar, TrendingUp, MousePointerClick, Key } from "lucide-react"
import type { GADashboardData } from "@/lib/actions/google-analytics-dashboard"
import type { SEMrushDashboardData } from "@/lib/actions/semrush-dashboard"
import { 
  calculatePercentageChange, 
  formatDateRange,
  getMonthYear,
  getPreviousMonthYear,
  selectBestComparisonWindow
} from "@/lib/utils/dashboard-helpers"
import { KPICard } from "./kpi-card"
import { SEMrushChart } from "./semrush-chart"
import { GoogleAnalyticsDashboardPage } from "./google-analytics-dashboard-page"
import type { LayerKey } from "./chart-layer-filters"

interface CombinedPage1DashboardProps {
  googleAnalyticsId?: string
  semrushId?: string
}

export function CombinedPage1Dashboard({ googleAnalyticsId, semrushId }: CombinedPage1DashboardProps) {
  const [gaData, setGAData] = useState<GADashboardData | null>(null)
  const [semrushData, setSemrushData] = useState<SEMrushDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // SEMrush chart filters - all enabled by default
  const [visibleLayers, setVisibleLayers] = useState<Record<LayerKey, boolean>>({
    'Top 3': true,
    '4-10': true,
    '11-20': true,
    '21-50': true,
    '51-100': true,
    'AI Overviews': true,
    'SERP functions': true,
  })

  const toggleLayer = useCallback((layer: LayerKey) => {
    setVisibleLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
  }, [])

  useEffect(() => {
    let isMounted = true

    async function fetchAllData() {
      try {
        setLoading(true)
        setError(null)

        const promises = []
        
        if (googleAnalyticsId) {
          promises.push(
            fetch(`/api/google-analytics/dashboard/${googleAnalyticsId}`)
              .then(res => res.json())
              .then(data => isMounted && setGAData(data))
          )
        }
        
        if (semrushId) {
          promises.push(
            fetch(`/api/semrush/dashboard/${semrushId}`)
              .then(res => res.json())
              .then(data => isMounted && setSemrushData(data))
          )
        }

        await Promise.all(promises)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchAllData()

    return () => {
      isMounted = false
    }
  }, [googleAnalyticsId, semrushId])

  // Memoize KPI calculations - using best comparison window
  const semrushKPI = useMemo(() => {
    if (!semrushData) return null
    
    const bestWindow = selectBestComparisonWindow(
      semrushData.dailyData,
      (item) => item.totalKeywords,
      semrushData.dateRanges.endDate
    )
    
    return {
      change: {
        change: bestWindow.change,
        isIncrease: bestWindow.isIncrease
      },
      currentValue: Math.round(bestWindow.current),
      previousValue: Math.round(bestWindow.previous),
      currentLabel: `Last ${bestWindow.periodType === '1-month' ? 'Month' : bestWindow.periodType.replace('-month', ' Months')}`,
      previousLabel: `Previous ${bestWindow.periodType === '1-month' ? 'Month' : bestWindow.periodType.replace('-month', ' Months')}`,
      comparisonLabel: bestWindow.periodLabel
    }
  }, [semrushData])

  const gaSessionsKPI = useMemo(() => {
    if (!gaData) return null
    
    const bestWindow = selectBestComparisonWindow(
      gaData.dailyData,
      (item) => item.organicSessions,
      gaData.dateRanges.endDate
    )
    
    return {
      change: {
        change: bestWindow.change,
        isIncrease: bestWindow.isIncrease
      },
      currentValue: Math.round(bestWindow.current),
      previousValue: Math.round(bestWindow.previous),
      currentLabel: `Last ${bestWindow.periodType === '1-month' ? 'Month' : bestWindow.periodType.replace('-month', ' Months')}`,
      previousLabel: `Previous ${bestWindow.periodType === '1-month' ? 'Month' : bestWindow.periodType.replace('-month', ' Months')}`,
      comparisonLabel: bestWindow.periodLabel
    }
  }, [gaData])

  const gaConversionsKPI = useMemo(() => {
    if (!gaData) return null
    
    const bestWindow = selectBestComparisonWindow(
      gaData.dailyData,
      (item) => item.organicConversions,
      gaData.dateRanges.endDate
    )
    
    return {
      change: {
        change: bestWindow.change,
        isIncrease: bestWindow.isIncrease
      },
      currentValue: Math.round(bestWindow.current),
      previousValue: Math.round(bestWindow.previous),
      currentLabel: `Last ${bestWindow.periodType === '1-month' ? 'Month' : bestWindow.periodType.replace('-month', ' Months')}`,
      previousLabel: `Previous ${bestWindow.periodType === '1-month' ? 'Month' : bestWindow.periodType.replace('-month', ' Months')}`,
      comparisonLabel: bestWindow.periodLabel
    }
  }, [gaData])

  // Determine metadata display
  const metadata = useMemo(() => {
    const displayMetadata = gaData || semrushData
    if (!displayMetadata) return null
    
    return {
      title: gaData ? gaData.displayName : semrushData?.domain,
      timeZone: gaData?.timeZone,
      startDate: gaData ? gaData.dateRanges.startDate : semrushData?.dateRanges.startDate,
      endDate: gaData ? gaData.dateRanges.endDate : semrushData?.dateRanges.endDate
    }
  }, [gaData, semrushData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading SEO dashboard data..." />
      </div>
    )
  }

  if (error || (!gaData && !semrushData)) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "Failed to load dashboard data. Please try again later."}
        />
      </div>
    )
  }

  // If only Google Analytics data is available, use the native GA layout so charts and titles
  // align correctly instead of using the combined layout shell.
  if (gaData && !semrushData) {
    return (
      <GoogleAnalyticsDashboardPage 
        data={gaData} 
        showMetadata={true} 
        showKPIs={true} 
      />
    )
  }

  const kpiCount = (semrushData ? 1 : 0) + (gaData ? 2 : 0)

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Property/Domain Info */}
      {metadata && (
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            {metadata.title}
          </h2>
          <div className="flex flex-col gap-1 mt-1.5 sm:mt-2">
            {metadata.timeZone && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="font-medium">Time Zone:</span>
                <span className="truncate">{metadata.timeZone}</span>
              </div>
            )}
            {metadata.startDate && metadata.endDate && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs md:text-sm">
                  {formatDateRange(metadata.startDate)} - {formatDateRange(metadata.endDate)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards - Combined */}
      <div className={`grid gap-2 sm:gap-3 ${kpiCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {/* SEMrush Total Organic Keywords */}
        {semrushData && semrushKPI && (
          <KPICard
            title="Total Ranking Organic Keywords"
            icon={<Key className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={semrushKPI.currentValue}
            previousValue={semrushKPI.previousValue}
            currentLabel={semrushKPI.currentLabel}
            previousLabel={semrushKPI.previousLabel}
            colorScheme="purple"
            percentageChange={semrushKPI.change}
            comparisonLabel={semrushKPI.comparisonLabel}
          />
        )}

        {/* Google Analytics KPI Cards */}
        {gaData && gaSessionsKPI && (
          <KPICard
            title="Organic Sessions"
            icon={<TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={gaSessionsKPI.currentValue}
            previousValue={gaSessionsKPI.previousValue}
            currentLabel={gaSessionsKPI.currentLabel}
            previousLabel={gaSessionsKPI.previousLabel}
            colorScheme="green"
            percentageChange={gaSessionsKPI.change}
            comparisonLabel={gaSessionsKPI.comparisonLabel}
          />
        )}

        {gaData && gaConversionsKPI && (
          <KPICard
            title="Organic Conversions"
            icon={<MousePointerClick className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={gaConversionsKPI.currentValue}
            previousValue={gaConversionsKPI.previousValue}
            currentLabel={gaConversionsKPI.currentLabel}
            previousLabel={gaConversionsKPI.previousLabel}
            colorScheme="blue"
            percentageChange={gaConversionsKPI.change}
            comparisonLabel={gaConversionsKPI.comparisonLabel}
          />
        )}
      </div>

      {/* SEMrush Chart */}
      {semrushData && (
        <SEMrushChart
          dailyData={semrushData.dailyData}
          visibleLayers={visibleLayers}
          onToggleLayer={toggleLayer}
        />
      )}

      {/* Google Analytics Dashboard */}
      {gaData && (
        <GoogleAnalyticsDashboardPage data={gaData} showMetadata={false} showKPIs={false} />
      )}
    </div>
  )
}
