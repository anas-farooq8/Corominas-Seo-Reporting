"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchSearchConsoleData, type GSCDashboardResponse, type GSCDailyData } from "@/lib/google-search-console/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"
import { calculateDashboardDateRanges } from "@/lib/utils/date-ranges"
import { calculateWindowDates, type ComparisonWindow, type PeriodType } from "@/lib/utils/comparison-helpers"

/**
 * KPI Card Data for each metric
 */
export interface GSCKPICardData {
  totalClicks: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month'
    periodLabel: string
  }
  totalImpressions: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month'
    periodLabel: string
  }
  averageCTR: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month'
    periodLabel: string
  }
  averagePosition: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month'
    periodLabel: string
  }
}

export interface GSCDashboardData {
  siteUrl: string
  kpiCards: GSCKPICardData
}

/**
 * Calculate KPI cards from daily data using custom logic for GSC metrics
 * All calculations return TOTALS for the window period (not monthly averages)
 */
function calculateKPICards(dailyData: GSCDailyData[], endDate: string): GSCKPICardData {
  console.log('\n=== SEARCH CONSOLE KPI CALCULATIONS ===')
  console.log(`Total daily data points: ${dailyData.length}`)
  console.log(`First date: ${dailyData[0]?.date}, Last date: ${dailyData[dailyData.length - 1]?.date}`)
  
  // Calculate window totals (same logic as test script)
  const clicksComparison = calculateMetricComparison(dailyData, endDate, 'clicks')
  const impressionsComparison = calculateMetricComparison(dailyData, endDate, 'impressions')
  const ctrComparison = calculateCTRComparison(dailyData, endDate)
  const positionComparison = calculatePositionComparison(dailyData, endDate)
  
  console.log('=== BEST WINDOWS SELECTED ===')
  console.log(`Clicks: ${clicksComparison.periodType}`)
  console.log(`  Current: ${clicksComparison.current.toFixed(0)}, Previous: ${clicksComparison.previous.toFixed(0)}, Change: ${clicksComparison.isIncrease ? '+' : ''}${clicksComparison.change.toFixed(2)}%`)
  console.log(`Impressions: ${impressionsComparison.periodType}`)
  console.log(`  Current: ${impressionsComparison.current.toFixed(0)}, Previous: ${impressionsComparison.previous.toFixed(0)}, Change: ${impressionsComparison.isIncrease ? '+' : ''}${impressionsComparison.change.toFixed(2)}%`)
  console.log(`CTR: ${ctrComparison.periodType}`)
  console.log(`  Current: ${ctrComparison.current.toFixed(2)}%, Previous: ${ctrComparison.previous.toFixed(2)}%, Change: ${ctrComparison.isIncrease ? '+' : ''}${ctrComparison.change.toFixed(2)}%`)
  console.log(`Position: ${positionComparison.periodType}`)
  console.log(`  Current: ${positionComparison.current.toFixed(2)}, Previous: ${positionComparison.previous.toFixed(2)}, Change: ${positionComparison.isIncrease ? '+' : ''}${positionComparison.change.toFixed(2)}%`)
  console.log('=========================================\n')
  
  return {
    totalClicks: {
      current: clicksComparison.current,
      previous: clicksComparison.previous,
      change: clicksComparison.change,
      isIncrease: clicksComparison.isIncrease,
      periodType: clicksComparison.periodType,
      periodLabel: clicksComparison.periodLabel
    },
    totalImpressions: {
      current: impressionsComparison.current,
      previous: impressionsComparison.previous,
      change: impressionsComparison.change,
      isIncrease: impressionsComparison.isIncrease,
      periodType: impressionsComparison.periodType,
      periodLabel: impressionsComparison.periodLabel
    },
    averageCTR: {
      current: ctrComparison.current,
      previous: ctrComparison.previous,
      change: ctrComparison.change,
      isIncrease: ctrComparison.isIncrease,
      periodType: ctrComparison.periodType,
      periodLabel: ctrComparison.periodLabel
    },
    averagePosition: {
      current: positionComparison.current,
      previous: positionComparison.previous,
      change: positionComparison.change,
      isIncrease: positionComparison.isIncrease,
      periodType: positionComparison.periodType,
      periodLabel: positionComparison.periodLabel
    },
  }
}

