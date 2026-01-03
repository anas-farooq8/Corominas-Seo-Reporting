"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchGATrafficData, type GATrafficResponse, type GADailyTrafficData } from "@/lib/google-analytics/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"
import { selectBestComparisonWindow, type WindowResult } from "@/lib/utils/comparison-helpers"

/**
 * KPI Card Data for Google Analytics metrics
 */
export interface GAKPICardData {
  organicSessions: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month'
    periodLabel: string
  }
  organicConversions: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month'
    periodLabel: string
  }
}

export interface GADashboardData {
  displayName: string
  timeZone: string
  currencyCode: string
  dailyData: GADailyTrafficData[]
  kpiCards: GAKPICardData
  chartPeriods: {
    trafficChart: '1-month' | '3-month' | '6-month'
    sessionsConversionsChart: '1-month' | '3-month' | '6-month'
  }
}

/**
 * Calculate KPI cards from daily data - returns best period for each metric
 */
function calculateKPICards(
  dailyData: GADailyTrafficData[],
  endDate: string
): { 
  kpiCards: GAKPICardData
  sessionsWindow: WindowResult
  conversionsWindow: WindowResult
} {
  const sessionsWindow = selectBestComparisonWindow(
    dailyData, 
    endDate, 
    (d) => d.organicSessions
  )
  
  const conversionsWindow = selectBestComparisonWindow(
    dailyData, 
    endDate, 
    (d) => d.organicConversions
  )
  
  // Build KPI cards
  const kpiCards: GAKPICardData = {
    organicSessions: {
      current: sessionsWindow.currentValue,
      previous: sessionsWindow.previousValue,
      change: sessionsWindow.change,
      isIncrease: sessionsWindow.isIncrease,
      periodType: sessionsWindow.type,
      periodLabel: `${sessionsWindow.type} comparison`
    },
    organicConversions: {
      current: conversionsWindow.currentValue,
      previous: conversionsWindow.previousValue,
      change: conversionsWindow.change,
      isIncrease: conversionsWindow.isIncrease,
      periodType: conversionsWindow.type,
      periodLabel: `${conversionsWindow.type} comparison`
    }
  }
  
  return { kpiCards, sessionsWindow, conversionsWindow }
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
      return cachedData as GADashboardData
    }
    
    // Cache miss - fetch from API
    
    // Extract property ID from name (e.g., "properties/469744307" -> "469744307")
    const propertyId = propertyName.split('/')[1]
    
    if (!propertyId) {
      throw new Error("Invalid property name format")
    }

    // Fetch traffic data from Google Analytics API
    const trafficData = await fetchGATrafficData(propertyId)

    // Calculate KPI cards and get best windows
    const { kpiCards, sessionsWindow, conversionsWindow } = calculateKPICards(
      trafficData.dailyData, 
      endDateStr
    )
    
    // Determine which window is larger (more months)
    const monthsMap: Record<'1-month' | '3-month' | '6-month', number> = { 
      '1-month': 1, 
      '3-month': 3, 
      '6-month': 6 
    }
    const sessionsMonths = monthsMap[sessionsWindow.type]
    const conversionsMonths = monthsMap[conversionsWindow.type]
    const largerWindow = sessionsMonths >= conversionsMonths ? sessionsWindow : conversionsWindow
    
    // Filter dailyData to only include the larger period's current window
    const filteredDailyData = trafficData.dailyData.filter(d => {
      const dateNum = parseInt(d.date)
      return dateNum >= largerWindow.currentStartYYYYMMDD && dateNum <= largerWindow.currentEndYYYYMMDD
    })
    
    const dashboardData: GADashboardData = {
      displayName: property.display_name,
      timeZone: property.time_zone,
      currencyCode: property.currency_code,
      dailyData: filteredDailyData, // Only the larger period
      kpiCards: kpiCards, // Both metrics' KPI data
      chartPeriods: {
        trafficChart: sessionsWindow.type, // Total vs Organic Traffic uses sessions period
        sessionsConversionsChart: conversionsWindow.type // Sessions vs Conversions uses conversions period
      }
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

