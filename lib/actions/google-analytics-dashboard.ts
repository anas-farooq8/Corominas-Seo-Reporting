"use server"

import { fetchGATrafficData, type GATrafficResponse, type GADailyTrafficData } from "@/lib/google-analytics/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"
import { selectBestComparisonWindow, type WindowResult, calculateWindowDates } from "@/lib/utils/comparison-helpers"
import { calculateDashboardDateRanges } from "@/lib/utils/date-ranges"
import { getGAPropertyDetails, extractPropertyId } from "@/lib/google-analytics/helpers"

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
  dailyData: GADailyTrafficData[] // Contains both current and previous period data
  kpiCards: GAKPICardData
  chartPeriods: {
    trafficChart: '1-month' | '3-month' | '6-month'
    sessionsConversionsChart: '1-month' | '3-month' | '6-month'
  }
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
  dailyData: GADailyTrafficData[],
  endDate: string
): { 
  kpiCards: GAKPICardData
  sessionsWindow: WindowResult
  conversionsWindow: WindowResult
} {
  console.log('\n=== GOOGLE ANALYTICS KPI CALCULATIONS ===')
  
  const sessionsWindow = selectBestComparisonWindow(
    dailyData, 
    endDate, 
    (d) => d.organicSessions,
    'GA Organic Sessions'
  )
  
  const conversionsWindow = selectBestComparisonWindow(
    dailyData, 
    endDate, 
    (d) => d.organicConversions,
    'GA Organic Conversions'
  )
  
  console.log('=== BEST WINDOWS SELECTED ===')
  console.log(`Sessions: ${sessionsWindow.type}`)
  console.log(`  Current: ${sessionsWindow.currentValue.toFixed(0)}, Previous: ${sessionsWindow.previousValue.toFixed(0)}, Change: ${sessionsWindow.isIncrease ? '+' : '-'}${sessionsWindow.change.toFixed(2)}%`)
  console.log(`Conversions: ${conversionsWindow.type}`)
  console.log(`  Current: ${conversionsWindow.currentValue.toFixed(0)}, Previous: ${conversionsWindow.previousValue.toFixed(0)}, Change: ${conversionsWindow.isIncrease ? '+' : '-'}${conversionsWindow.change.toFixed(2)}%`)
  console.log('=========================================\n')
  
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
    const property = await getGAPropertyDetails(datasourceId)
    if (!property) {
      return null
    }
    
    const propertyName = property.name
    
    // Use the same date calculation as all dashboards for consistency
    const { startDate: startDateStr, endDate: endDateStr } = calculateDashboardDateRanges()
    
    // Check cache first
    const cachedData = await getCachedDashboardData(datasourceId, propertyName, startDateStr, endDateStr)
    if (cachedData) {
      return cachedData as GADashboardData
    }
    
    // Cache miss - fetch from API
    const propertyId = extractPropertyId(propertyName)

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
    
    // Calculate previous period dates for the larger window
    const largerPeriodMonths = Math.max(sessionsMonths, conversionsMonths)
    const previousPeriodDates = calculateWindowDates(endDateStr, largerPeriodMonths, largerPeriodMonths)
    
    // Filter dailyData to include BOTH current and previous periods for the larger window
    const filteredDailyData = trafficData.dailyData.filter(d => {
      const dateNum = parseInt(d.date)
      return (
        // Current period
        (dateNum >= largerWindow.currentStartYYYYMMDD && dateNum <= largerWindow.currentEndYYYYMMDD) ||
        // Previous period
        (dateNum >= previousPeriodDates.startYYYYMMDD && dateNum <= previousPeriodDates.endYYYYMMDD)
      )
    })
    
    console.log('=== DATA PERIODS ===')
    console.log(`Current Period: ${largerWindow.currentStartYYYYMMDD} to ${largerWindow.currentEndYYYYMMDD}`)
    console.log(`Previous Period: ${previousPeriodDates.startYYYYMMDD} to ${previousPeriodDates.endYYYYMMDD}`)
    console.log(`Total days stored: ${filteredDailyData.length}`)
    console.log('===================\n')
    
    const dashboardData: GADashboardData = {
      displayName: property.display_name,
      timeZone: property.time_zone,
      currencyCode: property.currency_code,
      dailyData: filteredDailyData, // Both current and previous periods
      kpiCards: kpiCards, // Both metrics' KPI data
      chartPeriods: {
        trafficChart: sessionsWindow.type, // Total vs Organic Traffic uses sessions period
        sessionsConversionsChart: conversionsWindow.type // Sessions vs Conversions uses conversions period
      },
      currentPeriod: {
        startYYYYMMDD: largerWindow.currentStartYYYYMMDD,
        endYYYYMMDD: largerWindow.currentEndYYYYMMDD
      },
      previousPeriod: {
        startYYYYMMDD: previousPeriodDates.startYYYYMMDD,
        endYYYYMMDD: previousPeriodDates.endYYYYMMDD
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

