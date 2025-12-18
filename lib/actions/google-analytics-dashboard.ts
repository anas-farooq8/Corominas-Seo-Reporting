"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchGATrafficData, type GATrafficResponse, type GADailyTrafficData } from "@/lib/google-analytics/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"

export interface GADashboardData {
  propertyName: string
  displayName: string
  timeZone: string
  currencyCode: string
  dailyData: GADailyTrafficData[]
  lastMonthOrganicSessions: number
  lastMonthOrganicConversions: number
  previousMonthOrganicSessions: number
  previousMonthOrganicConversions: number
  dateRanges: {
    startDate: string
    endDate: string
  }
}

/**
 * Fetch Google Analytics dashboard data
 * Uses cache when available to reduce API calls
 * @param datasourceId - The datasource ID
 */
export async function fetchGADashboardData(
  datasourceId: string
): Promise<GADashboardData | null> {
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
    
    // Check cache first
    const cachedData = await getCachedDashboardData(datasourceId, propertyName, startDateStr, endDateStr)
    if (cachedData) {
      console.log("✓ Returning cached GA dashboard data")
      return cachedData as GADashboardData
    }
    
    // Cache miss - fetch from API
    console.log("⟳ Fetching fresh GA dashboard data from API")
    
    // Extract property ID from name (e.g., "properties/469744307" -> "469744307")
    const propertyId = propertyName.split('/')[1]
    
    if (!propertyId) {
      throw new Error("Invalid property name format")
    }

    // Fetch traffic data from Google Analytics API
    const trafficData = await fetchGATrafficData(propertyId)

    const dashboardData: GADashboardData = {
      propertyName: propertyName,
      displayName: property.display_name,
      timeZone: property.time_zone,
      currencyCode: property.currency_code,
      dailyData: trafficData.dailyData,
      lastMonthOrganicSessions: trafficData.lastMonthOrganicSessions,
      lastMonthOrganicConversions: trafficData.lastMonthOrganicConversions,
      previousMonthOrganicSessions: trafficData.previousMonthOrganicSessions,
      previousMonthOrganicConversions: trafficData.previousMonthOrganicConversions,
      dateRanges: trafficData.dateRanges
    }
    
    // Save to cache (fire and forget - don't wait)
    saveDashboardCache(datasourceId, propertyName, startDateStr, endDateStr, dashboardData)
      .catch(err => console.error("Failed to save cache:", err))
    
    return dashboardData
  } catch (error) {
    console.error("[GA Dashboard] Error:", error)
    throw error
  }
}

