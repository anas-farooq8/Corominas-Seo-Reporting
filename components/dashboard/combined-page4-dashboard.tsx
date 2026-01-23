"use client"

import { useState, useEffect, useMemo } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import type { GBPDashboardData } from "@/lib/actions/gbp-dashboard"
import type { GMBGridDashboardData } from "@/lib/actions/gmb-dashboard"
import type { GMBMetricsDashboardData } from "@/lib/actions/gmb-metrics"
import { GBPDashboardPage } from "./gbp-dashboard-page"
import { GMBGridDashboardPage } from "./gmb-grid-dashboard-page"

interface CombinedPage4DashboardProps {
  gbpId?: string
  gmbId?: string  // This is the datasource ID for GMB
  today?: string // Optional locked today date (YYYY-MM-DD)
}

export function CombinedPage4Dashboard({ gbpId, gmbId, today }: CombinedPage4DashboardProps) {
  const [gbpData, setGBPData] = useState<GBPDashboardData | null>(null)
  const [gmbData, setGMBData] = useState<GMBGridDashboardData | null>(null)
  const [gmbMetricsData, setGMBMetricsData] = useState<GMBMetricsDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchAllData() {
      try {
        setLoading(true)
        setError(null)

        const promises = []
        const todayParam = today ? `?today=${today}` : ''
        
        // Fetch GBP data
        if (gbpId) {
          promises.push(
            fetch(`/api/gbp/dashboard/${gbpId}${todayParam}`)
              .then(res => {
                if (!res.ok) {
                  throw new Error(`HTTP ${res.status}: ${res.statusText}`)
                }
                return res.json()
              })
              .then(data => isMounted && setGBPData(data))
              .catch(err => {
                console.error('[GBP] Failed to fetch dashboard data:', err)
                throw err
              })
          )
        }
        
        // Fetch GMB grid data (heatmap) - optional, may return null
        if (gmbId) {
          promises.push(
            fetch(`/api/gmb/grid-dashboard/${gmbId}${todayParam}`)
              .then(res => {
                if (!res.ok) {
                  throw new Error(`HTTP ${res.status}: ${res.statusText}`)
                }
                return res.json()
              })
              .then(data => {
                if (isMounted && data) {
                  setGMBData(data)
                }
              })
              .catch(err => {
                console.error('[GMB Grid] Failed to fetch grid data:', err)
                // Grid data is optional - don't fail the entire page
              })
          )
          
          // Fetch GMB metrics data (KPI cards) - IN PARALLEL with grid
          promises.push(
            fetch(`/api/gmb/metrics/${gmbId}${todayParam}`)
              .then(res => {
                if (!res.ok) {
                  throw new Error(`HTTP ${res.status}: ${res.statusText}`)
                }
                return res.json()
              })
              .then(data => isMounted && setGMBMetricsData(data))
              .catch(err => {
                // Metrics are optional - log error but don't fail
                console.error('[GMB Metrics] Failed to fetch metrics:', err)
              })
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
  }, [gbpId, gmbId, today])

  // Determine metadata display according to requirements
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
