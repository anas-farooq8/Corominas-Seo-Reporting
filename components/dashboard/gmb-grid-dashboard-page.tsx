"use client"

import { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { TrendingUp, Star, MessageSquare, Users } from "lucide-react"
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
        console.log('[GMB Grid Dashboard] Fetching data for datasource:', datasourceId)
        
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
  }, [datasourceId, externalData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading Grid My Business heatmaps..." />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "Failed to load GMB grid data. Please try again later."}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${!noPadding && showMetadata ? 'p-3 sm:p-4 md:p-6 lg:p-8' : ''}`}>
      {showMetadata && (
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            {data.businessName || 'Grid My Business'}
          </h2>
          {data.address && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {data.address}
            </p>
          )}
        </div>
      )}

      {/* GMB KPI Cards */}
      {showKPIs && metricsData && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <GMBKPICard
            title="GMB SCORE"
            icon={<TrendingUp className="h-4 w-4" />}
            currentValue={metricsData.kpiCards.gmbScore.current}
            change={metricsData.kpiCards.gmbScore.change}
            isIncrease={metricsData.kpiCards.gmbScore.isIncrease}
            colorScheme="purple"
            formatValue={(val) => typeof val === 'number' ? `${val.toFixed(1)}%` : String(val)}
            subtitle={metricsData.kpiCards.gmbScore.change === 0 ? "No changes" : undefined}
          />

          <GMBKPICard
            title="ENGAGEMENTS"
            icon={<Users className="h-4 w-4" />}
            currentValue={metricsData.kpiCards.engagements.current}
            change={metricsData.kpiCards.engagements.change}
            isIncrease={metricsData.kpiCards.engagements.isIncrease}
            colorScheme="green"
            formatValue={(val) => typeof val === 'number' ? Math.round(val).toString() : String(val)}
            subtitle={
              metricsData.kpiCards.engagements.change === 0 
                ? "No changes"
                : metricsData.kpiCards.engagements.isIncrease
                  ? `+${Math.abs(metricsData.kpiCards.engagements.current - metricsData.kpiCards.engagements.previous).toFixed(0)} from last period`
                  : `${Math.abs(metricsData.kpiCards.engagements.current - metricsData.kpiCards.engagements.previous).toFixed(0)} from last period`
            }
          />

          <GMBKPICard
            title="RATING"
            icon={<Star className="h-4 w-4" />}
            currentValue={metricsData.kpiCards.rating.current}
            change={metricsData.kpiCards.rating.change}
            isIncrease={metricsData.kpiCards.rating.isIncrease}
            colorScheme="orange"
            formatValue={(val) => typeof val === 'number' ? val.toFixed(1) : String(val)}
            subtitle={metricsData.kpiCards.rating.change === 0 ? "No changes" : undefined}
          />

          <GMBKPICard
            title="REVIEWS"
            icon={<MessageSquare className="h-4 w-4" />}
            currentValue={metricsData.kpiCards.reviews.current}
            change={metricsData.kpiCards.reviews.change}
            isIncrease={metricsData.kpiCards.reviews.isIncrease}
            colorScheme="blue"
            formatValue={(val) => typeof val === 'number' ? Math.round(val).toString() : String(val)}
            subtitle={metricsData.kpiCards.reviews.change === 0 ? "No changes" : undefined}
          />
        </div>
      )}

      {/* No Data Message */}
      {!data.heatmapData || data.heatmapData.length === 0 ? (
        <div className="text-center py-28 bg-muted/30 rounded-lg">
          <p className="text-lg text-muted-foreground">
            No grid data available for monitored keywords
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Grid data will appear once scans are available
          </p>
        </div>
      ) : (
        <GMBGridHeatmap data={data} />
      )}
    </div>
  )
}
