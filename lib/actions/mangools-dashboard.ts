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
  trackingId: string
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
}

/**
 * Fetch all data needed for the Mangools dashboard
 * Uses cache when available to reduce API calls
 * @param datasourceId - The datasource ID
 */
export async function fetchMangoolsDashboardData(
  datasourceId: string
): Promise<MangoolsDashboardData | null> {
  try {
    // Get the tracking_id from database
    const supabase = await createClient()
    const { data: domain, error: domainError } = await supabase
      .from("mangools_domains")
      .select("tracking_id, domain")
      .eq("datasource_id", datasourceId)
      .single()
    
    if (domainError || !domain) {
      console.error("Domain not found for datasource:", datasourceId, domainError)
      return null
    }
    
    const trackingId = domain.tracking_id
    
    // Calculate date ranges for the last 2 completed months
    const today = new Date()
    
    // Month B: Previous complete month (the month before current month)
    const monthBStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const monthBEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    
    // Month A: The month before Month B
    const monthAStart = new Date(today.getFullYear(), today.getMonth() - 2, 1)
    const monthAEnd = new Date(today.getFullYear(), today.getMonth() - 1, 0)
    
    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const fromA = formatDate(monthAStart)
    const toB = formatDate(monthBEnd)
    
    // Check cache first
    const cachedData = await getCachedDashboardData(datasourceId, trackingId, fromA, toB)
    if (cachedData) {
      return cachedData as MangoolsDashboardData
    }
    
    // Cache miss - fetch from API
    
    // Calculate individual month end dates
    const toA = formatDate(monthAEnd)
    const fromB = formatDate(monthBStart)
    
    // Fetch tracking detail to get keyword names and total count
    const trackingDetail = await fetchTrackingDetail(trackingId)
    
    // Fetch stats for both months in parallel
    const [monthA, monthB] = await Promise.all([
      fetchTrackingStats(trackingId, fromA, toA),
      fetchTrackingStats(trackingId, fromB, toB),
    ])
    
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
      trackingId: trackingId,
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
    }
    
    // Save to cache (fire and forget - don't wait)
    saveDashboardCache(datasourceId, trackingId, fromA, toB, dashboardData)
      .catch(err => console.error("Failed to save cache:", err))
    
    return dashboardData
  } catch (error) {
    console.error("Error fetching Mangools dashboard data:", error)
    throw error
  }
}

