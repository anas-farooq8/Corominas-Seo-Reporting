"use client"

import { useState, useEffect } from "react"
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading Google Business data..." />
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

  // Both are available - show combined layout
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* GBP Section */}
      {gbpData && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 px-3 sm:px-4 md:px-6 lg:px-8">
            Google Business Profile Activity
          </h3>
          <GBPDashboardPage 
            data={gbpData} 
            showMetadata={true} 
            showKPIs={true} 
          />
        </div>
      )}

      {/* Divider */}
      {gbpData && gmbData && (
        <div className="border-t mx-3 sm:mx-4 md:mx-6 lg:mx-8"></div>
      )}

      {/* GMB Section */}
      {gmbData && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 px-3 sm:px-4 md:px-6 lg:px-8">
            Grid My Business - Keyword Rankings
          </h3>
          <GMBKeywordsDashboardPage 
            data={gmbData} 
            showMetadata={true} 
          />
        </div>
      )}
    </div>
  )
}
