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
 * Fetch Google Analytics dashboard data
 * @param propertyName - The GA property name (e.g., "properties/469744307")
 * @param displayName - Optional: property display name (avoids DB lookup)
 * @param timeZone - Optional: property time zone (avoids DB lookup)
 * @param currencyCode - Optional: property currency code (avoids DB lookup)
 */
export async function fetchGADashboardData(
  propertyName: string,
  displayName?: string | null,
  timeZone?: string | null,
  currencyCode?: string | null
): Promise<GADashboardData | null> {
  try {
    // Extract property ID from name (e.g., "properties/469744307" -> "469744307")
    const propertyId = propertyName.split('/')[1]
    
    if (!propertyId) {
      throw new Error("Invalid property name format")
    }

    // Fetch traffic data from Google Analytics API
    const trafficData = await fetchGATrafficData(propertyId)

    return {
      propertyName: propertyName,
      displayName: displayName || propertyName,
      timeZone: timeZone || 'UTC',
      currencyCode: currencyCode || 'USD',
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

