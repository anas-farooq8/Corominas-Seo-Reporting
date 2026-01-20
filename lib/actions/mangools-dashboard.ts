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
  limitedData?: {
    isNew: boolean
    createdAt?: string
    message?: string
  }
}

/**
 * Fetch all data needed for the Mangools dashboard
 * Uses cache when available to reduce API calls
 * @param datasourceId - The datasource ID
 */
export async function fetchMangoolsDashboardData(
  datasourceId: string
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
    
    // Calculate date ranges for the last 2 completed months
    const today = new Date()
    
    // Check if tracking is too new (created less than 60 days ago)
    let trackingCreatedDate: Date | null = null
    let daysSinceCreation = Infinity
    
    if (domain.tracking_created_at) {
      trackingCreatedDate = new Date(domain.tracking_created_at)
      daysSinceCreation = Math.floor((today.getTime() - trackingCreatedDate.getTime()) / (1000 * 60 * 60 * 24))
      console.log("[Mangools Debug] Tracking created:", trackingCreatedDate.toISOString(), `(${daysSinceCreation} days ago)`)
    }
    
    // Month B: Previous complete month (the month before current month)
    let monthBStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    let monthBEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    
    // Month A: The month before Month B
    let monthAStart = new Date(today.getFullYear(), today.getMonth() - 2, 1)
    let monthAEnd = new Date(today.getFullYear(), today.getMonth() - 1, 0)
    
    // Track if we're dealing with limited data
    let isLimitedData = false
    let limitedDataMessage = ""
    let useSameDataForBoth = false
    
    // Adjust date ranges based on tracking age
    if (trackingCreatedDate && daysSinceCreation < 30) {
      // SCENARIO 1: Very new tracking (< 30 days)
      console.log("[Mangools Debug] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("[Mangools Debug] 📍 SCENARIO 1: Tracking < 30 days old")
      console.log("[Mangools Debug] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("[Mangools Debug] Strategy: 1 API call, same data for both months")
      
      monthAStart = new Date(trackingCreatedDate)
      monthAEnd = new Date(today)
      monthBStart = new Date(trackingCreatedDate)
      monthBEnd = new Date(today)
      useSameDataForBoth = true
      isLimitedData = true
      limitedDataMessage = `This tracking was recently added (${daysSinceCreation} days ago). Historical comparison data is limited.`
      
    } else if (trackingCreatedDate && daysSinceCreation < 60) {
      // SCENARIO 2: Tracking 30-60 days old
      console.log("[Mangools Debug] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("[Mangools Debug] 📍 SCENARIO 2: Tracking 30-60 days old")
      console.log("[Mangools Debug] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("[Mangools Debug] Strategy: 2 API calls, split from creation date")
      
      // Month A: Creation date to end of that month
      monthAStart = new Date(trackingCreatedDate)
      monthAEnd = new Date(trackingCreatedDate.getFullYear(), trackingCreatedDate.getMonth() + 1, 0)
      
      // Month B: Next month to today
      monthBStart = new Date(trackingCreatedDate.getFullYear(), trackingCreatedDate.getMonth() + 1, 1)
      monthBEnd = new Date(today)
      isLimitedData = true
      limitedDataMessage = `This tracking was added ${daysSinceCreation} days ago. Showing available data from tracking start date.`
      
    } else {
      // SCENARIO 3: Tracking 60+ days old OR no creation date
      // Use normal logic (last 2 complete months)
      console.log("[Mangools Debug] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("[Mangools Debug] 📍 SCENARIO 3: Normal tracking (60+ days or legacy)")
      console.log("[Mangools Debug] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("[Mangools Debug] Strategy: 2 API calls, last 2 complete months")
      // monthAStart, monthAEnd, monthBStart, monthBEnd already set to defaults above
    }
    
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
    console.log("[Mangools Debug] FINAL DATE RANGES:")
    console.log("[Mangools Debug] Month A: ", fromA, "to", toA)
    console.log("[Mangools Debug] Month B: ", fromB, "to", toB)
    if (useSameDataForBoth) {
      console.log("[Mangools Debug] ⚠️  SAME DATA MODE: Both months will use identical API response")
    }
    console.log("[Mangools Debug] ========================================")
    
    // Check cache first
    const cachedData = await getCachedDashboardData(datasourceId, trackingId, fromA, toB)
    if (cachedData) {
      console.log("[Mangools Debug] Cache hit - returning cached data")
      return cachedData as MangoolsDashboardData
    }
    console.log("[Mangools Debug] Cache miss - fetching from API")
    
    // Cache miss - fetch from API
    
    // Fetch tracking detail to get keyword names and total count
    const trackingDetail = await fetchTrackingDetail(trackingId)
    console.log("[Mangools Debug] Fetched tracking detail:", trackingDetail.keywords.length, "keywords")
    
    // Fetch stats - either 1 call or 2 calls depending on tracking age
    let monthA, monthB
    
    if (useSameDataForBoth) {
      // Tracking < 30 days: Make only 1 API call and use same data for both months
      console.log("[Mangools Debug] 🔄 Making 1 API call: fetchTrackingStats(", fromA, "to", toB, ")")
      const stats = await fetchTrackingStats(trackingId, fromA, toB)
      monthA = stats
      monthB = stats // Use same data for both
      console.log("[Mangools Debug] ✅ Stats fetched:", stats.keywords.length, "keywords (reused for both months)")
    } else {
      // Tracking >= 30 days: Make 2 API calls for comparison
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
    
    // Format month names for display
    const formatMonthName = (date: Date) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
    }
    
    const monthAName = formatMonthName(monthAStart)
    const monthBName = formatMonthName(monthBStart)

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
      ...(isLimitedData && {
        limitedData: {
          isNew: true,
          createdAt: trackingCreatedDate?.toISOString(),
          message: limitedDataMessage
        }
      })
    }
    
    // Save to cache (fire and forget - don't wait)
    saveDashboardCache(datasourceId, trackingId, fromA, toB, dashboardData)
      .catch(err => console.error("[Mangools Debug] Failed to save cache:", err))
    
    console.log("[Mangools Debug] Dashboard data fetched successfully")
    return dashboardData
  } catch (error) {
    console.error("[Mangools Debug] Error fetching Mangools dashboard data:", error)
    throw error
  }
}

