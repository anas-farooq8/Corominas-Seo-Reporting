"use server"

import { createClient } from "@/lib/supabase/server"
import { 
  fetchSEMrushDashboardData,
  type SEMrushParsedDailyData 
} from "@/lib/semrush/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"
import { selectBestComparisonWindow, type WindowResult } from "@/lib/utils/comparison-helpers"
import { calculateSemrushDateRanges } from "@/lib/utils/date-ranges"

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
  kpiCards: SEMrushKPICardData
  dateRanges: {
    startDate: string | undefined // undefined means all historical data
    endDate: string
  }
}

/**
 * Calculate KPI cards from daily data - returns best period for each metric
 */
function calculateKPICards(
  dailyData: SEMrushParsedDailyData[],
  endDate: string
): { kpiCards: SEMrushKPICardData, bestWindow: WindowResult } {
  console.log('\n=== SEMRUSH KPI CALCULATIONS ===')
  
  const bestWindow = selectBestComparisonWindow(
    dailyData, 
    endDate,
    (d) => d.totalKeywords,
    'SEMrush Total Keywords'
  )
  
  console.log('=== BEST WINDOW SELECTED ===')
  console.log(`Period: ${bestWindow.type}`)
  console.log(`  Current: ${bestWindow.currentValue.toFixed(0)}, Previous: ${bestWindow.previousValue.toFixed(0)}, Change: ${bestWindow.isIncrease ? '+' : '-'}${bestWindow.change.toFixed(2)}%`)
  console.log('================================\n')
  
  // Build KPI cards
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
 * Fetch SEMrush dashboard data
 * Uses cache when available to reduce API calls
 * Now fetches ALL historical data and stores it in cache
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
    
    // Use new date calculation to get ALL data until last completed month
    const { endDate: endDateStr } = calculateSemrushDateRanges()
    
    console.log('[SEMrush Dashboard] Fetching all data up to', endDateStr)
    
    // Check cache first (use endDate as both start and end for "all data" cache key)
    const cachedData = await getCachedDashboardData(datasourceId, domain, endDateStr, endDateStr)
    if (cachedData) {
      console.log('[SEMrush Dashboard] Cache hit - restoring data')
      // Restore totalKeywords getter to cached dailyData
      const dailyDataWithGetter = (cachedData.dailyData as any[]).map(addTotalKeywordsGetter)
      
      return {
        ...cachedData,
        dailyData: dailyDataWithGetter
      } as SEMrushDashboardData
    }
    
    // Cache miss - fetch ALL data from API
    console.log('[SEMrush Dashboard] Cache miss - fetching from API')
    const apiData = await fetchSEMrushDashboardData(domain, undefined, endDateStr, "us", true)

    console.log('[SEMrush Dashboard] Fetched', apiData.dailyData.length, 'days of data')
    
    // Calculate KPI cards using all data
    const { kpiCards, bestWindow } = calculateKPICards(apiData.dailyData, endDateStr)
    
    // Store ALL data (not filtered) - we'll filter on the frontend based on selected period
    // Remove totalKeywords from each day before caching (it's a computed field)
    const dailyDataForCache = apiData.dailyData.map(({ totalKeywords, ...rest }) => rest)

    const dashboardData: SEMrushDashboardData = {
      domain: domain,
      dailyData: apiData.dailyData, // ALL data with getter for runtime use
      kpiCards: kpiCards, // Best period KPI data
      dateRanges: {
        startDate: undefined, // No start date - all historical data
        endDate: endDateStr
      }
    }
    
    // Create cache version without totalKeywords
    const cacheData = {
      domain: domain,
      dailyData: dailyDataForCache, // ALL data without totalKeywords
      kpiCards: kpiCards,
      dateRanges: {
        startDate: undefined, // No start date - all historical data
        endDate: endDateStr
      }
    }
    
    // Save to cache (fire and forget - don't wait) - use endDate as both start and end
    saveDashboardCache(datasourceId, domain, endDateStr, endDateStr, cacheData)
      .catch(err => console.error("Failed to save cache:", err))
    
    return dashboardData
  } catch (error) {
    console.error("[SEMrush Dashboard] Error:", error)
    throw error
  }
}

