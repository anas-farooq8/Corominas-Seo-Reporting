"use client"

import { useState, useEffect, useMemo } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { Phone, Navigation, MousePointerClick } from "lucide-react"
import type { GBPDashboardData } from "@/lib/actions/gbp-dashboard"
import { KPICard } from "./kpi-card"

interface GBPDashboardPageProps {
  datasourceId?: string
  data?: GBPDashboardData | null
  showMetadata?: boolean
  showKPIs?: boolean
  noPadding?: boolean
}

export function GBPDashboardPage({ 
  datasourceId, 
  data: externalData, 
  showMetadata = true,
  showKPIs = true,
  noPadding = false
}: GBPDashboardPageProps) {
  const [data, setData] = useState<GBPDashboardData | null>(externalData || null)
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
        const response = await fetch(`/api/gbp/dashboard/${datasourceId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data")
        }
        const dashboardData = await response.json()
        if (isMounted) {
          setData(dashboardData)
        }
      } catch (err) {
        console.error("Error fetching GBP dashboard:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard")
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


  // Memoize KPI calculations - using kpiCards from backend
  const callsKPI = useMemo(() => {
    if (!data || !data.kpiCards) return null
    
    const kpi = data.kpiCards.calls
    
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

  const directionsKPI = useMemo(() => {
    if (!data || !data.kpiCards) return null
    
    const kpi = data.kpiCards.directions
    
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
  
  const websiteClicksKPI = useMemo(() => {
    if (!data || !data.kpiCards) return null
    
    const kpi = data.kpiCards.websiteClicks
    
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
        <LoadingSpinner message="Loading SEO dashboard data..." />
      </div>
    )
  }

  if (error || !data || !callsKPI || !directionsKPI || !websiteClicksKPI) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "Failed to load dashboard data. Please try again later."}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${!noPadding && (showMetadata || showKPIs) ? 'p-3 sm:p-4 md:p-6 lg:p-8' : ''}`}>
      {showMetadata && (
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            {data.businessName}
          </h2>
          {data.address && (
            <p className="text-sm text-muted-foreground mt-1">
              {data.address}
            </p>
          )}
        </div>
      )}

      {/* KPI Cards */}
      {showKPIs && (
        <div className="grid gap-2 sm:gap-3 grid-cols-3">
          <KPICard
            title="Calls"
            icon={<Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={callsKPI.currentValue}
            previousValue={callsKPI.previousValue}
            currentLabel={callsKPI.currentLabel}
            previousLabel={callsKPI.previousLabel}
            colorScheme="purple"
            percentageChange={callsKPI.change}
            comparisonLabel={callsKPI.comparisonLabel}
          />

          <KPICard
            title="Directions"
            icon={<Navigation className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={directionsKPI.currentValue}
            previousValue={directionsKPI.previousValue}
            currentLabel={directionsKPI.currentLabel}
            previousLabel={directionsKPI.previousLabel}
            colorScheme="green"
            percentageChange={directionsKPI.change}
            comparisonLabel={directionsKPI.comparisonLabel}
          />

          <KPICard
            title="Website Clicks"
            icon={<MousePointerClick className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />}
            currentValue={websiteClicksKPI.currentValue}
            previousValue={websiteClicksKPI.previousValue}
            currentLabel={websiteClicksKPI.currentLabel}
            previousLabel={websiteClicksKPI.previousLabel}
            colorScheme="blue"
            percentageChange={websiteClicksKPI.change}
            comparisonLabel={websiteClicksKPI.comparisonLabel}
          />
        </div>
      )}
    </div>
  )
}
