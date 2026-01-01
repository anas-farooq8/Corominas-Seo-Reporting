"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { Key } from "lucide-react"
import type { SEMrushDashboardData } from "@/lib/actions/semrush-dashboard"
import { KPICard } from "./kpi-card"
import { SEMrushChart } from "./semrush-chart"
import type { LayerKey } from "./chart-layer-filters"

interface SEMrushDashboardPageProps {
  datasourceId?: string
  data?: SEMrushDashboardData | null
  showMetadata?: boolean
}

export function SEMrushDashboardPage({ datasourceId, data: externalData, showMetadata = true }: SEMrushDashboardPageProps) {
  const [data, setData] = useState<SEMrushDashboardData | null>(externalData || null)
  const [loading, setLoading] = useState(!externalData)
  const [error, setError] = useState<string | null>(null)
  
  // Chart filters - all enabled by default
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
    if (externalData) {
      setData(externalData)
      setLoading(false)
      return
    }
    
    let isMounted = true
    
    async function fetchData() {
      if (!datasourceId) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/semrush/dashboard/${datasourceId}`)
        if (!response.ok) throw new Error('Failed to fetch SEMrush data')
        const result = await response.json()
        if (isMounted) {
          setData(result)
        }
      } catch (err) {
        console.error('Error fetching SEMrush dashboard data:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()
    
    return () => {
      isMounted = false
    }
  }, [datasourceId, externalData])

  // Memoize calculations to prevent unnecessary re-renders - using kpiCards from backend
  const keywordsKPI = useMemo(() => {
    if (!data || !data.kpiCards) return null
    
    const kpi = data.kpiCards.totalRankingKeywords
    
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
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading SEMrush data..." />
      </div>
    )
  }

  if (error || !data || !keywordsKPI) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="SEMrush Dashboard Error"
          message={error || "Failed to load SEMrush data. Please try again later."}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
      {showMetadata && (
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            {data.domain}
          </h2>
        </div>
      )}

      {/* KPI Card - Total Organic Keywords */}
      <div className="grid gap-2 sm:gap-3 grid-cols-1">
        <KPICard
          title="Total Ranking Organic Keywords"
          icon={<Key className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
          currentValue={keywordsKPI.currentValue}
          previousValue={keywordsKPI.previousValue}
          currentLabel={keywordsKPI.currentLabel}
          previousLabel={keywordsKPI.previousLabel}
          colorScheme="purple"
          percentageChange={keywordsKPI.change}
          comparisonLabel={keywordsKPI.comparisonLabel}
        />
      </div>

      {/* SEMrush Chart */}
      <SEMrushChart
        dailyData={data.dailyData}
        visibleLayers={visibleLayers}
        onToggleLayer={toggleLayer}
      />
    </div>
  )
}
