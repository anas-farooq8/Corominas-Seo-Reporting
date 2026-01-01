"use server"

import { createClient } from "@/lib/supabase/server"
import { 
  fetchSEMrushDashboardData,
  type SEMrushParsedDailyData 
} from "@/lib/semrush/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"

/**
 * Helper to compute totalKeywords from a day object
 */
function addTotalKeywordsGetter(day: any) {
  return {
    ...day,
    get totalKeywords() {
      return day.top3 + day.top4to10 + day.top11to20 + 
             day.top21to50 + day.top51to100 + 
             day.aiOverviews + day.serpFunctions
    }
  }
}

/**
 * KPI Card Data for SEMrush metrics
 */
export interface SEMrushKPICardData {
  totalRankingKeywords: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodType: '1-month' | '3-month' | '6-month'
    periodLabel: string
  }
}

export interface SEMrushDashboardData {
  domain: string
  dailyData: SEMrushParsedDailyData[]
  dateRanges: {
    startDate: string
    endDate: string
  }
  kpiCards: SEMrushKPICardData
}

/**
 * Calculate best comparison window and return its details
 */
function calculateBestWindow(
  dailyData: SEMrushParsedDailyData[],
  endDate: string
): {
  type: '1-month' | '3-month' | '6-month'
  currentPeriodStart: string
  currentPeriodEnd: string
  previousPeriodStart: string
  previousPeriodEnd: string
  currentValue: number
  previousValue: number
  change: number
  isIncrease: boolean
  currentStartYYYYMMDD: number
  currentEndYYYYMMDD: number
} {
  const windows: Array<{ months: number, label: '1-month' | '3-month' | '6-month' }> = [
    { months: 1, label: '1-month' },
    { months: 3, label: '3-month' },
    { months: 6, label: '6-month' },
  ]
  
  const comparisons = windows.map(({ months, label }) => {
    const { current, previous, dates, currentStartYYYYMMDD, currentEndYYYYMMDD } = getWindowComparison(
      dailyData, 
      endDate, 
      months, 
      (d) => d.totalKeywords
    )
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0
    
    return {
      type: label,
      currentPeriodStart: dates.currentStart,
      currentPeriodEnd: dates.currentEnd,
      previousPeriodStart: dates.previousStart,
      previousPeriodEnd: dates.previousEnd,
      currentValue: current,
      previousValue: previous,
      change: Math.abs(change),
      isIncrease: change >= 0,
      currentStartYYYYMMDD,
      currentEndYYYYMMDD
    }
  })
  
  // Find best window (highest positive change, or least negative if all negative)
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

/**
 * Calculate KPI cards from daily data - returns best period for each metric
 * Follows the same pattern as Page 4 GSC
 */
function calculateKPICards(
  dailyData: SEMrushParsedDailyData[],
  endDate: string
): { kpiCards: SEMrushKPICardData, bestWindow: any } {

  
  const bestWindow = calculateBestWindow(dailyData, endDate)
  
  // Build KPI cards following GSC pattern
  const kpiCards: SEMrushKPICardData = {
    totalRankingKeywords: {
      current: bestWindow.currentValue,
      previous: bestWindow.previousValue,
      change: bestWindow.change,
      isIncrease: bestWindow.isIncrease,
      periodType: bestWindow.type,
      periodLabel: `${bestWindow.type} comparison`
    }
  }
  
  return { kpiCards, bestWindow }
}

/**
 * Get window comparison data with dates
 */
function getWindowComparison(
  dailyData: SEMrushParsedDailyData[],
  endDate: string,
  windowMonths: number,
  valueExtractor: (item: SEMrushParsedDailyData) => number
): { 
  current: number
  previous: number
  dates: { 
    currentStart: string
    currentEnd: string
    previousStart: string
    previousEnd: string 
  }
  currentStartYYYYMMDD: number
  currentEndYYYYMMDD: number
} {
  const dataEnd = new Date(endDate)
  const lastMonth = dataEnd.getMonth()
  const lastYear = dataEnd.getFullYear()
  
  // Current window
  const currentEndMonth = lastMonth
  const currentEndYear = lastYear
  const currentEndDate = new Date(currentEndYear, currentEndMonth + 1, 0)
  const currentStartDate = new Date(currentEndYear, currentEndMonth - windowMonths + 1, 1)
  
  // Previous window
  const previousEndMonth = currentEndMonth - windowMonths
  const previousEndYear = currentEndYear + Math.floor(previousEndMonth / 12)
  const normalizedPrevEndMonth = ((previousEndMonth % 12) + 12) % 12
  const previousEndDate = new Date(previousEndYear, normalizedPrevEndMonth + 1, 0)
  const previousStartDate = new Date(previousEndYear, normalizedPrevEndMonth - windowMonths + 1, 1)
  
  const formatDate = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  
  const formatDateYYYYMMDD = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return parseInt(`${y}${m}${d}`)
  }
  
  const currentStartYYYYMMDD = formatDateYYYYMMDD(currentStartDate)
  const currentEndYYYYMMDD = formatDateYYYYMMDD(currentEndDate)
  const previousStartYYYYMMDD = formatDateYYYYMMDD(previousStartDate)
  const previousEndYYYYMMDD = formatDateYYYYMMDD(previousEndDate)
  
  const currentData = dailyData.filter(d => {
    const dateNum = parseInt(d.date)
    return dateNum >= currentStartYYYYMMDD && dateNum <= currentEndYYYYMMDD
  })
  
  const previousData = dailyData.filter(d => {
    const dateNum = parseInt(d.date)
    return dateNum >= previousStartYYYYMMDD && dateNum <= previousEndYYYYMMDD
  })
  
  const currentSum = currentData.reduce((sum, d) => sum + valueExtractor(d), 0)
  const previousSum = previousData.reduce((sum, d) => sum + valueExtractor(d), 0)
  
  const currentAvg = currentData.length > 0 ? currentSum / windowMonths : 0
  const previousAvg = previousData.length > 0 ? previousSum / windowMonths : 0
  
  return {
    current: currentAvg,
    previous: previousAvg,
    dates: {
      currentStart: formatDate(currentStartDate),
      currentEnd: formatDate(currentEndDate),
      previousStart: formatDate(previousStartDate),
      previousEnd: formatDate(previousEndDate)
    },
    currentStartYYYYMMDD,
    currentEndYYYYMMDD
  }
}

