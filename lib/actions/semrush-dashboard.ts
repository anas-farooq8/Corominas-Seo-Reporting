"use server"

import { createClient } from "@/lib/supabase/server"
import { 
  fetchSEMrushDashboardData,
  type SEMrushParsedDailyData 
} from "@/lib/semrush/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"

export interface SEMrushDashboardData {
  domain: string
  dailyData: SEMrushParsedDailyData[]
  lastMonthTotal: number
  previousMonthTotal: number
  dateRanges: {
    startDate: string
    endDate: string
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
    const cachedData = await getCachedDashboardData(datasourceId, domain, startDateStr, endDateStr)
    if (cachedData) {
      console.log("✓ Returning cached SEMrush dashboard data")
      return cachedData as SEMrushDashboardData
    }
    
    // Cache miss - fetch from API
    console.log("⟳ Fetching fresh SEMrush dashboard data from API")
    
    // Fetch data from SEMrush API
    const apiData = await fetchSEMrushDashboardData(domain)

    const dashboardData: SEMrushDashboardData = {
      domain: domain,
      dailyData: apiData.dailyData,
      lastMonthTotal: apiData.lastMonthTotal,
      previousMonthTotal: apiData.previousMonthTotal,
      dateRanges: apiData.dateRanges
    }
    
    // Save to cache (fire and forget - don't wait)
    saveDashboardCache(datasourceId, domain, startDateStr, endDateStr, dashboardData)
      .catch(err => console.error("Failed to save cache:", err))
    
    return dashboardData
  } catch (error) {
    console.error("[SEMrush Dashboard] Error:", error)
    throw error
  }
}

