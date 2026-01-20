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
    created_at?: number // Unix timestamp
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

    // Create abort controller with 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
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
        signal: controller.signal,
      });
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[Mangools API] Error response:", errorText)
        throw new Error(`Mangools API error: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as MangoolsApiDomain[]
      
      return data
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('Mangools API request timed out after 30 seconds')
      }
      throw fetchError
    }
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

    // Create abort controller with 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
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
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

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
          },
          created_at: rawData.tracking.created_at || rawData.tracking.createdAt
        },
        keywords: rawData.keywords.map((kw: any) => ({
          _id: kw._id,
          kw: kw.kw
        }))
      }
      
      return parsedData
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('Mangools API request timed out after 30 seconds')
      }
      throw fetchError
    }
  } catch (error) {
    console.error("[Mangools API] Fetch tracking detail failed:", error)
    throw error
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

    // Create abort controller with 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
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
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[Mangools API] Error response:", errorText)
        throw new Error(`Mangools API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('Mangools API request timed out after 30 seconds')
      }
      throw fetchError
    }
  } catch (error) {
    console.error("[Mangools API] Fetch tracking stats failed:", error)
    throw error
  }
}

