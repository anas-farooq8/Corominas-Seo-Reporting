"use server"

import { createClient } from "@/lib/supabase/server"
import { 
  fetchTrackingDetail,
  fetchTrackingStats
} from "@/lib/mangools/api"
import {
  compareMonthlyKeywords,
  getTopKeywords,
  getTopWinners,
  getNewRankings,
  getControlledLosers,
  type TopKeyword,
  type RankChangeKeyword,
  type NewRanking,
} from "@/lib/mangools/dashboard-utils"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"
import { 
  calculateMangoolsDashboardRanges,
  formatMangoolsDateRange,
  getLast2CompletedMonthsForAPI
} from "@/lib/utils/date-ranges"
import type { DashboardOptions } from "@/lib/api/dashboard-handler"

/**
 * KPI Card Data for Mangools metrics
 */
export interface MangoolsKPICardData {
  totalKeywords: number
  topWinnersCount: number
  newRankingsCount: number
}

export interface MangoolsDashboardData {
  domain: string
  location: string
  dateRanges: {
    monthAStart: string
    monthAEnd: string
    monthBStart: string
    monthBEnd: string
    monthAName: string // e.g., "Oct Year"
    monthBName: string // e.g., "Nov Year"
  }
  kpiCards: MangoolsKPICardData
  topKeywords: TopKeyword[]           // All keywords
  topWinners: RankChangeKeyword[]     // Top 5 only
  newRankings: NewRanking[]           // Top 5 only
  controlledLosers: RankChangeKeyword[] // Top 5 only
  isLimited?: boolean // True if tracking is new and showing partial data
}

/**
 * Fetch all data needed for the Mangools dashboard
 * Uses cache when available to reduce API calls
 * @param datasourceId - The datasource ID
 */
