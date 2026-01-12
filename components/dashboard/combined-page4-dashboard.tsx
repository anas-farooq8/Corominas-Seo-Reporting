"use client"

import { useState, useEffect, useMemo } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import type { GBPDashboardData } from "@/lib/actions/gbp-dashboard"
import type { GMBDashboardData } from "@/lib/actions/gmb-dashboard"
import { GBPDashboardPage } from "./gbp-dashboard-page"
import { GMBKeywordsDashboardPage } from "./gmb-keywords-dashboard-page"

interface CombinedPage4DashboardProps {
  gbpId?: string
  gmbId?: string
}

export function CombinedPage4Dashboard({ gbpId, gmbId }: CombinedPage4DashboardProps) {
  const [gbpData, setGBPData] = useState<GBPDashboardData | null>(null)
  const [gmbData, setGMBData] = useState<GMBDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchAllData() {
      try {
        setLoading(true)
        setError(null)

        const promises = []
        
        if (gbpId) {
          promises.push(
            fetch(`/api/gbp/dashboard/${gbpId}`)
              .then(res => res.json())
              .then(data => isMounted && setGBPData(data))
          )
        }
        
        if (gmbId) {
          promises.push(
            fetch(`/api/gmb/keywords/${gmbId}`)
              .then(res => res.json())
              .then(data => isMounted && setGMBData(data))
          )
        }

        await Promise.all(promises)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchAllData()

    return () => {
      isMounted = false
    }
  }, [gbpId, gmbId])

  // Determine metadata display (similar to page 1 pattern)
  const metadata = useMemo(() => {
    if (!gbpData && !gmbData) return null
    
    // Priority: GBP business name > GMB business name
    let title = gbpData?.businessName || gmbData?.businessName || ''
    let subtitle: string | undefined = undefined
    
    // Build subtitle based on what's connected
    const subtitleParts: string[] = []
    
    // If GBP is primary title, add GMB business name and address to subtitle
    if (gbpData?.businessName && gmbData?.businessName && gbpData.businessName !== gmbData.businessName) {
      subtitleParts.push(gmbData.businessName)
    }
    
    // Add address if available
    const address = gmbData?.address || ''
    if (address) {
      subtitleParts.push(address)
    }
    
    subtitle = subtitleParts.length > 0 ? subtitleParts.join(' • ') : undefined
    
    return {
      title,
      subtitle
    }
  }, [gbpData, gmbData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading SEO dashboard data..." />
      </div>
    )
  }

  if (error || (!gbpData && !gmbData)) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-4">
        <ErrorDisplay
          title="Dashboard Error"
          message={error || "Failed to load dashboard data. Please try again later."}
        />
      </div>
    )
  }

  // If only GBP data is available, show native GBP layout
  if (gbpData && !gmbData) {
    return (
      <GBPDashboardPage 
        data={gbpData} 
        showMetadata={true} 
        showKPIs={true} 
      />
    )
  }

  // If only GMB data is available, show native GMB layout
  if (gmbData && !gbpData) {
    return (
      <GMBKeywordsDashboardPage 
        data={gmbData} 
        showMetadata={true} 
      />
    )
  }

  // Both are available - show combined layout without section headings
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Unified Metadata - Similar to Page 1 */}
      {metadata && (
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            {metadata.title}
          </h2>
          {metadata.subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {metadata.subtitle}
            </p>
          )}
        </div>
      )}

      {/* GBP Section - No heading, just content */}
      {gbpData && (
        <GBPDashboardPage 
          data={gbpData} 
          showMetadata={false}  // Hide metadata since it's shown above
          showKPIs={true} 
        />
      )}

      {/* GMB Section - No heading, just content */}
      {gmbData && (
        <GMBKeywordsDashboardPage 
          data={gmbData} 
          showMetadata={false}  // Hide metadata since it's shown above
        />
      )}
    </div>
  )
}