/**
 * Calculate metric comparison for clicks or impressions (returns TOTALS)
 * Strategy: Try 1-month first, if negative try 3-month, if negative try 6-month
 * If all negative, select the most neutral (smallest change)
 */
function calculateMetricComparison(dailyData: GSCDailyData[], endDate: string, metric: 'clicks' | 'impressions'): ComparisonWindow {
  const windows: Array<{ months: number, label: PeriodType }> = [
    { months: 1, label: '1-month' },
    { months: 3, label: '3-month' },
    { months: 6, label: '6-month' },
  ]
  
  let mostNeutralNegative: ComparisonWindow | null = null
  
  for (const { months, label } of windows) {
    const currentDates = calculateWindowDates(endDate, 0, months)
    const previousDates = calculateWindowDates(endDate, months, months)
    
    const currentData = dailyData.filter(d => {
      const dateNum = parseInt(d.date)
      return dateNum >= currentDates.startYYYYMMDD && dateNum <= currentDates.endYYYYMMDD
    })
    const previousData = dailyData.filter(d => {
      const dateNum = parseInt(d.date)
      return dateNum >= previousDates.startYYYYMMDD && dateNum <= previousDates.endYYYYMMDD
    })
    
    const currentTotal = currentData.reduce((sum, d) => sum + d[metric], 0)
    const previousTotal = previousData.reduce((sum, d) => sum + d[metric], 0)
    
    // Calculate days count
    const currentDays = currentData.length
    const previousDays = previousData.length
    
    // Debug logging with detailed format matching GA
    const metricName = metric === 'clicks' ? 'GSC Total Clicks' : 'GSC Total Impressions'
    console.log(`[${metricName}] ${label}:`)
    console.log(`  Current:  ${currentDates.startDate} to ${currentDates.endDate} (${currentDays} days) = ${currentTotal.toFixed(2)}`)
    console.log(`  Previous: ${previousDates.startDate} to ${previousDates.endDate} (${previousDays} days) = ${previousTotal.toFixed(2)}`)
    
    if (previousTotal > 0) {
      const change = ((currentTotal - previousTotal) / previousTotal) * 100
      const isIncrease = change >= 0
      
      console.log(`  Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`)
      
      const result: ComparisonWindow = {
        current: currentTotal,
        previous: previousTotal,
        change: Math.abs(change),
        isIncrease,
        periodType: label,
        periodLabel: `${label} comparison`,
        currentPeriod: `${currentDates.startDate} to ${currentDates.endDate}`,
        previousPeriod: `${previousDates.startDate} to ${previousDates.endDate}`
      }
      
      if (isIncrease) {
        console.log(`  ✓ Selected ${label} (positive)\n`)
        return result
      }
      
      if (!mostNeutralNegative || result.change < mostNeutralNegative.change) {
        mostNeutralNegative = result
      }
      
      console.log(`  ✗ Negative, trying next window\n`)
      
      if (label === '6-month') {
        console.log(`  ✓ Selected ${mostNeutralNegative!.periodType} (most neutral negative)\n`)
        return mostNeutralNegative!
      }
    }
  }
  
  return mostNeutralNegative || {
    current: 0, previous: 0, change: 0, isIncrease: true,
    periodType: '1-month', periodLabel: '1-month comparison'
  }
}

/**
 * Calculate CTR comparison (total clicks / total impressions) for each window
 * Strategy: Try 1-month first, if negative try 3-month, if negative try 6-month
 * If all negative, select the most neutral (smallest change)
 */
