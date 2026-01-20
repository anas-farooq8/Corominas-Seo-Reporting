"use server"

import { fetchGALandingPagesData, type GALandingPagesResponse, type GALandingPageData, type GADailyLandingPageData } from "@/lib/google-analytics/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"
import { calculateLandingPagesDateRanges } from "@/lib/utils/date-ranges"
import { getGAPropertyDetails, extractPropertyId } from "@/lib/google-analytics/helpers"

export interface GALandingPagesDashboardData {
  displayName: string
  timeZone: string
  currencyCode: string
  dailyData: GADailyLandingPageData[]
  topLandingPages: GALandingPageData[]
  totalSessions: number
  totalConversions: number
}

/**
 * Fetch Google Analytics landing pages dashboard data
 * Uses cache when available to reduce API calls
 * @param datasourceId - The datasource ID
 */
export async function fetchGALandingPagesDashboard(
  datasourceId: string
): Promise<GALandingPagesDashboardData | null> {
  try {
    // Get property details from database
    const property = await getGAPropertyDetails(datasourceId)
    if (!property) {
      return null
    }
    
    const propertyName = property.name
    
    // Use 12-month date range for landing pages (Page 3)
    const { startDate: startDateStr, endDate: endDateStr } = calculateLandingPagesDateRanges()
    
    // Check cache first (use a different resource ID for landing pages)
    const resourceId = `${propertyName}-landing-pages`
    const cachedData = await getCachedDashboardData(datasourceId, resourceId, startDateStr, endDateStr)
    if (cachedData) {
      console.log("✓ Returning cached GA landing pages data")
      return cachedData as GALandingPagesDashboardData
    }
    
    // Cache miss - fetch from API
    console.log("⟳ Fetching fresh GA landing pages data from API")
    const propertyId = extractPropertyId(propertyName)

    // Fetch landing pages data from Google Analytics API
    const landingPagesData = await fetchGALandingPagesData(propertyId)

    const dashboardData: GALandingPagesDashboardData = {
      displayName: property.display_name,
      timeZone: property.time_zone,
      currencyCode: property.currency_code,
      dailyData: landingPagesData.dailyData,
      topLandingPages: landingPagesData.topLandingPages,
      totalSessions: landingPagesData.totalSessions,
      totalConversions: landingPagesData.totalConversions
    }
    
    // Save to cache (fire and forget - don't wait)
    saveDashboardCache(datasourceId, resourceId, startDateStr, endDateStr, dashboardData)
      .catch(err => console.error("Failed to save cache:", err))
    
    return dashboardData
  } catch (error) {
    console.error("[GA Landing Pages Dashboard] Error:", error)
    throw error
  }
}