export async function fetchMangoolsDashboardData(
  datasourceId: string,
  options?: DashboardOptions
): Promise<MangoolsDashboardData | null> {
  console.log("[Mangools Debug] Starting fetchMangoolsDashboardData for datasourceId:", datasourceId)
  
  try {
    // Get the tracking_id and tracking_created_at from database
    const supabase = await createClient()
    const { data: domain, error: domainError } = await supabase
      .from("mangools_domains")
      .select("tracking_id, tracking_created_at, domain")
      .eq("datasource_id", datasourceId)
      .single()
    
    if (domainError || !domain) {
      console.error("[Mangools Debug] Domain not found for datasource:", datasourceId, domainError)
      return null
    }
    
    const trackingId = domain.tracking_id
    console.log("[Mangools Debug] Found trackingId:", trackingId)
    console.log("[Mangools Debug] Tracking created at:", domain.tracking_created_at || 'Not available')
    
    // Get target date range (what we WANT to compare - last 2 completed months)
    const targetRange = getLast2CompletedMonthsForAPI()
    const cacheStartDate = targetRange.monthAStart  // e.g., "2025-11-01"
    const cacheEndDate = targetRange.monthBEnd      // e.g., "2025-12-31"
    
    console.log("[Mangools Debug] Target range (for cache):", cacheStartDate, "to", cacheEndDate)
    
    // Check cache first (using target dates, not scenario dates)
    const cachedData = await getCachedDashboardData(datasourceId, trackingId, cacheStartDate, cacheEndDate)
    if (cachedData) {
      console.log("[Mangools Debug] Cache hit - returning cached data")
      return cachedData as MangoolsDashboardData
    }
    console.log("[Mangools Debug] Cache miss - fetching from API")
    
    // Calculate date ranges based on tracking creation date
    const ranges = calculateMangoolsDashboardRanges(domain.tracking_created_at, options?.today)
    
    console.log("[Mangools Debug] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`[Mangools Debug] 📍 SCENARIO ${ranges.scenario}`)
    console.log("[Mangools Debug] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("[Mangools Debug] API calls:", ranges.useSameDataForBoth ? '1' : '2')
    console.log("[Mangools Debug] Limited data:", ranges.isLimitedData)
    
    const { monthAStart, monthAEnd, monthBStart, monthBEnd, useSameDataForBoth, isLimitedData } = ranges
    
    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const fromA = formatDate(monthAStart)
    const toB = formatDate(monthBEnd)
    const toA = formatDate(monthAEnd)
    const fromB = formatDate(monthBStart)
    
    // Debug: Show final calculated date ranges
    console.log("[Mangools Debug] ========================================")
    console.log("[Mangools Debug] ACTUAL API CALL DATES:")
    console.log("[Mangools Debug] Month A: ", fromA, "to", toA)
    console.log("[Mangools Debug] Month B: ", fromB, "to", toB)
    if (useSameDataForBoth) {
      console.log("[Mangools Debug] ⚠️  SAME DATA MODE: Both months will use identical API response")
    }
    console.log("[Mangools Debug] ========================================")
    
    // Fetch tracking detail to get keyword names and total count
    const trackingDetail = await fetchTrackingDetail(trackingId)
    console.log("[Mangools Debug] Fetched tracking detail:", trackingDetail.keywords.length, "keywords")
    
    // Fetch stats - either 1 call or 2 calls depending on scenario
    let monthA, monthB
    
    if (useSameDataForBoth) {
      // Scenario 2a: Make only 1 API call and use same data for both months
      console.log("[Mangools Debug] 🔄 Making 1 API call: fetchTrackingStats(", fromA, "to", toB, ")")
      const stats = await fetchTrackingStats(trackingId, fromA, toB)
      monthA = stats
      monthB = stats // Use same data for both
      console.log("[Mangools Debug] ✅ Stats fetched:", stats.keywords.length, "keywords (reused for both months)")
    } else {
      // Scenarios 1 & 2b: Make 2 API calls for comparison
      console.log("[Mangools Debug] 🔄 Making 2 API calls in parallel:")
      console.log("[Mangools Debug]   → Call 1: fetchTrackingStats(", fromA, "to", toA, ")")
      console.log("[Mangools Debug]   → Call 2: fetchTrackingStats(", fromB, "to", toB, ")")
      const results = await Promise.all([
        fetchTrackingStats(trackingId, fromA, toA),
        fetchTrackingStats(trackingId, fromB, toB),
      ])
      monthA = results[0]
      monthB = results[1]
      console.log("[Mangools Debug] ✅ Stats fetched: Month A:", monthA.keywords.length, "keywords | Month B:", monthB.keywords.length, "keywords")
    }
    
    // Use keyword names from detail endpoint to populate comparisons
    const keywordsData = trackingDetail.keywords.map(kw => ({
      _id: kw._id,
      kw: kw.kw,
    }))

    // Compare monthly data
    const comparisons = compareMonthlyKeywords(monthA, monthB, keywordsData)
    
    // Generate all tables - compute full lists first
    const topKeywords = getTopKeywords(comparisons) // All keywords
    const allTopWinners = getTopWinners(comparisons) // All winners
    const allControlledLosers = getControlledLosers(comparisons) // All losers
    const allNewRankings = getNewRankings(comparisons) // All new rankings
    
    // Calculate KPI card data (counts)
    const kpiCards: MangoolsKPICardData = {
      totalKeywords: trackingDetail.keywords.length,
      topWinnersCount: allTopWinners.length,
      newRankingsCount: allNewRankings.length
    }
    
    // Store only top 5 for winners, losers, and new rankings
    const topWinners = allTopWinners.slice(0, 5)
    const controlledLosers = allControlledLosers.slice(0, 5)
    const newRankings = allNewRankings.slice(0, 5)
    
    // Format date ranges for display
    const monthAName = formatMangoolsDateRange(monthAStart, monthAEnd)
    const monthBName = formatMangoolsDateRange(monthBStart, monthBEnd)

    const dashboardData: MangoolsDashboardData = {
      domain: trackingDetail.tracking.domain,
      location: trackingDetail.tracking.location.label,
      dateRanges: {
        monthAStart: fromA,
        monthAEnd: toA,
        monthBStart: fromB,
        monthBEnd: toB,
        monthAName,
        monthBName,
      },
      kpiCards,
      topKeywords,      // All keywords
      topWinners,       // Top 5 only
      newRankings,      // Top 5 only
      controlledLosers, // Top 5 only
      ...(isLimitedData && { isLimited: true })
    }
    
    // Save to cache using target dates (fire and forget - don't wait)
    saveDashboardCache(datasourceId, trackingId, cacheStartDate, cacheEndDate, dashboardData)
      .catch(err => console.error("[Mangools Debug] Failed to save cache:", err))
    
    console.log("[Mangools Debug] Dashboard data fetched successfully")
    return dashboardData
  } catch (error) {
    console.error("[Mangools Debug] Error fetching Mangools dashboard data:", error)
    throw error
  }
}
