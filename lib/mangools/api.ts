import type { MangoolsApiDomain } from "@/lib/supabase/types"
import { cache } from "react"

const MANGOOLS_API_BASE = "https://api.mangools.com/v3"

// ============================================
// Types for Mangools API Responses
// ============================================

// Simplified - only parse what we need
export interface MangoolsTrackingDetail {
  tracking: {
    _id: string
    domain: string
    location: {
      label: string
    }
  }
  keywords: Array<{
    _id: string
    kw: string
  }>
}

export interface MangoolsKeywordStats {
  _id: string
  rank_change: number | null
  search_volume: number | null
  is_more_url: boolean
  visual_metrics: {
    status: string | null
    serp_coverage: number
    serp_coverage_change: number
    above_the_fold: number | null
    above_the_fold_change: number | null
    from_top_edge: number | null
    from_top_edge_change: number | null
  }
  serp_features: any[]
  map_pack: {
    rank: number | null
    url: string | null
    hasUrl: boolean | null
  }
  feat_snippet: {
    serpRank: number | null
    url: string | null
    isRanking: boolean
  }
  estimated_visits: number | null
  rank: {
    last: number | null
    avg: number | null
    best: number | null
  }
  last_checked_at: number
  estimated_visits_change: number | null
  estimated_visits_total_change: number | null
  performanceIndexChange: number | null
  rank_history: number[]
  is_empty_main_array: boolean
  nearest_before_day: string
}

export interface MangoolsStatsResponse {
  history_dates: string[]
  stats: {
    timeframes: Record<string, {
      performance_index: number
      visibility_index: number
      performance_total: number
      estimated_visits: number
      rank_distribution: {
        "1": number
        "3": number
        "10": number
        "20": number
        "100": number
        "rest": number
      }
    }>
    top_up: any[]
    top_down: any[]
  }
  keywords: MangoolsKeywordStats[]
  annotations: any[]
}

/**
 * Fetch available domains from Mangools SERPWatcher API
 * Returns all tracked domains from the account
 */
export const fetchMangoolsDomains = cache(async (): Promise<MangoolsApiDomain[]> => {
  const accessToken = process.env.MANGOOLS_X_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error("MANGOOLS_X_ACCESS_TOKEN environment variable is not set")
  }

  try {
    const url = `${MANGOOLS_API_BASE}/serpwatcher/trackings`
    const params = new URLSearchParams({
      is_with_deleted: "false"
    })

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers: {
        "x-access-token": accessToken,

        // required for CORS trust
        "Origin": "https://app.mangools.com",
        "Referer": "https://app.mangools.com/serpwatcher/",

        // normal browser headers
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Mangools API] Error response:", errorText)
      throw new Error(`Mangools API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as MangoolsApiDomain[]
    
    return data
  } catch (error) {
    console.error("[Mangools API] Fetch failed:", error)
    throw error
  }
})


/**
 * Fetch tracking detail for a specific domain
 * Returns only the necessary data: tracking info and keywords list
 * @param trackingId The tracking ID (_id) from Mangools
 */
export async function fetchTrackingDetail(trackingId: string): Promise<MangoolsTrackingDetail> {
  const accessToken = process.env.MANGOOLS_X_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error("MANGOOLS_X_ACCESS_TOKEN environment variable is not set")
  }

  try {
    const url = `${MANGOOLS_API_BASE}/serpwatcher/trackings/${trackingId}/detail`
    const params = new URLSearchParams({
      is_with_deleted: "false"
    })

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers: {
        "x-access-token": accessToken,

        // required for CORS trust
        "Origin": "https://app.mangools.com",
        "Referer": "https://app.mangools.com/serpwatcher/",

        // normal browser headers
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Mangools API] Error response:", errorText)
      throw new Error(`Mangools API error: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    
    // Parse only what we need from the response
    const parsedData: MangoolsTrackingDetail = {
      tracking: {
        _id: rawData.tracking._id,
        domain: rawData.tracking.domain,
        location: {
          label: rawData.tracking.location.label
        }
      },
      keywords: rawData.keywords.map((kw: any) => ({
        _id: kw._id,
        kw: kw.kw
      }))
    }
    
    return parsedData
  } catch (error) {
    console.error("[Mangools API] Fetch tracking detail failed:", error)
    throw error
  }
}

/**
 * Get last 2 completed months date range
 * Examples:
 * - If today = 31 Dec 2024 → Retrieve Oct 1 - Nov 30
 * - If today = 2 Jan 2025 → Retrieve Nov 1 - Dec 31
 * - If today = 15 Mar 2025 → Retrieve Jan 1 - Feb 28
 */
export function getLast2CompletedMonths(): { monthAStart: string, monthAEnd: string, monthBStart: string, monthBEnd: string } {
  const now = new Date()
  
  // Get first day of current month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Month B (previous month)
  const monthBEnd = new Date(currentMonthStart.getTime() - 1) // Last day of previous month
  const monthBStart = new Date(monthBEnd.getFullYear(), monthBEnd.getMonth(), 1)
  
  // Month A (2 months ago)
  const monthAEnd = new Date(monthBStart.getTime() - 1) // Last day of 2 months ago
  const monthAStart = new Date(monthAEnd.getFullYear(), monthAEnd.getMonth(), 1)
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return {
    monthAStart: formatDate(monthAStart),
    monthAEnd: formatDate(monthAEnd),
    monthBStart: formatDate(monthBStart),
    monthBEnd: formatDate(monthBEnd),
  }
}

/**
 * Fetch stats for a tracking ID within a date range
 * @param trackingId The tracking ID from Mangools
 * @param from Start date in YYYY-MM-DD format
 * @param to End date in YYYY-MM-DD format
 */
export async function fetchTrackingStats(
  trackingId: string,
  from: string,
  to: string
): Promise<MangoolsStatsResponse> {
  const accessToken = process.env.MANGOOLS_X_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error("MANGOOLS_X_ACCESS_TOKEN environment variable is not set")
  }

  try {
    const url = `${MANGOOLS_API_BASE}/serpwatcher/trackings/${trackingId}/stats`
    
    const params = new URLSearchParams({
      from: from,
      to: to
    })
    
    const fullUrl = `${url}?${params.toString()}`

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "x-access-token": accessToken,

        // required for CORS trust
        "Origin": "https://app.mangools.com",
        "Referer": "https://app.mangools.com/serpwatcher/",

        // normal browser headers
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Mangools API] Error response:", errorText)
      throw new Error(`Mangools API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("[Mangools API] Fetch tracking stats failed:", error)
    throw error
  }
}

/**
 * Fetch stats for last 2 completed months
 * Automatically calculates date ranges and fetches both months
 */
export async function fetchLast2MonthsStats(trackingId: string): Promise<{
  monthA: MangoolsStatsResponse
  monthB: MangoolsStatsResponse
  dateRanges: ReturnType<typeof getLast2CompletedMonths>
}> {
  const dateRanges = getLast2CompletedMonths()
  
  const [monthA, monthB] = await Promise.all([
    fetchTrackingStats(trackingId, dateRanges.monthAStart, dateRanges.monthAEnd),
    fetchTrackingStats(trackingId, dateRanges.monthBStart, dateRanges.monthBEnd),
  ])
  
  return {
    monthA,
    monthB,
    dateRanges,
  }
}
