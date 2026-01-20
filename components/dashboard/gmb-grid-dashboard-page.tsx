"use client"

import { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { GMBGridHeatmap } from "./gmb-grid-heatmap"
import type { GMBGridDashboardData } from "@/lib/actions/gmb-dashboard"

interface GMBGridDashboardPageProps {
  datasourceId?: string
  data?: GMBGridDashboardData | null
  showMetadata?: boolean
  showKPIs?: boolean
  noPadding?: boolean
}

export function GMBGridDashboardPage({ 
  datasourceId, 
  data: externalData, 
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
