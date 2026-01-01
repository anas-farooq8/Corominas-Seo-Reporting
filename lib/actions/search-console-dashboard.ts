"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchSearchConsoleData, type GSCDashboardResponse, type GSCDailyData } from "@/lib/google-search-console/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"
import { calculateGADateRanges } from "@/lib/google-analytics/api"

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
  console.log(`End date for calculations: ${endDate}`)
  
  // Calculate window totals (same logic as test script)
  const clicksComparison = calculateMetricComparison(dailyData, endDate, 'clicks')
  const impressionsComparison = calculateMetricComparison(dailyData, endDate, 'impressions')
  const ctrComparison = calculateCTRComparison(dailyData, endDate)
  const positionComparison = calculatePositionComparison(dailyData, endDate)
  
  console.log('\n=== BEST WINDOWS SELECTED ===')
  console.log(`Clicks: ${clicksComparison.periodType}`)
  console.log(`  Period: ${clicksComparison.currentPeriod || 'N/A'} vs ${clicksComparison.previousPeriod || 'N/A'}`)
  console.log(`  Current: ${clicksComparison.current.toFixed(0)}, Previous: ${clicksComparison.previous.toFixed(0)}, Change: ${clicksComparison.isIncrease ? '+' : ''}${clicksComparison.change.toFixed(2)}%`)
  
  console.log(`Impressions: ${impressionsComparison.periodType}`)
  console.log(`  Period: ${impressionsComparison.currentPeriod || 'N/A'} vs ${impressionsComparison.previousPeriod || 'N/A'}`)
  console.log(`  Current: ${impressionsComparison.current.toFixed(0)}, Previous: ${impressionsComparison.previous.toFixed(0)}, Change: ${impressionsComparison.isIncrease ? '+' : ''}${impressionsComparison.change.toFixed(2)}%`)
  
  console.log(`CTR: ${ctrComparison.periodType}`)
  console.log(`  Period: ${ctrComparison.currentPeriod || 'N/A'} vs ${ctrComparison.previousPeriod || 'N/A'}`)
  console.log(`  Current: ${ctrComparison.current.toFixed(2)}%, Previous: ${ctrComparison.previous.toFixed(2)}%, Change: ${ctrComparison.isIncrease ? '+' : ''}${ctrComparison.change.toFixed(2)}%`)
  
  console.log(`Position: ${positionComparison.periodType}`)
  console.log(`  Period: ${positionComparison.currentPeriod || 'N/A'} vs ${positionComparison.previousPeriod || 'N/A'}`)
  console.log(`  Current: ${positionComparison.current.toFixed(2)}, Previous: ${positionComparison.previous.toFixed(2)}, Change: ${positionComparison.isIncrease ? '+' : ''}${positionComparison.change.toFixed(2)}%`)
  console.log('=====================================\n')
  
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
 */
function calculateMetricComparison(dailyData: GSCDailyData[], endDate: string, metric: 'clicks' | 'impressions') {
  const windows: Array<{ months: number, label: '1-month' | '3-month' | '6-month' }> = [
    { months: 1, label: '1-month' },
    { months: 3, label: '3-month' },
    { months: 6, label: '6-month' },
  ]
  
  const comparisons: ComparisonWindow[] = []
  
  windows.forEach(({ months, label }) => {
    const { data: currentData, startDate: currentStart, endDate: currentEnd } = getWindowDataWithDates(dailyData, endDate, 0, months)
    const { data: previousData, startDate: previousStart, endDate: previousEnd } = getWindowDataWithDates(dailyData, endDate, months, months)
    
    const currentTotal = currentData.reduce((sum, d) => sum + d[metric], 0)
    const previousTotal = previousData.reduce((sum, d) => sum + d[metric], 0)
    
    console.log(`[GSC ${metric}] ${label}:`)
    console.log(`  Current:  ${currentStart} to ${currentEnd} (${currentData.length} days) = ${currentTotal.toFixed(0)}`)
    console.log(`  Previous: ${previousStart} to ${previousEnd} (${previousData.length} days) = ${previousTotal.toFixed(0)}`)
    
    if (previousTotal > 0) {
      const change = ((currentTotal - previousTotal) / previousTotal) * 100
      comparisons.push({
        current: currentTotal,
        previous: previousTotal,
        change: Math.abs(change),
        isIncrease: change >= 0,
        periodType: label,
        periodLabel: `${label} comparison`,
        currentPeriod: `${currentStart} to ${currentEnd}`,
        previousPeriod: `${previousStart} to ${previousEnd}`
      })
      
      console.log(`  Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%\n`)
    } else {
      console.log(`  SKIPPED (previous total is 0)\n`)
    }
  })
  
  return selectBestFromComparisons(comparisons)
}

