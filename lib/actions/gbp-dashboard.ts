"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchGBPActivityData, type GBPDailyActivityData } from "@/lib/google-business-profile/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"
import { selectBestComparisonWindow, type WindowResult, calculateWindowDates } from "@/lib/utils/comparison-helpers"
import { calculateDashboardDateRanges } from "@/lib/utils/date-ranges"

/**
 * KPI Card Data for GBP Activity metrics
 */
export interface GBPKPICardData {
  calls: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month'
    periodLabel: string
  }
  directions: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month'
    periodLabel: string
  }
  websiteClicks: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month'
    periodLabel: string
  }
}

export interface GBPDashboardData {
  businessName: string
  dailyData: GBPDailyActivityData[] // Contains both current and previous period data
  kpiCards: GBPKPICardData
  chartPeriod: '1-month' | '3-month' | '6-month' // The longest period among all metrics
  // Date ranges for filtering current/previous periods on frontend
  currentPeriod: {
    startYYYYMMDD: number
    endYYYYMMDD: number
  }
  previousPeriod: {
    startYYYYMMDD: number
    endYYYYMMDD: number
  }
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
    periodType: '1-month' | '3-month' | '6-month'
    periodLabel: string
  }
}

/**
 * Fetch GBP Actions data for Page 1 (Aggregated: calls + directions + clicks)
 * Uses cache when available to reduce API calls
 * @param datasourceId - The datasource ID
 */
export async function fetchGBPActionsForPage1(
  datasourceId: string
): Promise<GBPActionsPage1Data | null> {
  try {
    // Get location details from database
    const supabase = await createClient()
    const { data: location, error: locationError } = await supabase
      .from("google_business_profile_locations")
      .select("location_id, business_name")
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
    const { startDate: startDateStr, endDate: endDateStr } = calculateDashboardDateRanges()
    
    // Check cache first with a unique key for Page 1 aggregated data
    const cacheKey = `${fullLocationId}-page1-actions`
    const cachedData = await getCachedDashboardData(datasourceId, cacheKey, startDateStr, endDateStr)
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
  datasourceId: string
): Promise<GBPDashboardData | null> {
  try {
    // Get location details from database
    const supabase = await createClient()
    const { data: location, error: locationError } = await supabase
      .from("google_business_profile_locations")
      .select("location_id, business_name")
      .eq("datasource_id", datasourceId)
      .single()
    
    if (locationError || !location) {
      console.error("Location not found for datasource:", datasourceId, locationError)
      return null
    }
    
    const fullLocationId = location.location_id // e.g., "accounts/123/locations/456"
    const businessName = location.business_name
    
    // Extract ONLY "locations/{locationId}" part for Performance API
    // The API expects just "locations/123" not the full "accounts/456/locations/123"
    const locationIdForAPI = fullLocationId.includes('/') 
      ? fullLocationId.split('/').slice(-2).join('/') // Get "locations/456"
      : fullLocationId
    
    console.log(`[GBP Dashboard] Full ID: ${fullLocationId}, API ID: ${locationIdForAPI}`)
    
    // Use the same date calculation as all dashboards for consistency
    const { startDate: startDateStr, endDate: endDateStr } = calculateDashboardDateRanges()
    
    // Check cache first
    const cachedData = await getCachedDashboardData(datasourceId, fullLocationId, startDateStr, endDateStr)
    if (cachedData) {
      return cachedData as GBPDashboardData
    }
    
    // Cache miss - fetch from API
    console.log("⟳ Fetching fresh GBP activity data from API")

    // Fetch activity data from GBP Performance API
    const activityData = await fetchGBPActivityData(locationIdForAPI)

    // Calculate KPI cards and get best windows
    const { kpiCards, callsWindow, directionsWindow, websiteClicksWindow } = calculateKPICards(
      activityData.dailyData, 
      endDateStr
    )
    
    // Determine which window is largest (most months)
    const monthsMap: Record<'1-month' | '3-month' | '6-month', number> = { 
      '1-month': 1, 
      '3-month': 3, 
      '6-month': 6 
    }
    const callsMonths = monthsMap[callsWindow.type]
    const directionsMonths = monthsMap[directionsWindow.type]
    const websiteClicksMonths = monthsMap[websiteClicksWindow.type]
    
    // Find the largest window
    const maxMonths = Math.max(callsMonths, directionsMonths, websiteClicksMonths)
    let largestWindow: WindowResult
    
    if (callsMonths === maxMonths) {
      largestWindow = callsWindow
    } else if (directionsMonths === maxMonths) {
      largestWindow = directionsWindow
    } else {
      largestWindow = websiteClicksWindow
    }
    
    // Calculate previous period dates for the largest window
    const previousPeriodDates = calculateWindowDates(endDateStr, maxMonths, maxMonths)
    
    // Filter dailyData to include BOTH current and previous periods for the largest window
    const filteredDailyData = activityData.dailyData.filter(d => {
      const dateNum = parseInt(d.date)
      return (
        // Current period
        (dateNum >= largestWindow.currentStartYYYYMMDD && dateNum <= largestWindow.currentEndYYYYMMDD) ||
        // Previous period
        (dateNum >= previousPeriodDates.startYYYYMMDD && dateNum <= previousPeriodDates.endYYYYMMDD)
      )
    })
    
    console.log('=== DATA PERIODS ===')
    console.log(`Current Period: ${largestWindow.currentStartYYYYMMDD} to ${largestWindow.currentEndYYYYMMDD}`)
    console.log(`Previous Period: ${previousPeriodDates.startYYYYMMDD} to ${previousPeriodDates.endYYYYMMDD}`)
    console.log(`Total days stored: ${filteredDailyData.length}`)
    console.log('===================\n')
    
    const dashboardData: GBPDashboardData = {
      businessName: businessName,
      dailyData: filteredDailyData, // Both current and previous periods
      kpiCards: kpiCards, // All three metrics' KPI data
      chartPeriod: largestWindow.type, // Chart uses the longest period
      currentPeriod: {
        startYYYYMMDD: largestWindow.currentStartYYYYMMDD,
        endYYYYMMDD: largestWindow.currentEndYYYYMMDD
      },
      previousPeriod: {
        startYYYYMMDD: previousPeriodDates.startYYYYMMDD,
        endYYYYMMDD: previousPeriodDates.endYYYYMMDD
      }
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

