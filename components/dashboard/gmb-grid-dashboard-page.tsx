"use client"

import { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { TrendingUp, Star, MessageSquare } from "lucide-react"
import { GMBGridHeatmap } from "./gmb-grid-heatmap"
import { GMBKPICard } from "./gmb-kpi-card"
import type { GMBGridDashboardData } from "@/lib/actions/gmb-dashboard"
import type { GMBMetricsDashboardData } from "@/lib/actions/gmb-metrics"

interface GMBGridDashboardPageProps {
  datasourceId?: string
  data?: GMBGridDashboardData | null
  metricsData?: GMBMetricsDashboardData | null  // Accept metrics as prop
  showMetadata?: boolean
  showKPIs?: boolean
  noPadding?: boolean
}

export function GMBGridDashboardPage({ 
  datasourceId, 
  data: externalData,
  metricsData,  // Metrics passed as prop from parent
  showMetadata = true,
  showKPIs = true,
  noPadding = false
}: GMBGridDashboardPageProps) {
  const [data, setData] = useState<GMBGridDashboardData | null>(externalData || null)
  // If we have externalData or metricsData passed as props, we're not loading
  // Only show loading if we need to fetch data ourselves (datasourceId provided but no data)
  const [loading, setLoading] = useState(!externalData && !metricsData && !!datasourceId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If data is passed externally, use it and don't fetch
    if (externalData !== undefined || metricsData !== undefined) {
      setData(externalData || null)
      setLoading(false)
      return
    }
    
    // If no datasourceId provided, can't fetch - just show what we have
    if (!datasourceId) {
      setLoading(false)
      return
    }
    
    let isMounted = true
    
    async function fetchDashboardData() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/gmb/grid-dashboard/${datasourceId}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || "Failed to fetch GMB grid data")
        }
        const dashboardData = await response.json()
        
        if (isMounted) {
          setData(dashboardData)
        }
      } catch (err) {
        console.error("Error fetching GMB grid data:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load GMB grid data")
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
  }, [datasourceId, externalData, metricsData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading SEO dashboard data..." />
      </div>
    )
  }

  // If we have metrics data but no grid data, that's fine - show metrics only
  // Only show error if we have neither data nor metricsData
  if (error || (!data && !metricsData)) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "Failed to load GMB data. Please try again later."}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${!noPadding && showMetadata ? 'p-3 sm:p-4 md:p-6 lg:p-8' : ''}`}>
      {showMetadata && (
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            {data?.businessName || metricsData?.businessName || 'Grid My Business'}
          </h2>
          {(data?.address || metricsData?.address) && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {data?.address || metricsData?.address}
            </p>
          )}
        </div>
      )}

      {/* GMB KPI Cards */}
      {showKPIs && metricsData && (
        <div className="grid gap-2 sm:gap-3 grid-cols-3">
          <GMBKPICard
            title="GMB SCORE"
            icon={<TrendingUp className="h-4 w-4" />}
            currentValue={metricsData.kpiCards.gmbScore.current}
            change={metricsData.kpiCards.gmbScore.change}
            isIncrease={metricsData.kpiCards.gmbScore.isIncrease}
            colorScheme="purple"
            formatValue={(val) => typeof val === 'number' ? `${val.toFixed(1)}%` : String(val)}
            subtitle={
              metricsData.kpiCards.gmbScore.change === 0 
                ? "No changes"
                : metricsData.kpiCards.gmbScore.isIncrease
                  ? `+${Math.abs(metricsData.kpiCards.gmbScore.current - metricsData.kpiCards.gmbScore.previous).toFixed(1)} from last month`
                  : `-${Math.abs(metricsData.kpiCards.gmbScore.current - metricsData.kpiCards.gmbScore.previous).toFixed(1)} from last month`
            }
            dateRange={metricsData.kpiCards.gmbScore.dateRange}
          />

          <GMBKPICard
            title="RATING"
            icon={<Star className="h-4 w-4" />}
            currentValue={metricsData.kpiCards.rating.current}
            change={metricsData.kpiCards.rating.change}
            isIncrease={metricsData.kpiCards.rating.isIncrease}
            colorScheme="orange"
            formatValue={(val) => typeof val === 'number' ? val.toFixed(1) : String(val)}
            subtitle={
              metricsData.kpiCards.rating.change === 0 
                ? "No changes"
                : metricsData.kpiCards.rating.isIncrease
                  ? `+${Math.abs(metricsData.kpiCards.rating.current - metricsData.kpiCards.rating.previous).toFixed(1)} from last month`
                  : `-${Math.abs(metricsData.kpiCards.rating.current - metricsData.kpiCards.rating.previous).toFixed(1)} from last month`
            }
            dateRange={metricsData.kpiCards.rating.dateRange}
          />

          <GMBKPICard
            title="REVIEWS"
            icon={<MessageSquare className="h-4 w-4" />}
            currentValue={metricsData.kpiCards.reviews.current}
            change={metricsData.kpiCards.reviews.change}
            isIncrease={metricsData.kpiCards.reviews.isIncrease}
            colorScheme="blue"
            formatValue={(val) => typeof val === 'number' ? Math.round(val).toString() : String(val)}
            subtitle={
              metricsData.kpiCards.reviews.change === 0 
                ? "No changes"
                : metricsData.kpiCards.reviews.isIncrease
                  ? `+${Math.abs(metricsData.kpiCards.reviews.current - metricsData.kpiCards.reviews.previous).toFixed(0)} from last month`
                  : `-${Math.abs(metricsData.kpiCards.reviews.current - metricsData.kpiCards.reviews.previous).toFixed(0)} from last month`
            }
            dateRange={metricsData.kpiCards.reviews.dateRange}
          />
        </div>
      )}

      {/* Grid Heatmap Section - Only show if data exists */}
      {data && data.heatmapData && data.heatmapData.length > 0 && (
        <GMBGridHeatmap data={data} />
      )}
    </div>
  )
}
