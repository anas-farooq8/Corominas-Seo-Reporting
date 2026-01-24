"use client"

import { useMemo } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { Calendar, MousePointer, Eye, TrendingUp, Target } from "lucide-react"
import type { GALandingPagesDashboardData } from "@/lib/actions/google-analytics-landing-pages"
import type { GSCDashboardData } from "@/lib/actions/search-console-dashboard"
import { formatDateRange } from "@/lib/utils/dashboard-helpers"
import { KPICard } from "./kpi-card"
import { Page3LandingPagesDashboard } from "./page3-landing-pages-dashboard"
import { useCachedFetch } from "@/lib/hooks/useCachedFetch"

interface CombinedPage3DashboardProps {
  googleAnalyticsId?: string
  searchConsoleId?: string
  today?: string // Optional locked today date (YYYY-MM-DD)
  clearOnMount?: boolean // Whether to clear cache on mount (for page refresh)
}

export function CombinedPage3Dashboard({ 
  googleAnalyticsId, 
  searchConsoleId, 
  today,
  clearOnMount = false 
}: CombinedPage3DashboardProps) {
  const todayParam = today ? `?today=${today}` : ''
  
  // Fetch Google Analytics Landing Pages data with caching
  const {
    data: gaData,
    loading: gaLoading,
    error: gaError
  } = useCachedFetch<GALandingPagesDashboardData>(
    googleAnalyticsId ? `/api/google-analytics/landing-pages/${googleAnalyticsId}${todayParam}` : null,
    `page3:ga-landing:${googleAnalyticsId}:${today || 'live'}`,
    { clearOnMount }
  )

  // Fetch Search Console data with caching
  const {
    data: gscData,
    loading: gscLoading,
    error: gscError
  } = useCachedFetch<GSCDashboardData>(
    searchConsoleId ? `/api/search-console/dashboard/${searchConsoleId}${todayParam}` : null,
    `page3:gsc:${searchConsoleId}:${today || 'live'}`,
    { clearOnMount }
  )

  // Combine loading and error states
  const loading = gaLoading || gscLoading
  const error = gaError || gscError

  // Memoize Search Console KPI calculations
  const gscClicksKPI = useMemo(() => {
    if (!gscData) return null
    
    const kpi = gscData.kpiCards.totalClicks
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
  }, [gscData])

  const gscImpressionsKPI = useMemo(() => {
    if (!gscData) return null
    
    const kpi = gscData.kpiCards.totalImpressions
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
  }, [gscData])

  const gscCTRKPI = useMemo(() => {
    if (!gscData) return null
    
    const kpi = gscData.kpiCards.averageCTR
    return {
      change: {
        change: kpi.change,
        isIncrease: kpi.isIncrease
      },
      currentValue: kpi.current, // Keep decimals for CTR
      previousValue: kpi.previous,
      currentLabel: `Last ${kpi.periodType === '1-month' ? 'Month' : kpi.periodType.replace('-month', ' Months')}`,
      previousLabel: `Previous ${kpi.periodType === '1-month' ? 'Month' : kpi.periodType.replace('-month', ' Months')}`,
      comparisonLabel: kpi.periodLabel,
      formatValue: (value: number) => `${value.toFixed(2)}%`
    }
  }, [gscData])

  const gscPositionKPI = useMemo(() => {
    if (!gscData) return null
    
    const kpi = gscData.kpiCards.averagePosition
    return {
      change: {
        change: kpi.change,
        isIncrease: kpi.isIncrease
      },
      currentValue: kpi.current, // Keep decimals for position
      previousValue: kpi.previous,
      currentLabel: `Last ${kpi.periodType === '1-month' ? 'Month' : kpi.periodType.replace('-month', ' Months')}`,
      previousLabel: `Previous ${kpi.periodType === '1-month' ? 'Month' : kpi.periodType.replace('-month', ' Months')}`,
      comparisonLabel: kpi.periodLabel,
      formatValue: (value: number) => value.toFixed(2)
    }
  }, [gscData])

  // Determine metadata display
  const metadata = useMemo(() => {
    if (!gaData && !gscData) return null
    
    // If GA data is present, use GA metadata (has displayName, timeZone, currencyCode)
    if (gaData) {
      return {
        title: gaData.displayName,
        subtitle: gaData && gscData ? gscData.siteUrl : undefined, // Show siteUrl when both exist
        timeZone: gaData.timeZone,
        currencyCode: gaData.currencyCode
      }
    }
    
    // If only GSC data is present, use siteUrl (no timeZone or currency for GSC)
    return {
      title: gscData?.siteUrl || ''
    }
  }, [gaData, gscData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading SEO dashboard data..." />
      </div>
    )
  }

  if (error || (!gaData && !gscData)) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "Failed to load dashboard data. Please try again later."}
        />
      </div>
    )
  }

  // If only Google Analytics data is available, use the native GA layout
  if (gaData && !gscData) {
    return (
      <Page3LandingPagesDashboard 
        data={gaData} 
        showMetadata={true} 
      />
    )
  }

  const kpiCount = (gscData ? 4 : 0)

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

      {/* Search Console KPI Cards */}
      {gscData && (
        <>
          <div className={`grid gap-2 sm:gap-3 ${gaData ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-2'}`}>
            {/* Total Clicks */}
            {gscClicksKPI && (
              <KPICard
                title="Total Clicks"
                icon={<MousePointer className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
                currentValue={gscClicksKPI.currentValue}
                previousValue={gscClicksKPI.previousValue}
                currentLabel={gscClicksKPI.currentLabel}
                previousLabel={gscClicksKPI.previousLabel}
                colorScheme="purple"
                percentageChange={gscClicksKPI.change}
                comparisonLabel={gscClicksKPI.comparisonLabel}
              />
            )}

            {/* Total Impressions */}
            {gscImpressionsKPI && (
              <KPICard
                title="Total Impressions"
                icon={<Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
                currentValue={gscImpressionsKPI.currentValue}
                previousValue={gscImpressionsKPI.previousValue}
                currentLabel={gscImpressionsKPI.currentLabel}
                previousLabel={gscImpressionsKPI.previousLabel}
                colorScheme="green"
                percentageChange={gscImpressionsKPI.change}
                comparisonLabel={gscImpressionsKPI.comparisonLabel}
              />
            )}

            {/* Average CTR */}
            {gscCTRKPI && (
              <KPICard
                title="Average CTR"
                icon={<TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
                currentValue={gscCTRKPI.currentValue}
                previousValue={gscCTRKPI.previousValue}
                currentLabel={gscCTRKPI.currentLabel}
                previousLabel={gscCTRKPI.previousLabel}
                colorScheme="blue"
                percentageChange={gscCTRKPI.change}
                comparisonLabel={gscCTRKPI.comparisonLabel}
                formatValue={gscCTRKPI.formatValue}
              />
            )}

            {/* Average Position */}
            {gscPositionKPI && (
              <KPICard
                title="Average Position"
                icon={<Target className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
                currentValue={gscPositionKPI.currentValue}
                previousValue={gscPositionKPI.previousValue}
                currentLabel={gscPositionKPI.currentLabel}
                previousLabel={gscPositionKPI.previousLabel}
                colorScheme="orange"
                percentageChange={gscPositionKPI.change}
                comparisonLabel={gscPositionKPI.comparisonLabel}
                formatValue={gscPositionKPI.formatValue}
              />
            )}
          </div>
        </>
      )}

      {/* Google Analytics Landing Pages Dashboard */}
      {gaData && (
        <Page3LandingPagesDashboard data={gaData} showMetadata={false} />
      )}
    </div>
  )
}

