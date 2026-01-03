"use server"

import { createClient } from "@/lib/supabase/server"
import { 
  fetchSEMrushDashboardData,
  type SEMrushParsedDailyData 
} from "@/lib/semrush/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"
import { selectBestComparisonWindow, type WindowResult } from "@/lib/utils/comparison-helpers"

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
}

/**
 * Calculate KPI cards from daily data - returns best period for each metric
 */
function calculateKPICards(
  dailyData: SEMrushParsedDailyData[],
  endDate: string
): { kpiCards: SEMrushKPICardData, bestWindow: WindowResult } {
  const bestWindow = selectBestComparisonWindow(
    dailyData, 
    endDate,
    (d) => d.totalKeywords
  )
  
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
      kpiCards: kpiCards // Best period KPI data
    }
    
    // Create cache version without totalKeywords
    const cacheData = {
      domain: domain,
      dailyData: dailyDataForCache, // Without totalKeywords
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