/**
 * Fetch SEMrush dashboard data
 * Uses cache when available to reduce API calls
 * @param datasourceId - The datasource ID
 */
export async function fetchSEMrushDashboard(
  datasourceId: string
): Promise<SEMrushDashboardData | null> {
  try {
    // Get domain from database
    const supabase = await createClient()
    const { data: semrushDomain, error: domainError } = await supabase
      .from("semrush_domains")
      .select("domain")
      .eq("datasource_id", datasourceId)
      .single()
    
    if (domainError || !semrushDomain) {
      console.error("Domain not found for datasource:", datasourceId, domainError)
      return null
    }
    
    const domain = semrushDomain.domain
    
    // Calculate date ranges once (12 months of data - last completed month going back 12 months)
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
    const cachedData = await getCachedDashboardData(datasourceId, domain, startDateStr, endDateStr)
    if (cachedData) {
      // Restore totalKeywords getter to cached dailyData
      const dailyDataWithGetter = (cachedData.dailyData as any[]).map(addTotalKeywordsGetter)
      
      return {
        ...cachedData,
        dailyData: dailyDataWithGetter
      } as SEMrushDashboardData
    }
    
    // Cache miss - fetch from API (pass the calculated dates to avoid duplication)
    const apiData = await fetchSEMrushDashboardData(domain, startDateStr, endDateStr)

    // Calculate KPI cards and get best window
    const { kpiCards, bestWindow } = calculateKPICards(apiData.dailyData, endDateStr)
    
    // Filter dailyData to only include the best period's current window
    const filteredDailyData = apiData.dailyData.filter(d => {
      const dateNum = parseInt(d.date)
      return dateNum >= bestWindow.currentStartYYYYMMDD && dateNum <= bestWindow.currentEndYYYYMMDD
    })
    
    // Remove totalKeywords from each day before caching (it's a computed field)
    const dailyDataForCache = filteredDailyData.map(({ totalKeywords, ...rest }) => rest)

    const dashboardData: SEMrushDashboardData = {
      domain: domain,
      dailyData: filteredDailyData, // Original data with getter for runtime use
      dateRanges: {
        startDate: bestWindow.currentPeriodStart, // Actual displayed range
        endDate: bestWindow.currentPeriodEnd
      },
      kpiCards: kpiCards // Best period KPI data
    }
    
    // Create cache version without totalKeywords
    const cacheData = {
      domain: domain,
      dailyData: dailyDataForCache, // Without totalKeywords
      dateRanges: dashboardData.dateRanges,
      kpiCards: kpiCards
    }
    
    // Save to cache (fire and forget - don't wait)
    saveDashboardCache(datasourceId, domain, startDateStr, endDateStr, cacheData)
      .catch(err => console.error("Failed to save cache:", err))
    
    return dashboardData
  } catch (error) {
    console.error("[SEMrush Dashboard] Error:", error)
    throw error
  }
}

