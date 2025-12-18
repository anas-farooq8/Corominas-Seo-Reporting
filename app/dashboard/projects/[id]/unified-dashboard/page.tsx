"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { ArrowLeft } from "lucide-react"
import type { getDataSourcesWithRespectiveData } from "@/lib/supabase/types"
import { GoogleAnalyticsDashboardPage } from "@/components/dashboard/google-analytics-dashboard-page"
import { MangoolsDashboardPage } from "@/components/dashboard/mangools-dashboard-page"

interface PageConfig {
  id: string
  label: string
  datasourceType: string
  datasourceId: string
}

export default function UnifiedDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: projectId } = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [datasources, setDatasources] = useState<getDataSourcesWithRespectiveData[]>([])
  const [pages, setPages] = useState<PageConfig[]>([])
  const [activePage, setActivePage] = useState<string>("")
  const [projectName, setProjectName] = useState<string>("")

  useEffect(() => {
    fetchDashboardData()
  }, [projectId])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) throw new Error("Failed to fetch project data")
      const data = await response.json()
      
      setProjectName(data.name)
      setDatasources(data.datasources || [])
      
      // Build pages based on connected datasources
      const connectedPages: PageConfig[] = []
      const googleAnalyticsDatasource = data.datasources?.find((ds: any) => ds.type === "google_analytics")
      const mangoolsDatasource = data.datasources?.find((ds: any) => ds.type === "mangools")
      
      if (googleAnalyticsDatasource) {
        connectedPages.push({
          id: "page-1",
          label: "Google Analytics",
          datasourceType: "google_analytics",
          datasourceId: googleAnalyticsDatasource.id
        })
      }
      
      if (mangoolsDatasource) {
        connectedPages.push({
          id: googleAnalyticsDatasource ? "page-2" : "page-1",
          label: "Mangools SEO",
          datasourceType: "mangools",
          datasourceId: mangoolsDatasource.id
        })
      }
      
      setPages(connectedPages)
      if (connectedPages.length > 0) {
        setActivePage(connectedPages[0].id)
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (error || (!loading && pages.length === 0)) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "No data sources connected. Please add a data source to view the dashboard."}
          secondaryAction={{
            label: "Go Back",
            onClick: () => router.back(),
            icon: <ArrowLeft className="mr-2 h-4 w-4" />
          }}
        />
      </div>
    )
  }

  const activePageConfig = pages.find(p => p.id === activePage)

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 md:p-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 touch-manipulation">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate">
              {loading ? "Loading..." : `${projectName} Dashboard`}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              {loading ? "Please wait" : "Unified analytics dashboard"}
            </p>
          </div>
        </div>
        
        {/* Page Navigation Tabs */}
        {!loading && pages.length > 0 && (
        <div className="px-3 sm:px-4 md:px-6">
          <div className="flex gap-1 sm:gap-2 border-b overflow-x-auto scrollbar-hide">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap touch-manipulation ${
                  activePage === page.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px] sm:min-h-[600px]">
            <LoadingSpinner message="Loading Dashboard..." />
          </div>
        ) : (
          <>
            {activePageConfig?.datasourceType === "google_analytics" && (
              <GoogleAnalyticsDashboardPage datasourceId={activePageConfig.datasourceId} />
            )}
            {activePageConfig?.datasourceType === "mangools" && (
              <MangoolsDashboardPage datasourceId={activePageConfig.datasourceId} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