/**
 * Calculate CTR comparison (total clicks / total impressions) for each window
 */
function calculateCTRComparison(dailyData: GSCDailyData[], endDate: string) {
  const windows: Array<{ months: number, label: '1-month' | '3-month' | '6-month' }> = [
    { months: 1, label: '1-month' },
    { months: 3, label: '3-month' },
    { months: 6, label: '6-month' },
  ]
  
  const comparisons: ComparisonWindow[] = []
  
  windows.forEach(({ months, label }) => {
    const { data: currentData, startDate: currentStart, endDate: currentEnd } = getWindowDataWithDates(dailyData, endDate, 0, months)
    const { data: previousData, startDate: previousStart, endDate: previousEnd } = getWindowDataWithDates(dailyData, endDate, months, months)
    
    const currentClicks = currentData.reduce((sum, d) => sum + d.clicks, 0)
    const currentImpressions = currentData.reduce((sum, d) => sum + d.impressions, 0)
    const currentCTR = currentImpressions > 0 ? (currentClicks / currentImpressions) * 100 : 0
    
    const previousClicks = previousData.reduce((sum, d) => sum + d.clicks, 0)
    const previousImpressions = previousData.reduce((sum, d) => sum + d.impressions, 0)
    const previousCTR = previousImpressions > 0 ? (previousClicks / previousImpressions) * 100 : 0
    
    console.log(`[GSC CTR] ${label}:`)
    console.log(`  Current:  ${currentStart} to ${currentEnd} = ${currentCTR.toFixed(2)}%`)
    console.log(`  Previous: ${previousStart} to ${previousEnd} = ${previousCTR.toFixed(2)}%`)
    
    if (previousCTR > 0) {
      const change = ((currentCTR - previousCTR) / previousCTR) * 100
      comparisons.push({
        current: currentCTR,
        previous: previousCTR,
        change: Math.abs(change),
        isIncrease: change >= 0,
        periodType: label,
        periodLabel: `${label} comparison`,
        currentPeriod: `${currentStart} to ${currentEnd}`,
        previousPeriod: `${previousStart} to ${previousEnd}`
      })
      
      console.log(`  Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%\n`)
    }
  })
  
  return selectBestFromComparisons(comparisons)
}

/**
 * Calculate position comparison (weighted by impressions) for each window
 */
function calculatePositionComparison(dailyData: GSCDailyData[], endDate: string) {
  const windows: Array<{ months: number, label: '1-month' | '3-month' | '6-month' }> = [
    { months: 1, label: '1-month' },
    { months: 3, label: '3-month' },
    { months: 6, label: '6-month' },
  ]
  
  const comparisons: ComparisonWindow[] = []
  
  windows.forEach(({ months, label }) => {
    const { data: currentData, startDate: currentStart, endDate: currentEnd } = getWindowDataWithDates(dailyData, endDate, 0, months)
    const { data: previousData, startDate: previousStart, endDate: previousEnd } = getWindowDataWithDates(dailyData, endDate, months, months)
    
    const currentImpressions = currentData.reduce((sum, d) => sum + d.impressions, 0)
    const currentWeightedPosition = currentData.reduce((sum, d) => sum + (d.position * d.impressions), 0)
    const currentPosition = currentImpressions > 0 ? currentWeightedPosition / currentImpressions : 0
    
    const previousImpressions = previousData.reduce((sum, d) => sum + d.impressions, 0)
    const previousWeightedPosition = previousData.reduce((sum, d) => sum + (d.position * d.impressions), 0)
    const previousPosition = previousImpressions > 0 ? previousWeightedPosition / previousImpressions : 0
    
    console.log(`[GSC Position] ${label}:`)
    console.log(`  Current:  ${currentStart} to ${currentEnd} = ${currentPosition.toFixed(2)}`)
    console.log(`  Previous: ${previousStart} to ${previousEnd} = ${previousPosition.toFixed(2)}`)
    
    if (previousPosition > 0) {
      const change = ((currentPosition - previousPosition) / previousPosition) * 100
      // For position, lower is better, so flip isIncrease
      comparisons.push({
        current: currentPosition,
        previous: previousPosition,
        change: Math.abs(change),
        isIncrease: change < 0, // Lower position is improvement
        periodType: label,
        periodLabel: `${label} comparison`,
        currentPeriod: `${currentStart} to ${currentEnd}`,
        previousPeriod: `${previousStart} to ${previousEnd}`
      })
      
      console.log(`  Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}% (${change < 0 ? 'IMPROVED' : 'WORSENED'})\n`)
    }
  })
  
  return selectBestFromComparisons(comparisons)
}

