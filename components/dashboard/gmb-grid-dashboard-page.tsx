"use client"

import { useState, useEffect, useMemo } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { GMBGridHeatmap } from "./gmb-grid-heatmap"
import { KPICard } from "./kpi-card"
import { Target, MapPin } from "lucide-react"
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
  
  // Memoize KPI calculations
  const localPackKPI = useMemo(() => {
    if (!data || !data.kpiCards) return null
    
    const kpi = data.kpiCards.localPackCoverage
    
    return {
      change: {
        change: kpi.change,
        isIncrease: kpi.isIncrease
      },
      currentValue: kpi.current,
      previousValue: kpi.previous,
      currentLabel: data.monthLabels.last,
      previousLabel: data.monthLabels.previous,
      comparisonLabel: kpi.periodLabel,
      formatValue: (value: number) => `${value.toFixed(1)}%`
    }
  }, [data])

  const avgPositionKPI = useMemo(() => {
    if (!data || !data.kpiCards) return null
    
    const kpi = data.kpiCards.averagePosition
    
    return {
      change: {
        change: kpi.change,
        isIncrease: !kpi.isIncrease // Invert: improvement (lower position) shows as green
      },
      currentValue: kpi.current,
      previousValue: kpi.previous,
      currentLabel: data.monthLabels.last,
      previousLabel: data.monthLabels.previous,
      comparisonLabel: kpi.periodLabel,
      formatValue: (value: number) => value.toFixed(2)
    }
  }, [data])

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
    <div className={`space-y-4 sm:space-y-6 ${!noPadding && (showMetadata || showKPIs) ? 'p-3 sm:p-4 md:p-6 lg:p-8' : ''}`}>
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

      {/* KPI Cards */}
      {showKPIs && localPackKPI && avgPositionKPI && (
        <div className="grid gap-2 sm:gap-3 grid-cols-2">
          <KPICard
            title="Local Pack Coverage"
            icon={<MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={localPackKPI.currentValue}
            previousValue={localPackKPI.previousValue}
            currentLabel={localPackKPI.currentLabel}
            previousLabel={localPackKPI.previousLabel}
            colorScheme="green"
            percentageChange={localPackKPI.change}
            comparisonLabel={localPackKPI.comparisonLabel}
            formatValue={localPackKPI.formatValue}
          />

          <KPICard
            title="Avg Grid Position"
            icon={<Target className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={avgPositionKPI.currentValue}
            previousValue={avgPositionKPI.previousValue}
            currentLabel={avgPositionKPI.currentLabel}
            previousLabel={avgPositionKPI.previousLabel}
            colorScheme="blue"
            percentageChange={avgPositionKPI.change}
            comparisonLabel={avgPositionKPI.comparisonLabel}
            formatValue={avgPositionKPI.formatValue}
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
