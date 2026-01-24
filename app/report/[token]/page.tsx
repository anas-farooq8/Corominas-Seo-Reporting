"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { CombinedPage1Dashboard } from "@/components/dashboard/combined-page1-dashboard"
import { CombinedPage3Dashboard } from "@/components/dashboard/combined-page3-dashboard"
import { CombinedPage4Dashboard } from "@/components/dashboard/combined-page4-dashboard"
import { MangoolsDashboardPage } from "@/components/dashboard/mangools-dashboard-page"
import type { getDataSourcesWithRespectiveData } from "@/lib/supabase/types"
import { FileText } from "lucide-react"

interface PageConfig {
  id: string
  label: string
  datasourceType: string
  datasourceId: string
}

export default function ShareableReportPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [datasources, setDatasources] = useState<getDataSourcesWithRespectiveData[]>([])
  const [pages, setPages] = useState<PageConfig[]>([])
  const [activePage, setActivePage] = useState<string>("")
  const [lockedToday, setLockedToday] = useState<string>("")
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    fetchReportData()
  }, [token])

  const handlePageChange = (pageId: string) => {
    setActivePage(pageId)
    setIsInitialLoad(false) // Mark that we've switched pages at least once
    const pageNumber = pageId.replace('page-', '')
    router.replace(`?page=${pageNumber}`, { scroll: false })
  }

  async function fetchReportData() {
    try {
      setLoading(true)
      
      // Get report link details and lock today date
      const linkResponse = await fetch(`/api/reports/link/${token}`)
      if (!linkResponse.ok) {
        throw new Error("Invalid or expired report link")
      }
      
      const linkData = await linkResponse.json()
      setReportData(linkData.link)
      setLockedToday(linkData.today)
      
      // Fetch project data
      const projectResponse = await fetch(`/api/projects/${linkData.link.project_id}`)
      if (!projectResponse.ok) {
        throw new Error("Failed to load report data")
      }
      
      const projectData = await projectResponse.json()
      setDatasources(projectData.datasources || [])
      
      // Build pages based on connected datasources
      const connectedPages: PageConfig[] = []
      const googleAnalyticsDatasource = projectData.datasources?.find((ds: any) => ds.type === "google_analytics")
      const semrushDatasource = projectData.datasources?.find((ds: any) => ds.type === "semrush")
      const mangoolsDatasource = projectData.datasources?.find((ds: any) => ds.type === "mangools")
      const gbpDatasource = projectData.datasources?.find((ds: any) => ds.type === "gbp")
      const gmbDatasource = projectData.datasources?.find((ds: any) => ds.type === "gmb")
      
      // Page 1: Google Analytics + SEMrush + GBP
      if (googleAnalyticsDatasource || semrushDatasource || gbpDatasource) {
        connectedPages.push({
          id: "page-1",
          label: "Page 1",
          datasourceType: "combined",
          datasourceId: googleAnalyticsDatasource?.id || semrushDatasource?.id || gbpDatasource?.id || ""
        })
      }
      
      // Page 2: Mangools
      if (mangoolsDatasource) {
        connectedPages.push({
          id: "page-2",
          label: "Page 2",
          datasourceType: "mangools",
          datasourceId: mangoolsDatasource.id
        })
      }
      
      // Page 3: Google Analytics Landing Pages + Search Console
      const searchConsoleDatasource = projectData.datasources?.find((ds: any) => ds.type === "google_search_console")
      if (googleAnalyticsDatasource || searchConsoleDatasource) {
        connectedPages.push({
          id: "page-3",
          label: "Page 3",
          datasourceType: "combined_page3",
          datasourceId: googleAnalyticsDatasource?.id || searchConsoleDatasource?.id || ""
        })
      }
      
      // Page 4: Google Business Profile + Grid My Business
      if (gbpDatasource || gmbDatasource) {
        connectedPages.push({
          id: "page-4",
          label: "Page 4",
          datasourceType: "combined_page4",
          datasourceId: gbpDatasource?.id || gmbDatasource?.id || ""
        })
      }
      
      setPages(connectedPages)
      if (connectedPages.length > 0) {
        const pageParam = searchParams.get('page')
        const pageId = pageParam ? `page-${pageParam}` : null
        const pageExists = pageId && connectedPages.some(p => p.id === pageId)
        const selectedPage = pageExists ? pageId : connectedPages[0].id
        setActivePage(selectedPage)
        setIsInitialLoad(true) // This is the initial load
        
        if (!pageParam) {
          const pageNumber = selectedPage.replace('page-', '')
          router.replace(`?page=${pageNumber}`, { scroll: false })
        }
      }
    } catch (err) {
      console.error("Error fetching report data:", err)
      setError(err instanceof Error ? err.message : "Failed to load report")
    } finally {
      setLoading(false)
    }
  }

  if (error || (!loading && pages.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <ErrorDisplay
          title="Report Unavailable"
          message={error || "No data sources available for this report"}
        />
      </div>
    )
  }

  const activePageConfig = pages.find(p => p.id === activePage)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 md:p-6">
          <img 
            src="https://www.google.com/s2/favicons?domain=corominas-consulting.de&sz=64" 
            alt="SEO Reporting Logo" 
            className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate">
              {loading ? "Loading Report..." : `${reportData?.client?.name} - ${reportData?.project?.name}`}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              {loading ? "Please wait" : `Report Generated: ${reportData?.report ? new Date(reportData.report.generation_date).toLocaleDateString() : ''}`}
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
                  onClick={() => handlePageChange(page.id)}
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
            <LoadingSpinner message="Loading Report Dashboard..." />
          </div>
        ) : (
          <>
            {/* Page 1: Combined Dashboard - Keep mounted, hide with CSS */}
            {pages.some(p => p.datasourceType === "combined") && (() => {
              const googleAnalyticsDs = datasources.find((ds: any) => ds.type === "google_analytics")
              const semrushDs = datasources.find((ds: any) => ds.type === "semrush")
              const gbpDs = datasources.find((ds: any) => ds.type === "gbp")
              const isActive = activePageConfig?.datasourceType === "combined"
              
              return (
                <div className={isActive ? "block" : "hidden"}>
                  <CombinedPage1Dashboard 
                    googleAnalyticsId={googleAnalyticsDs?.id}
                    semrushId={semrushDs?.id}
                    gbpId={gbpDs?.id}
                    today={lockedToday}
                    clearOnMount={isInitialLoad && isActive}
                  />
                </div>
              )
            })()}

            {/* Page 2: Mangools - Keep mounted, hide with CSS */}
            {pages.some(p => p.datasourceType === "mangools") && (() => {
              const mangoolsPage = pages.find(p => p.datasourceType === "mangools")
              const isActive = activePageConfig?.datasourceType === "mangools"
              
              return (
                <div className={isActive ? "block" : "hidden"}>
                  <MangoolsDashboardPage 
                    datasourceId={mangoolsPage!.datasourceId}
                    today={lockedToday}
                    clearOnMount={isInitialLoad && isActive}
                  />
                </div>
              )
            })()}

            {/* Page 3: Landing Pages + Search Console - Keep mounted, hide with CSS */}
            {pages.some(p => p.datasourceType === "combined_page3") && (() => {
              const googleAnalyticsDs = datasources.find((ds: any) => ds.type === "google_analytics")
              const searchConsoleDs = datasources.find((ds: any) => ds.type === "google_search_console")
              const isActive = activePageConfig?.datasourceType === "combined_page3"
              
              return (
                <div className={isActive ? "block" : "hidden"}>
                  <CombinedPage3Dashboard 
                    googleAnalyticsId={googleAnalyticsDs?.id}
                    searchConsoleId={searchConsoleDs?.id}
                    today={lockedToday}
                    clearOnMount={isInitialLoad && isActive}
                  />
                </div>
              )
            })()}

            {/* Page 4: GBP + GMB - Keep mounted, hide with CSS */}
            {pages.some(p => p.datasourceType === "combined_page4") && (() => {
              const gbpDs = datasources.find((ds: any) => ds.type === "gbp")
              const gmbDs = datasources.find((ds: any) => ds.type === "gmb")
              const isActive = activePageConfig?.datasourceType === "combined_page4"
              
              return (
                <div className={isActive ? "block" : "hidden"}>
                  <CombinedPage4Dashboard 
                    gbpId={gbpDs?.id}
                    gmbId={gmbDs?.id}
                    today={lockedToday}
                    clearOnMount={isInitialLoad && isActive}
                  />
                </div>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}
