"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { ArrowLeft, Calendar } from "lucide-react"
import { TopKeywordsTable } from "@/components/mangools/top-keywords-table"
import { TopWinnersTable } from "@/components/mangools/top-winners-table"
import { NewRankingsTable } from "@/components/mangools/new-rankings-table"
import { ControlledLosersTable } from "@/components/mangools/controlled-losers-table"
import { KeywordPositionFlow } from "@/components/mangools/keyword-position-flow"
import { PerformanceVisibilityGraph } from "@/components/mangools/performance-visibility-graph"
import type { MangoolsDashboardData } from "@/lib/actions/mangools-dashboard"

export default function MangoolsDashboardPage({ params }: { params: Promise<{ datasourceId: string }> }) {
  const router = useRouter()
  const { datasourceId } = use(params)
  const [data, setData] = useState<MangoolsDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [datasourceId])

  async function fetchDashboardData() {
    try {
      setLoading(true)
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
    return <LoadingSpinner message="Loading SEO dashboard data..." />
  }

  if (error || !data) {
    return (
      <ErrorDisplay
        title="Dashboard Error"
        message={error || "Failed to load dashboard data. Please try again later."}
        secondaryAction={{
          label: "Go Back",
          onClick: () => router.back(),
          icon: <ArrowLeft className="mr-2 h-4 w-4" />
        }}
        action={{
          label: "Try Again",
          onClick: () => fetchDashboardData()
        }}
      />
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {data.domain}
          </h1>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Location:</span>
              <span>{data.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Comparing {data.dateRanges.monthAName} vs {data.dateRanges.monthBName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Total Keywords</div>
          <div className="text-2xl font-bold">{data.totalKeywords}</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Top Winners</div>
          <div className="text-2xl font-bold text-green-600">{data.topWinners.length}</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">New Rankings</div>
          <div className="text-2xl font-bold text-blue-600">{data.newRankings.length}</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Controlled Losers</div>
          <div className="text-2xl font-bold text-orange-600">{data.controlledLosers.length}</div>
        </div>
      </div>

      {/* Keyword Position Flow and Performance/Visibility */}
      <div className="grid gap-6 lg:grid-cols-2">
        <KeywordPositionFlow 
          keywords={data.topKeywords}
          monthAName={data.dateRanges.monthAName}
          monthBName={data.dateRanges.monthBName}
        />
        <PerformanceVisibilityGraph
          monthAData={data.monthAStats}
          monthBData={data.monthBStats}
          monthAName={data.dateRanges.monthAName}
          monthBName={data.dateRanges.monthBName}
        />
      </div>

      {/* Top Keywords Table */}
      <TopKeywordsTable 
        keywords={data.topKeywords} 
        monthAName={data.dateRanges.monthAName}
        monthBName={data.dateRanges.monthBName}
      />

      {/* Winners and Controlled Losers side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopWinnersTable winners={data.topWinners} />
        <ControlledLosersTable losers={data.controlledLosers} />
      </div>

      {/* New Rankings Table */}
      <NewRankingsTable newRankings={data.newRankings} />
    </div>
  )
}

