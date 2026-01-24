"use client"

import { useMemo } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import type { GBPDashboardData } from "@/lib/actions/gbp-dashboard"
import type { GMBGridDashboardData } from "@/lib/actions/gmb-dashboard"
import type { GMBMetricsDashboardData } from "@/lib/actions/gmb-metrics"
import { GBPDashboardPage } from "./gbp-dashboard-page"
import { GMBGridDashboardPage } from "./gmb-grid-dashboard-page"
import { useCachedFetch } from "@/lib/hooks/useCachedFetch"

interface CombinedPage4DashboardProps {
  gbpId?: string
  gmbId?: string  // This is the datasource ID for GMB
  today?: string // Optional locked today date (YYYY-MM-DD)
  clearOnMount?: boolean // Whether to clear cache on mount (for page refresh)
}

export function CombinedPage4Dashboard({ 
  gbpId, 
  gmbId, 
  today,
  clearOnMount = false 
}: CombinedPage4DashboardProps) {
  const todayParam = today ? `?today=${today}` : ''
  
  // Fetch GBP data with caching
  const {
    data: gbpData,
    loading: gbpLoading,
    error: gbpError
  } = useCachedFetch<GBPDashboardData>(
    gbpId ? `/api/gbp/dashboard/${gbpId}${todayParam}` : null,
    `page4:gbp:${gbpId}:${today || 'live'}`,
    { clearOnMount }
  )

  // Fetch GMB Grid data with caching (optional)
  const {
    data: gmbData,
    loading: gmbLoading
  } = useCachedFetch<GMBGridDashboardData>(
    gmbId ? `/api/gmb/grid-dashboard/${gmbId}${todayParam}` : null,
    `page4:gmb-grid:${gmbId}:${today || 'live'}`,
    { clearOnMount }
  )

  // Fetch GMB Metrics data with caching (optional)
  const {
    data: gmbMetricsData,
    loading: gmbMetricsLoading
  } = useCachedFetch<GMBMetricsDashboardData>(
    gmbId ? `/api/gmb/metrics/${gmbId}${todayParam}` : null,
    `page4:gmb-metrics:${gmbId}:${today || 'live'}`,
    { clearOnMount }
  )

  // Combine loading and error states
  const loading = gbpLoading || gmbLoading || gmbMetricsLoading
  const error = gbpError

  // Determine metadata display
  const metadata = useMemo(() => {
    if (!gbpData && !gmbData && !gmbMetricsData) return null
    
    let title = ''
    let subtitle: string | undefined = undefined
    
    // Rule 1: If only GBP is connected
    if (gbpData && !gmbData && !gmbMetricsData) {
      title = gbpData.businessName
      subtitle = gbpData.address || undefined
    }
    // Rule 2: If only GMB is connected (use metrics or grid data)
    else if (!gbpData && (gmbData || gmbMetricsData)) {
      title = gmbData?.businessName || gmbMetricsData?.businessName || ''
      subtitle = gmbData?.address || gmbMetricsData?.address || undefined
    }
    // Rule 3: If both are connected - show GBP's business name and address
    else if (gbpData && (gmbData || gmbMetricsData)) {
      title = gbpData.businessName
      subtitle = gbpData.address || undefined
    }
    
    return {
      title,
      subtitle
    }
  }, [gbpData, gmbData, gmbMetricsData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading SEO dashboard data..." />
      </div>
    )
  }

  if (error || (!gbpData && !gmbData && !gmbMetricsData)) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "Failed to load dashboard data. Please try again later."}
        />
      </div>
    )
  }

  // If only GBP data is available (no GMB grid or metrics), show native GBP layout
  if (gbpData && !gmbData && !gmbMetricsData) {
    return (
      <GBPDashboardPage 
        data={gbpData} 
        showMetadata={true} 
        showKPIs={true} 
      />
    )
  }

  // If only GMB data is available (grid or metrics), show native GMB grid layout
  if ((gmbData || gmbMetricsData) && !gbpData) {
    return (
      <GMBGridDashboardPage 
        data={gmbData}
        metricsData={gmbMetricsData}  // Pass metrics data directly
        showMetadata={true}
        showKPIs={true}
      />
    )
  }

  // Both are available - show combined layout without section headings
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Unified Metadata - Similar to Page 1 */}
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
        </div>
      )}

      {/* GBP Section - No heading, just content */}
      {gbpData && (
        <GBPDashboardPage 
          data={gbpData} 
          showMetadata={false}  // Hide metadata since it's shown above
          showKPIs={true}
          noPadding={true}  // No padding since parent already has it
        />
      )}

      {/* GMB Grid Section - No heading, just content */}
      {(gmbData || gmbMetricsData) && (
        <GMBGridDashboardPage 
          data={gmbData}
          metricsData={gmbMetricsData}  // Pass metrics data directly (already fetched in parallel)
          showMetadata={false}  // Hide metadata since it's shown above
          showKPIs={true}
          noPadding={true}  // No padding since parent already has it
        />
      )}
    </div>
  )
}
