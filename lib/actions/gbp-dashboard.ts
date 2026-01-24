"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { fetchGBPActivityData, type GBPDailyActivityData } from "@/lib/google-business-profile/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"
import { selectBestComparisonWindow, type WindowResult } from "@/lib/utils/comparison-helpers"
import { calculateDashboardDateRanges } from "@/lib/utils/date-ranges"
import type { DashboardOptions } from "@/lib/api/dashboard-handler"

/**
 * KPI Card Data for GBP Activity metrics
 */
export interface GBPKPICardData {
  calls: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month' | '12-month'
    periodLabel: string
  }
  directions: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month' | '12-month'
    periodLabel: string
  }
  websiteClicks: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month' | '12-month'
    periodLabel: string
  }
}

export interface GBPDashboardData {
  businessName: string
  address: string | null
  kpiCards: GBPKPICardData
}

/**
 * Calculate KPI cards from daily data - returns best period for each metric
 */
function calculateKPICards(
  dailyData: GBPDailyActivityData[],
  endDate: string
): { 
  kpiCards: GBPKPICardData
  callsWindow: WindowResult
  directionsWindow: WindowResult
  websiteClicksWindow: WindowResult
} {
  console.log('\n=== GBP ACTIVITY KPI CALCULATIONS ===')
  
  const callsWindow = selectBestComparisonWindow(
    dailyData, 
    endDate, 
    (d) => d.calls,
    'GBP Calls'
  )
  
  const directionsWindow = selectBestComparisonWindow(
    dailyData, 
    endDate, 
    (d) => d.directions,
    'GBP Directions'
  )
  
  const websiteClicksWindow = selectBestComparisonWindow(
    dailyData, 
    endDate, 
    (d) => d.websiteClicks,
    'GBP Website Clicks'
  )
  
  console.log('=== BEST WINDOWS SELECTED ===')
  console.log(`Calls: ${callsWindow.type}`)
  console.log(`  Current: ${callsWindow.currentValue.toFixed(0)}, Previous: ${callsWindow.previousValue.toFixed(0)}, Change: ${callsWindow.isIncrease ? '+' : '-'}${callsWindow.change.toFixed(2)}%`)
  console.log(`Directions: ${directionsWindow.type}`)
  console.log(`  Current: ${directionsWindow.currentValue.toFixed(0)}, Previous: ${directionsWindow.previousValue.toFixed(0)}, Change: ${directionsWindow.isIncrease ? '+' : '-'}${directionsWindow.change.toFixed(2)}%`)
  console.log(`Website Clicks: ${websiteClicksWindow.type}`)
  console.log(`  Current: ${websiteClicksWindow.currentValue.toFixed(0)}, Previous: ${websiteClicksWindow.previousValue.toFixed(0)}, Change: ${websiteClicksWindow.isIncrease ? '+' : '-'}${websiteClicksWindow.change.toFixed(2)}%`)
  console.log('=========================================\n')
  
  // Build KPI cards
  const kpiCards: GBPKPICardData = {
    calls: {
      current: callsWindow.currentValue,
      previous: callsWindow.previousValue,
      change: callsWindow.change,
      isIncrease: callsWindow.isIncrease,
      periodType: callsWindow.type,
      periodLabel: `${callsWindow.type} comparison`
    },
    directions: {
      current: directionsWindow.currentValue,
      previous: directionsWindow.previousValue,
      change: directionsWindow.change,
      isIncrease: directionsWindow.isIncrease,
      periodType: directionsWindow.type,
      periodLabel: `${directionsWindow.type} comparison`
    },
    websiteClicks: {
      current: websiteClicksWindow.currentValue,
      previous: websiteClicksWindow.previousValue,
      change: websiteClicksWindow.change,
      isIncrease: websiteClicksWindow.isIncrease,
      periodType: websiteClicksWindow.type,
      periodLabel: `${websiteClicksWindow.type} comparison`
    }
  }
  
  return { kpiCards, callsWindow, directionsWindow, websiteClicksWindow }
}

/**
 * KPI Card Data for Page 1 - Aggregated GBP Actions
 */
export interface GBPActionsPage1Data {
  businessName: string
  totalActions: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month' | '12-month'
    periodLabel: string
  }
}

/**
 * Fetch GBP Actions data for Page 1 (Aggregated: calls + directions + clicks)
 * Uses cache when available to reduce API calls
 * @param datasourceId - The datasource ID
 */
