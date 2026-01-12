"use client"

import { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { GMBGridMatrixSimple } from "./gmb-grid-matrix-simple"
import type { GMBGridDashboardData } from "@/lib/actions/gmb-dashboard"

interface GMBGridDashboardPageProps {
  datasourceId?: string
  data?: GMBGridDashboardData | null
  showMetadata?: boolean
}

export function GMBGridDashboardPage({ 
  datasourceId, 
  data: externalData, 
  showMetadata = true
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
        
        console.log('[GMB Grid Dashboard] Data received:', {
          keywords: dashboardData.keywords?.length,
          businessName: dashboardData.businessName
        })
        
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
        <LoadingSpinner message="Loading Grid My Business heatmaps... This may take a minute." />
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

  const bestKeyword = data.bestKeyword
  const totalKeywords = data.keywords.length

  return (
    <div className={`space-y-4 sm:space-y-6 ${showMetadata ? 'p-3 sm:p-4 md:p-6 lg:p-8' : ''}`}>
      {showMetadata && (
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            {data.businessName}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Grid My Business - Grid Analysis
          </p>
          {data.address && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.address}
            </p>
          )}
          {bestKeyword && totalKeywords > 1 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
              🏆 Showing best performing keyword out of {totalKeywords} total
            </p>
          )}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-foreground">
            {totalKeywords}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
            Total Keywords
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            {data.keywords.reduce((sum, kw) => sum + kw.lastMonthCount, 0)}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
            {data.monthLabels.last} Scans
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-gray-600 dark:text-gray-400">
            {data.keywords.reduce((sum, kw) => sum + kw.previousMonthCount, 0)}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
            {data.monthLabels.previous} Scans
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
            {bestKeyword?.gridStats.improved ?? 0}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
            Best Keyword Improved
          </div>
        </div>
      </div>

      {/* No Data Message */}
      {!bestKeyword && (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-lg text-muted-foreground">
            No grid data available for monitored keywords
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Grid data will appear once scans are available for {data.monthLabels.last} or {data.monthLabels.previous}
          </p>
        </div>
      )}

      {/* Best Keyword Grid Matrix (Simple Visualization) */}
      {data.bestKeyword && (
        <GMBGridMatrixSimple
          keyword={data.bestKeyword.keyword}
          previousMonthGrid={data.bestKeyword.previousMonthGrid}
          currentMonthGrid={data.bestKeyword.lastMonthGrid}
          gridComparison={data.bestKeyword.gridComparison}
          gridStats={data.bestKeyword.gridStats}
          previousMonthLabel={data.monthLabels.previous}
          currentMonthLabel={data.monthLabels.last}
        />
      )}
    </div>
  )
}
