"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchGALandingPagesData, type GALandingPagesResponse, type GALandingPageData, type GADailyLandingPageData } from "@/lib/google-analytics/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"

export interface GALandingPagesDashboardData {
  propertyName: string
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
    const supabase = await createClient()
    const { data: property, error: propertyError } = await supabase
      .from("google_analytics_properties")
      .select("name, display_name, time_zone, currency_code")
      .eq("datasource_id", datasourceId)
      .single()
    
    if (propertyError || !property) {
      console.error("Property not found for datasource:", datasourceId, propertyError)
      return null
    }
    
    const propertyName = property.name
    
    // Calculate date ranges (12 months of data - last completed month going back 12 months)
    const today = new Date()
    const endDate = new Date(today.getFullYear(), today.getMonth(), 0) // Last day of previous month
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1) // 12 months back
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const startDateStr = formatDate(startDate)
    const endDateStr = formatDate(endDate)
    
    // Check cache first (use a different resource ID for landing pages)
    const resourceId = `${propertyName}-landing-pages`
    const cachedData = await getCachedDashboardData(datasourceId, resourceId, startDateStr, endDateStr)
    if (cachedData) {
      console.log("✓ Returning cached GA landing pages data")
      return cachedData as GALandingPagesDashboardData
    }
    
    // Cache miss - fetch from API
    console.log("⟳ Fetching fresh GA landing pages data from API")
    
    // Extract property ID from name (e.g., "properties/469744307" -> "469744307")
    const propertyId = propertyName.split('/')[1]
    
    if (!propertyId) {
      throw new Error("Invalid property name format")
    }

    // Fetch landing pages data from Google Analytics API
    const landingPagesData = await fetchGALandingPagesData(propertyId)

    const dashboardData: GALandingPagesDashboardData = {
      propertyName: propertyName,
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

