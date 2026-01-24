"use client"

import { useState, useMemo, useCallback } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { TrendingUp, MousePointerClick, Key, Activity } from "lucide-react"
import type { GADashboardData } from "@/lib/actions/google-analytics-dashboard"
import type { SEMrushDashboardData } from "@/lib/actions/semrush-dashboard"
import type { GBPActionsPage1Data } from "@/lib/actions/gbp-dashboard"
import { KPICard } from "./kpi-card"
import { SEMrushChart } from "./semrush-chart"
import { GoogleAnalyticsDashboardPage } from "./google-analytics-dashboard-page"
import type { LayerKey } from "./chart-layer-filters"
import { useCachedFetch } from "@/lib/hooks/useCachedFetch"

interface CombinedPage1DashboardProps {
  googleAnalyticsId?: string
  semrushId?: string
  gbpId?: string
  today?: string // Optional locked today date (YYYY-MM-DD)
  clearOnMount?: boolean // Whether to clear cache on mount (for page refresh)
}

export function CombinedPage1Dashboard({ 
  googleAnalyticsId, 
  semrushId, 
  gbpId, 
  today,
  clearOnMount = false 
}: CombinedPage1DashboardProps) {
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

  const todayParam = today ? `?today=${today}` : ''
  
  // Fetch Google Analytics data with caching
  const {
    data: gaData,
    loading: gaLoading,
    error: gaError
  } = useCachedFetch<GADashboardData>(
    googleAnalyticsId ? `/api/google-analytics/dashboard/${googleAnalyticsId}${todayParam}` : null,
    `page1:ga:${googleAnalyticsId}:${today || 'live'}`,
    { clearOnMount }
  )

  // Fetch SEMrush data with caching
  const {
    data: semrushData,
    loading: semrushLoading,
    error: semrushError
  } = useCachedFetch<SEMrushDashboardData>(
    semrushId ? `/api/semrush/dashboard/${semrushId}${todayParam}` : null,
    `page1:semrush:${semrushId}:${today || 'live'}`,
    { clearOnMount }
  )

  // Fetch GBP data with caching
  const {
    data: gbpData,
    loading: gbpLoading,
    error: gbpError
  } = useCachedFetch<GBPActionsPage1Data>(
    gbpId ? `/api/gbp/dashboard/${gbpId}/actions${todayParam}` : null,
    `page1:gbp:${gbpId}:${today || 'live'}`,
    { clearOnMount }
  )

  // Combine loading and error states
  const loading = gaLoading || semrushLoading || gbpLoading
  const error = gaError || semrushError || gbpError

  // Memoize KPI calculations - using kpiCards from backend (follows Page 4 GSC pattern)
  const semrushKPI = useMemo(() => {
    if (!semrushData || !semrushData.kpiCards) return null
    
    const kpi = semrushData.kpiCards.totalRankingKeywords
    
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
  }, [semrushData])

  const gaSessionsKPI = useMemo(() => {
    if (!gaData || !gaData.kpiCards) return null
    
    const kpi = gaData.kpiCards.organicSessions
    
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
  }, [gaData])

  const gaConversionsKPI = useMemo(() => {
    if (!gaData || !gaData.kpiCards) return null
    
    const kpi = gaData.kpiCards.organicConversions
    
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
  }, [gaData])

  const gbpActionsKPI = useMemo(() => {
    if (!gbpData || !gbpData.totalActions) return null
    
    const kpi = gbpData.totalActions
    
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
  }, [gbpData])

  // Determine metadata display (title, timezone, and currency)
  const metadata = useMemo(() => {
    const displayMetadata = gaData || semrushData || gbpData
    if (!displayMetadata) return null
    
    // Priority: GA displayName > SEMrush domain > GBP business name
    let title = gaData?.displayName || semrushData?.domain || gbpData?.businessName || ''
    let subtitle: string | undefined = undefined
    
    // Build subtitle based on what's connected
    const subtitleParts: string[] = []
    
    // If GA is primary title, add domain and/or business name to subtitle
    if (gaData?.displayName) {
      if (semrushData?.domain) subtitleParts.push(semrushData.domain)
      if (gbpData?.businessName) subtitleParts.push(gbpData.businessName)
    } 
    // If SEMrush is primary title (no GA), add business name to subtitle
    else if (semrushData?.domain && gbpData?.businessName) {
      subtitleParts.push(gbpData.businessName)
    }
    
    subtitle = subtitleParts.length > 0 ? subtitleParts.join(' • ') : undefined
    
    return {
      title,
      subtitle,
      timeZone: gaData?.timeZone,
      currencyCode: gaData?.currencyCode
    }
  }, [gaData, semrushData, gbpData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading SEO dashboard data..." />
      </div>
    )
  }

  if (error || (!gaData && !semrushData && !gbpData)) {
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
  if (gaData && !semrushData && !gbpData) {
    return (
      <GoogleAnalyticsDashboardPage 
        data={gaData} 
        showMetadata={true} 
        showKPIs={true} 
      />
    )
  }

  // Calculate KPI count for grid layout
  const kpiCount = (semrushData ? 1 : 0) + (gaData ? 2 : 0) + (gbpData ? 1 : 0)
  
  // Determine grid columns based on KPI count
  let gridCols = 'grid-cols-1'
  if (kpiCount === 2) gridCols = 'grid-cols-2'
  else if (kpiCount === 3) gridCols = 'grid-cols-3'
  else if (kpiCount === 4) gridCols = 'grid-cols-4'

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Property/Domain Info */}
      {metadata && (
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            {metadata.title}
          </h2>
          {metadata.subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {metadata.subtitle}
            </p>
          )}
          <div className="flex flex-col gap-1 mt-1.5 sm:mt-2">
            {metadata.timeZone && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="font-medium">Time Zone:</span>
                <span className="truncate">{metadata.timeZone}</span>
              </div>
            )}
            {metadata.currencyCode && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="font-medium">Currency:</span>
                <span className="truncate">{metadata.currencyCode}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards - Combined */}
      <div className={`grid gap-2 sm:gap-3 ${gridCols}`}>
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

        {/* GBP Actions KPI Card */}
        {gbpData && gbpActionsKPI && (
          <KPICard
            title="GBP Actions"
            icon={<Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={gbpActionsKPI.currentValue}
            previousValue={gbpActionsKPI.previousValue}
            currentLabel={gbpActionsKPI.currentLabel}
            previousLabel={gbpActionsKPI.previousLabel}
            colorScheme="orange"
            percentageChange={gbpActionsKPI.change}
            comparisonLabel={gbpActionsKPI.comparisonLabel}
          />
        )}
      </div>

      {/* SEMrush Chart */}
      {semrushData && (
        <SEMrushChart
          dailyData={semrushData.dailyData}
          visibleLayers={visibleLayers}
          onToggleLayer={toggleLayer}
          periodLabel={semrushData.kpiCards?.totalRankingKeywords.periodType ? 
            `Past ${semrushData.kpiCards.totalRankingKeywords.periodType === '1-month' ? 'Month' : semrushData.kpiCards.totalRankingKeywords.periodType.replace('-month', ' Months')}` 
            : 'Past 12 Months'}
          endDate={semrushData.dateRanges?.endDate}
        />
      )}

      {/* Google Analytics Dashboard */}
      {gaData && (
        <GoogleAnalyticsDashboardPage data={gaData} showMetadata={false} showKPIs={false} />
      )}
    </div>
  )
}