function calculateCTRComparison(dailyData: GSCDailyData[], endDate: string): ComparisonWindow {
  const windows: Array<{ months: number, label: PeriodType }> = [
    { months: 1, label: '1-month' },
    { months: 3, label: '3-month' },
    { months: 6, label: '6-month' },
  ]
  
  let mostNeutralNegative: ComparisonWindow | null = null
  
  for (const { months, label } of windows) {
    const currentDates = calculateWindowDates(endDate, 0, months)
    const previousDates = calculateWindowDates(endDate, months, months)
    
    const currentData = dailyData.filter(d => {
      const dateNum = parseInt(d.date)
      return dateNum >= currentDates.startYYYYMMDD && dateNum <= currentDates.endYYYYMMDD
    })
    const previousData = dailyData.filter(d => {
      const dateNum = parseInt(d.date)
      return dateNum >= previousDates.startYYYYMMDD && dateNum <= previousDates.endYYYYMMDD
    })
    
    const currentClicks = currentData.reduce((sum, d) => sum + d.clicks, 0)
    const currentImpressions = currentData.reduce((sum, d) => sum + d.impressions, 0)
    const currentCTR = currentImpressions > 0 ? (currentClicks / currentImpressions) * 100 : 0
    
    const previousClicks = previousData.reduce((sum, d) => sum + d.clicks, 0)
    const previousImpressions = previousData.reduce((sum, d) => sum + d.impressions, 0)
    const previousCTR = previousImpressions > 0 ? (previousClicks / previousImpressions) * 100 : 0
    
    // Calculate days count
    const currentDays = currentData.length
    const previousDays = previousData.length
    
    // Debug logging with detailed format matching GA
    console.log(`[GSC Average CTR] ${label}:`)
    console.log(`  Current:  ${currentDates.startDate} to ${currentDates.endDate} (${currentDays} days) = ${currentCTR.toFixed(2)}`)
    console.log(`  Previous: ${previousDates.startDate} to ${previousDates.endDate} (${previousDays} days) = ${previousCTR.toFixed(2)}`)
    
    if (previousCTR > 0) {
      const change = ((currentCTR - previousCTR) / previousCTR) * 100
      const isIncrease = change >= 0
      
      console.log(`  Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`)
      
      const result: ComparisonWindow = {
        current: currentCTR,
        previous: previousCTR,
        change: Math.abs(change),
        isIncrease,
        periodType: label,
        periodLabel: `${label} comparison`,
        currentPeriod: `${currentDates.startDate} to ${currentDates.endDate}`,
        previousPeriod: `${previousDates.startDate} to ${previousDates.endDate}`
      }
      
      if (isIncrease) {
        console.log(`  ✓ Selected ${label} (positive)\n`)
        return result
      }
      
      if (!mostNeutralNegative || result.change < mostNeutralNegative.change) {
        mostNeutralNegative = result
      }
      
      console.log(`  ✗ Negative, trying next window\n`)
      
      if (label === '6-month') {
        console.log(`  ✓ Selected ${mostNeutralNegative!.periodType} (most neutral negative)\n`)
        return mostNeutralNegative!
      }
    }
  }
  
  return mostNeutralNegative || {
    current: 0, previous: 0, change: 0, isIncrease: true,
    periodType: '1-month', periodLabel: '1-month comparison'
  }
}

/**
 * Calculate position comparison (weighted by impressions) for each window
 * Strategy: Try 1-month first, if negative try 3-month, if negative try 6-month
 * If all negative, select the most neutral (smallest change)
 * Note: For position, LOWER is better, so isIncrease is flipped
 */
