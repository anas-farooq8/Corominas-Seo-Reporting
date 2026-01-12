"use client"

import { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GMBDashboardData } from "@/lib/actions/gmb-dashboard"

interface GMBKeywordsDashboardPageProps {
  datasourceId?: string
  data?: GMBDashboardData | null
  showMetadata?: boolean
}

export function GMBKeywordsDashboardPage({ 
  datasourceId, 
  data: externalData, 
  showMetadata = true
}: GMBKeywordsDashboardPageProps) {
  const [data, setData] = useState<GMBDashboardData | null>(externalData || null)
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
        const response = await fetch(`/api/gmb/keywords/${datasourceId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch GMB keywords data")
        }
        const dashboardData = await response.json()
        if (isMounted) {
          setData(dashboardData)
        }
      } catch (err) {
        console.error("Error fetching GMB keywords:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load GMB keywords")
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
        <LoadingSpinner message="Loading GMB keywords data..." />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "Failed to load GMB keywords data. Please try again later."}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${showMetadata ? 'p-3 sm:p-4 md:p-6 lg:p-8' : ''}`}>
      {showMetadata && (
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            {data.businessName}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Grid My Business - Keyword Rankings
          </p>
          {data.address && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.address}
            </p>
          )}
        </div>
      )}

      {/* Month Labels */}
      <div className="flex gap-2 sm:gap-3 items-center text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-muted-foreground">{data.monthLabels.last}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          <span className="text-muted-foreground">{data.monthLabels.previous}</span>
        </div>
      </div>

      {/* Keywords Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Monitored Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          {data.keywords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No monitored keywords found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">
                      Keyword
                    </th>
                    <th className="text-center py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">
                      {data.monthLabels.last}
                      <br />
                      <span className="text-xs font-normal">(Scans)</span>
                    </th>
                    <th className="text-center py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground">
                      {data.monthLabels.previous}
                      <br />
                      <span className="text-xs font-normal">(Scans)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.keywords.map((kw, index) => (
                    <tr 
                      key={kw.keywordId} 
                      className={`border-b last:border-b-0 ${index % 2 === 0 ? 'bg-muted/30' : ''}`}
                    >
                      <td className="py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium">
                        {kw.keyword}
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs sm:text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {kw.lastMonthCount}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs sm:text-sm font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                          {kw.previousMonthCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {data.keywords.length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                Total Keywords
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                {data.keywords.reduce((sum, kw) => sum + kw.lastMonthCount, 0)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                {data.monthLabels.last} Scans
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-600 dark:text-gray-400">
                {data.keywords.reduce((sum, kw) => sum + kw.previousMonthCount, 0)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                {data.monthLabels.previous} Scans
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
