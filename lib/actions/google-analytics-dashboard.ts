"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchGATrafficData, type GATrafficResponse, type GADailyTrafficData } from "@/lib/google-analytics/api"

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
 * Fetch Google Analytics dashboard data for a datasource
 */
export async function fetchGADashboardData(datasourceId: string): Promise<GADashboardData | null> {
  try {
    // Get the Google Analytics property for this datasource
    const supabase = await createClient()
    const { data: property, error } = await supabase
      .from("google_analytics_properties")
      .select("*")
      .eq("datasource_id", datasourceId)
      .single()

    if (error || !property) {
      console.error('[GA Dashboard] Property not found:', error)
      throw new Error("Google Analytics property not found for this datasource")
    }

    // Extract property ID from name (e.g., "properties/469744307" -> "469744307")
    const propertyId = property.name.split('/')[1]
    
    if (!propertyId) {
      throw new Error("Invalid property name format")
    }

    // Fetch traffic data from Google Analytics API
    const trafficData = await fetchGATrafficData(propertyId)

    return {
      propertyName: property.name,
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
  } catch (error) {
    console.error("[GA Dashboard] Error:", error)
    throw error
  }
}