/**
 * Get data for a specific window with date information
 * Fixed: Proper month-based windows without date rollover issues
 */
function getWindowDataWithDates(dailyData: GSCDailyData[], endDate: string, monthsBack: number, windowMonths: number): {
  data: GSCDailyData[]
  startDate: string
  endDate: string
} {
  // endDate is the last day of the data period (e.g., 2025-12-31)
  const dataEnd = new Date(endDate)
  
  // Get the month and year of the last complete month
  const lastMonth = dataEnd.getMonth() // 11 for December
  const lastYear = dataEnd.getFullYear() // 2025
  
  // Calculate which month we want (going back monthsBack months from the last month)
  // For 1-month current (monthsBack=0): December
  // For 1-month previous (monthsBack=1): November
  // For 3-month previous (monthsBack=3): September
  const targetMonth = lastMonth - monthsBack
  const targetYear = lastYear + Math.floor(targetMonth / 12)
  const normalizedMonth = ((targetMonth % 12) + 12) % 12
  
  // Get the last day of the target month (end of window)
  const windowEndLastDay = new Date(targetYear, normalizedMonth + 1, 0)
  
  // Calculate the start of the window (go back windowMonths-1 from target month)
  const startMonth = normalizedMonth - windowMonths + 1
  const startYear = targetYear + Math.floor(startMonth / 12)
  const normalizedStartMonth = ((startMonth % 12) + 12) % 12
  const windowStart = new Date(startYear, normalizedStartMonth, 1)
  
  const startYYYYMMDD = parseInt(
    windowStart.getFullYear() + 
    String(windowStart.getMonth() + 1).padStart(2, '0') + 
    String(windowStart.getDate()).padStart(2, '0')
  )
  
  const endYYYYMMDD = parseInt(
    windowEndLastDay.getFullYear() + 
    String(windowEndLastDay.getMonth() + 1).padStart(2, '0') + 
    String(windowEndLastDay.getDate()).padStart(2, '0')
  )
  
  const formatDate = (yyyymmdd: number) => {
    const str = yyyymmdd.toString()
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`
  }
  
  const filteredData = dailyData.filter(item => {
    const itemDate = parseInt(item.date)
    return itemDate >= startYYYYMMDD && itemDate <= endYYYYMMDD
  })
  
  return {
    data: filteredData,
    startDate: formatDate(startYYYYMMDD),
    endDate: formatDate(endYYYYMMDD)
  }
}

/**
 * Select best comparison from array of comparisons
 */
function selectBestFromComparisons(comparisons: ComparisonWindow[]): ComparisonWindow {
  if (comparisons.length === 0) {
    return {
      current: 0,
      previous: 0,
      change: 0,
      isIncrease: true,
      periodType: '1-month',
      periodLabel: '1-month comparison'
    }
  }
  
  const positiveComparisons = comparisons.filter(c => c.isIncrease)
  
  if (positiveComparisons.length > 0) {
    return positiveComparisons.reduce((best, current) => 
      current.change > best.change ? current : best
    )
  } else {
    return comparisons.reduce((best, current) => 
      current.change < best.change ? current : best
    )
  }
}

interface ComparisonWindow {
  current: number
  previous: number
  change: number
  isIncrease: boolean
  periodType: '1-month' | '3-month' | '6-month'
  periodLabel: string
  currentPeriod?: string
  previousPeriod?: string
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
    const { startDate: startDateStr, endDate: endDateStr } = calculateGADateRanges()
    
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
    
    // Fetch Search Console data (it will call calculateGADateRanges internally)
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

