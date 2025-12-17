"use client"

import { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { Calendar } from "lucide-react"
import { TopKeywordsTable } from "@/components/mangools/top-keywords-table"
import { TopWinnersTable } from "@/components/mangools/top-winners-table"
import { NewRankingsTable } from "@/components/mangools/new-rankings-table"
import { ControlledLosersTable } from "@/components/mangools/controlled-losers-table"
import type { MangoolsDashboardData } from "@/lib/actions/mangools-dashboard"

interface MangoolsDashboardPageProps {
  datasourceId: string
}

export function MangoolsDashboardPage({ datasourceId }: MangoolsDashboardPageProps) {
  const [data, setData] = useState<MangoolsDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only load data when this component is mounted (lazy loading)
    fetchDashboardData()
  }, [datasourceId])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/mangools/dashboard/${datasourceId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      console.error("Error fetching dashboard:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading SEO dashboard data..." />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "Failed to load dashboard data. Please try again later."}
          action={{
            label: "Try Again",
            onClick: () => fetchDashboardData()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Domain Info */}
      <div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
          {data.domain}
        </h2>
        <div className="flex flex-col gap-1 mt-1.5 sm:mt-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium">Location:</span>
            <span className="truncate">{data.location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm">
              Comparing {data.dateRanges.monthAName} vs {data.dateRanges.monthBName}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-3 sm:p-4 border rounded-lg bg-card">
          <div className="text-xs sm:text-sm text-muted-foreground">Total Keywords in Tracking</div>
          <div className="text-xl sm:text-2xl font-bold mt-1">{data.totalKeywords}</div>
        </div>
        <div className="p-3 sm:p-4 border rounded-lg bg-card">
          <div className="text-xs sm:text-sm text-muted-foreground">Top Winners</div>
          <div className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{data.topWinners.length}</div>
        </div>
        <div className="p-3 sm:p-4 border rounded-lg bg-card">
          <div className="text-xs sm:text-sm text-muted-foreground">New Rankings</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{data.newRankings.length}</div>
        </div>
      </div>

      {/* Top Keywords and Top Winners side by side */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <TopKeywordsTable 
          keywords={data.topKeywords} 
          monthAName={data.dateRanges.monthAName}
          monthBName={data.dateRanges.monthBName}
        />
        <TopWinnersTable winners={data.topWinners} />
      </div>

      {/* New Rankings and Controlled Losers side by side */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <NewRankingsTable newRankings={data.newRankings} />
        <ControlledLosersTable losers={data.controlledLosers} />
      </div>
    </div>
  )
}

