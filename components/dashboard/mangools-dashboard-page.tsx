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

  const topWinnersCount = data.kpiCards.topWinnersCount
  const newRankingsCount = data.kpiCards.newRankingsCount
  const totalKeywordsCount = data.kpiCards.totalKeywords

  // Build array of KPI cards with their values (only include non-zero values)
  const kpiCards = []
  if (totalKeywordsCount > 0) {
    kpiCards.push({
      label: "Total Keywords in Tracking",
      value: totalKeywordsCount,
      color: "default"
    })
  }
  if (topWinnersCount > 0) {
    kpiCards.push({
      label: "Top Winners",
      value: topWinnersCount,
      color: "green"
    })
  }
  if (newRankingsCount > 0) {
    kpiCards.push({
      label: "New Rankings",
      value: newRankingsCount,
      color: "blue"
    })
  }

  // Determine grid classes based on number of visible cards
  const getDesktopGridClasses = () => {
    if (kpiCards.length === 1) return "grid-cols-1"
    if (kpiCards.length === 2) return "grid-cols-2"
    return "grid-cols-3"
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

      {/* Summary Stats - Only render if there are cards to show */}
      {kpiCards.length > 0 && (
        <div className="space-y-3">
          {/* Desktop view - Single row grid */}
          <div className={`hidden sm:grid gap-3 sm:gap-4 ${getDesktopGridClasses()}`}>
            {kpiCards.map((card, index) => (
              <div key={index} className="p-3 sm:p-4 border rounded-lg bg-card">
                <div className="text-xs sm:text-sm text-muted-foreground">{card.label}</div>
                <div className={`text-xl sm:text-2xl font-bold mt-1 ${
                  card.color === "green" ? "text-green-600" : 
                  card.color === "blue" ? "text-blue-600" : 
                  ""
                }`}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile view */}
          <div className="grid gap-3 sm:hidden">
            {kpiCards.length === 2 ? (
              // If only 2 cards, show them side by side
              <div className="grid gap-3 grid-cols-2">
                {kpiCards.map((card, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-card">
                    <div className="text-xs text-muted-foreground">{card.label}</div>
                    <div className={`text-xl font-bold mt-1 ${
                      card.color === "green" ? "text-green-600" : 
                      card.color === "blue" ? "text-blue-600" : 
                      ""
                    }`}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : kpiCards.length === 3 ? (
              // If 3 cards, first card full width, other 2 in second row side by side
              <>
                <div className="p-3 border rounded-lg bg-card">
                  <div className="text-xs text-muted-foreground">{kpiCards[0].label}</div>
                  <div className={`text-xl font-bold mt-1 ${
                    kpiCards[0].color === "green" ? "text-green-600" : 
                    kpiCards[0].color === "blue" ? "text-blue-600" : 
                    ""
                  }`}>
                    {kpiCards[0].value}
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  {kpiCards.slice(1).map((card, index) => (
                    <div key={index + 1} className="p-3 border rounded-lg bg-card">
                      <div className="text-xs text-muted-foreground">{card.label}</div>
                      <div className={`text-xl font-bold mt-1 ${
                        card.color === "green" ? "text-green-600" : 
                        card.color === "blue" ? "text-blue-600" : 
                        ""
                      }`}>
                        {card.value}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // If only 1 card, show it full width
              kpiCards.map((card, index) => (
                <div key={index} className="p-3 border rounded-lg bg-card">
                  <div className="text-xs text-muted-foreground">{card.label}</div>
                  <div className={`text-xl font-bold mt-1 ${
                    card.color === "green" ? "text-green-600" : 
                    card.color === "blue" ? "text-blue-600" : 
                    ""
                  }`}>
                    {card.value}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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