export async function fetchGBPActionsForPage1(
  datasourceId: string,
  options?: DashboardOptions
): Promise<GBPActionsPage1Data | null> {
  try {
    // Get location details from database (use service role for shareable reports)
    const supabase = options?.today ? createServiceClient() : await createClient()
    const { data: location, error: locationError } = await supabase
      .from("google_business_profile_locations")
      .select("location_id, business_name, address")
      .eq("datasource_id", datasourceId)
      .single()
    
    if (locationError || !location) {
      console.error("Location not found for datasource:", datasourceId, locationError)
      return null
    }
    
    const fullLocationId = location.location_id
    
    // Extract ONLY "locations/{locationId}" part for Performance API
    const locationIdForAPI = fullLocationId.includes('/') 
      ? fullLocationId.split('/').slice(-2).join('/') 
      : fullLocationId
    
    console.log(`[GBP Page1] Full ID: ${fullLocationId}, API ID: ${locationIdForAPI}`)
    
    // Use the same date calculation as all dashboards for consistency
    const { startDate: startDateStr, endDate: endDateStr } = calculateDashboardDateRanges(options?.today)
    
    // Check cache first with a unique key for Page 1 aggregated data
    const cacheKey = `${fullLocationId}-page1-actions`
    const useServiceRole = !!options?.today
    const cachedData = await getCachedDashboardData(datasourceId, cacheKey, startDateStr, endDateStr, useServiceRole)
    if (cachedData) {
      console.log('[GBP Page1] Cache hit - returning aggregated actions')
      return cachedData as GBPActionsPage1Data
    }
    
    // Cache miss - fetch from API
    console.log("⟳ Fetching fresh GBP activity data from API for Page 1")

    // Fetch activity data from GBP Performance API
    const activityData = await fetchGBPActivityData(locationIdForAPI)

    // Calculate aggregated actions: calls + directions + websiteClicks
    const aggregatedWindow = selectBestComparisonWindow(
      activityData.dailyData,
      endDateStr,
      (d) => d.calls + d.directions + d.websiteClicks,
      'GBP Total Actions (Page 1)'
    )
    
    console.log('=== GBP PAGE 1 AGGREGATED ACTIONS ===')
    console.log(`Period: ${aggregatedWindow.type}`)
    console.log(`  Current: ${aggregatedWindow.currentValue.toFixed(0)}, Previous: ${aggregatedWindow.previousValue.toFixed(0)}, Change: ${aggregatedWindow.isIncrease ? '+' : '-'}${aggregatedWindow.change.toFixed(2)}%`)
    console.log('======================================\n')
    
    const page1Data: GBPActionsPage1Data = {
      businessName: location.business_name,
      totalActions: {
        current: aggregatedWindow.currentValue,
        previous: aggregatedWindow.previousValue,
        change: aggregatedWindow.change,
        isIncrease: aggregatedWindow.isIncrease,
        periodType: aggregatedWindow.type,
        periodLabel: `${aggregatedWindow.type} comparison`
      }
    }
    
    // Save to cache (fire and forget - don't wait)
    saveDashboardCache(datasourceId, cacheKey, startDateStr, endDateStr, page1Data)
      .catch(err => console.error("Failed to save Page 1 GBP cache:", err))
    
    return page1Data
  } catch (error) {
    console.error("[GBP Page1] Error:", error)
    throw error
  }
}

/**
 * Fetch GBP dashboard data
 * Uses cache when available to reduce API calls
 * @param datasourceId - The datasource ID
 */
export async function fetchGBPDashboardData(
  datasourceId: string,
  options?: DashboardOptions
): Promise<GBPDashboardData | null> {
  try {
    // Get location details from database (use service role for shareable reports)
    const supabase = options?.today ? createServiceClient() : await createClient()
    const { data: location, error: locationError } = await supabase
      .from("google_business_profile_locations")
      .select("location_id, business_name, address")
      .eq("datasource_id", datasourceId)
      .single()
    
    if (locationError || !location) {
      console.error("Location not found for datasource:", datasourceId, locationError)
      return null
    }
    
    const fullLocationId = location.location_id
    const businessName = location.business_name
    
    // Extract ONLY "locations/{locationId}" part for Performance API
    const locationIdForAPI = fullLocationId.includes('/') 
      ? fullLocationId.split('/').slice(-2).join('/') 
      : fullLocationId
    
    console.log(`[GBP Dashboard] Full ID: ${fullLocationId}, API ID: ${locationIdForAPI}`)
    
    // Use the same date calculation as all dashboards for consistency
    const { startDate: startDateStr, endDate: endDateStr } = calculateDashboardDateRanges(options?.today)
    
    // Check cache first (use service role for shareable reports)
    const useServiceRole = !!options?.today
    const cachedData = await getCachedDashboardData(datasourceId, fullLocationId, startDateStr, endDateStr, useServiceRole)
    if (cachedData) {
      return cachedData as GBPDashboardData
    }
    
    // Cache miss - fetch from API
    console.log("⟳ Fetching fresh GBP activity data from API")

    // Fetch activity data from GBP Performance API
    const activityData = await fetchGBPActivityData(locationIdForAPI)

    // Calculate KPI cards
    const { kpiCards } = calculateKPICards(
      activityData.dailyData, 
      endDateStr
    )
    
    const dashboardData: GBPDashboardData = {
      businessName: businessName,
      address: location.address || null,
      kpiCards: kpiCards
    }
    
    // Save to cache (fire and forget - don't wait)
    saveDashboardCache(datasourceId, fullLocationId, startDateStr, endDateStr, dashboardData)
      .catch(err => console.error("Failed to save cache:", err))
    
    return dashboardData
  } catch (error) {
    console.error("[GBP Dashboard] Error:", error)
    throw error
  }
}

