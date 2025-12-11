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
  type KeywordComparison,
} from "@/lib/mangools/dashboard-utils"

import type { MangoolsStatsResponse } from "@/lib/mangools/api"

export interface MangoolsDashboardData {
  domain: string
  trackingId: string
  location: string
  totalKeywords: number
  dateRanges: {
    monthAStart: string
    monthAEnd: string
    monthBStart: string
    monthBEnd: string
    monthAName: string // e.g., "Oct Year"
    monthBName: string // e.g., "Nov Year"
  }
  topKeywords: KeywordComparison[]
  topWinners: KeywordComparison[]
  newRankings: KeywordComparison[]
  controlledLosers: KeywordComparison[]
  monthAStats: MangoolsStatsResponse
  monthBStats: MangoolsStatsResponse
}

/**
 * Fetch all data needed for the Mangools dashboard
 */
export async function fetchMangoolsDashboardData(datasourceId: string): Promise<MangoolsDashboardData | null> {
  try {
    // Get the domain from database
    const supabase = await createClient()
    const { data: domain, error } = await supabase
      .from("mangools_domains")
      .select("*")
      .eq("datasource_id", datasourceId)
      .single()

    if (error || !domain) {
      console.error("Domain not found for datasource:", datasourceId, error)
      return null
    }
    
    // Handle both old schema (mangools_id) and new schema (tracking_id)
    const trackingId = (domain as any).tracking_id || (domain as any).mangools_id
    
    if (!trackingId) {
      console.error("No tracking_id or mangools_id found in domain:", domain)
      return null
    }
    
    // Step 1: Fetch tracking detail to get keyword names and total count
    console.log(`[Dashboard] Fetching tracking detail from /detail endpoint...`)
    const trackingDetail = await fetchTrackingDetail(trackingId)
    
    console.log(`[Dashboard] Successfully fetched ${trackingDetail.keywords.length} total keywords from /detail endpoint`)
    console.log(`[Dashboard] Domain: ${trackingDetail.tracking.domain}, Location: ${trackingDetail.tracking.location.label}`)

    // Calculate date ranges for the last 2 completed months
    const today = new Date()
    
    // Month B: Previous complete month (the month before current month)
    // First day of Month B
    const monthBStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    // Last day of Month B (day 0 of current month = last day of previous month)
    const monthBEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    
    // Month A: The month before Month B
    // First day of Month A
    const monthAStart = new Date(today.getFullYear(), today.getMonth() - 2, 1)
    // Last day of Month A (day 0 of Month B = last day of Month A)
    const monthAEnd = new Date(today.getFullYear(), today.getMonth() - 1, 0)
    
    // Format dates as YYYY-MM-DD (using local date, not UTC)
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const fromA = formatDate(monthAStart)
    const toA = formatDate(monthAEnd)
    const fromB = formatDate(monthBStart)
    const toB = formatDate(monthBEnd)
    
    // Format month names for display
    const formatMonthName = (date: Date) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
    }
    
    const monthAName = formatMonthName(monthAStart)
    const monthBName = formatMonthName(monthBStart)

    // Step 2: Fetch stats for both months in parallel
    console.log(`[Dashboard] Fetching last 2 completed months:`)
    console.log(`[Dashboard] ${monthAName}: ${fromA} to ${toA}`)
    console.log(`[Dashboard] ${monthBName}: ${fromB} to ${toB}`)
    
    const [monthA, monthB] = await Promise.all([
      fetchTrackingStats(trackingId, fromA, toA),
      fetchTrackingStats(trackingId, fromB, toB),
    ])
    
    
    // Step 3: Use keyword names from detail endpoint to populate comparisons (matching by _id)
    const keywordsData = trackingDetail.keywords.map(kw => ({
      _id: kw._id,
      kw: kw.kw,
    }))

    // Compare monthly data
    const comparisons = compareMonthlyKeywords(monthA, monthB, keywordsData)
    
    // Generate all tables (no limits - show all)
    const topKeywords = getTopKeywords(comparisons)
    const topWinners = getTopWinners(comparisons) // Get all winners
    const controlledLosers = getControlledLosers(comparisons) // Get all losers
    const newRankings = getNewRankings(comparisons)

    console.log(`[Dashboard] Results - Winners: ${topWinners.length}, Losers: ${controlledLosers.length}, New Rankings: ${newRankings.length}`)

    return {
      domain: domain.domain,
      trackingId: trackingId,
      location: trackingDetail.tracking.location.label,
      totalKeywords: trackingDetail.keywords.length,
      dateRanges: {
        monthAStart: fromA,
        monthAEnd: toA,
        monthBStart: fromB,
        monthBEnd: toB,
        monthAName,
        monthBName,
      },
      topKeywords,
      topWinners,
      newRankings,
      controlledLosers,
      monthAStats: monthA,
      monthBStats: monthB,
    }
  } catch (error) {
    console.error("Error fetching Mangools dashboard data:", error)
    throw error // Re-throw to see the full error
  }
}