function calculatePositionComparison(dailyData: GSCDailyData[], endDate: string): ComparisonWindow {
  const windows: Array<{ months: number, label: PeriodType }> = [
    { months: 1, label: '1-month' },
    { months: 3, label: '3-month' },
    { months: 6, label: '6-month' },
  ]
  
  let mostNeutralNegative: ComparisonWindow | null = null
  
  for (const { months, label } of windows) {
    const currentDates = calculateWindowDates(endDate, 0, months)
    const previousDates = calculateWindowDates(endDate, months, months)
    
    const currentData = dailyData.filter(d => {
      const dateNum = parseInt(d.date)
      return dateNum >= currentDates.startYYYYMMDD && dateNum <= currentDates.endYYYYMMDD
    })
    const previousData = dailyData.filter(d => {
      const dateNum = parseInt(d.date)
      return dateNum >= previousDates.startYYYYMMDD && dateNum <= previousDates.endYYYYMMDD
    })
    
    const currentImpressions = currentData.reduce((sum, d) => sum + d.impressions, 0)
    const currentWeightedPosition = currentData.reduce((sum, d) => sum + (d.position * d.impressions), 0)
    const currentPosition = currentImpressions > 0 ? currentWeightedPosition / currentImpressions : 0
    
    const previousImpressions = previousData.reduce((sum, d) => sum + d.impressions, 0)
    const previousWeightedPosition = previousData.reduce((sum, d) => sum + (d.position * d.impressions), 0)
    const previousPosition = previousImpressions > 0 ? previousWeightedPosition / previousImpressions : 0
    
    // Calculate days count
    const currentDays = currentData.length
    const previousDays = previousData.length
    
    // Debug logging with detailed format matching GA
    console.log(`[GSC Average Position] ${label}:`)
    console.log(`  Current:  ${currentDates.startDate} to ${currentDates.endDate} (${currentDays} days) = ${currentPosition.toFixed(2)}`)
    console.log(`  Previous: ${previousDates.startDate} to ${previousDates.endDate} (${previousDays} days) = ${previousPosition.toFixed(2)}`)
    
    if (previousPosition > 0) {
      const change = ((currentPosition - previousPosition) / previousPosition) * 100
      const isIncrease = change < 0 // Lower position is better
      
      console.log(`  Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`)
      
      const result: ComparisonWindow = {
        current: currentPosition,
        previous: previousPosition,
        change: Math.abs(change),
        isIncrease,
        periodType: label,
        periodLabel: `${label} comparison`,
        currentPeriod: `${currentDates.startDate} to ${currentDates.endDate}`,
        previousPeriod: `${previousDates.startDate} to ${previousDates.endDate}`
      }
      
      if (isIncrease) {
        console.log(`  ✓ Selected ${label} (improved position)\n`)
        return result
      }
      
      if (!mostNeutralNegative || result.change < mostNeutralNegative.change) {
        mostNeutralNegative = result
      }
      
      console.log(`  ✗ Worsened, trying next window\n`)
      
      if (label === '6-month') {
        console.log(`  ✓ Selected ${mostNeutralNegative!.periodType} (most neutral negative)\n`)
        return mostNeutralNegative!
      }
    }
  }
  
  return mostNeutralNegative || {
    current: 0, previous: 0, change: 0, isIncrease: true,
    periodType: '1-month', periodLabel: '1-month comparison'
  }
}

/**
 * Fetch Search Console dashboard data with KPI calculations
 * Uses cache when available to reduce API calls
 * @param datasourceId - The datasource ID
 */
export async function fetchGSCDashboardData(
  datasourceId: string
): Promise<GSCDashboardData | null> {
  try {
    // Get site details from database
    const supabase = await createClient()
    const { data: site, error: siteError } = await supabase
      .from("google_search_console_sites")
      .select("site_url")
      .eq("datasource_id", datasourceId)
      .single()
    
    if (siteError || !site) {
      console.error("Site not found for datasource:", datasourceId, siteError)
      return null
    }
    
    const siteUrl = site.site_url
    
    // Use the same date calculation as GA for consistency
    const { startDate: startDateStr, endDate: endDateStr } = calculateDashboardDateRanges()
    
    console.log('[GSC Dashboard] Date ranges:', { startDateStr, endDateStr })
    
    // Check cache first (store KPI cards only since we have no graph)
    const resourceId = `${siteUrl}-kpi`
    const cachedData = await getCachedDashboardData(datasourceId, resourceId, startDateStr, endDateStr)
    if (cachedData) {
      console.log("✓ Returning cached GSC dashboard data")
      return cachedData as GSCDashboardData
    }
    
    // Cache miss - fetch from API (use the dates we already calculated)
    console.log("⟳ Fetching fresh GSC dashboard data from API")
    
    // Fetch Search Console data (it will call calculateDashboardDateRanges internally)
    const gscData = await fetchSearchConsoleData(siteUrl)
    
    // Calculate KPI cards
    const kpiCards = calculateKPICards(gscData.dailyData, endDateStr)
    
    const dashboardData: GSCDashboardData = {
      siteUrl: siteUrl,
      kpiCards: kpiCards
    }
    
    // Save to cache (fire and forget - don't wait)
    saveDashboardCache(datasourceId, resourceId, startDateStr, endDateStr, dashboardData)
      .catch(err => console.error("Failed to save cache:", err))
    
    return dashboardData
  } catch (error) {
    console.error("[GSC Dashboard] Error:", error)
    throw error
  }
}

