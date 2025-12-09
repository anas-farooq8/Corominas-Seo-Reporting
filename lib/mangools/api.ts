import type { MangoolsDomain } from "@/lib/supabase/types"
import { cache } from "react"

const MANGOOLS_API_BASE = "https://api.mangools.com/v2"

interface MangoolsResponse {
  domains: MangoolsDomain[]
}

/**
 * Fetch available domains from Mangools API
 * Cached for 60 seconds to avoid excessive API calls
 */
export const fetchMangoolsDomains = cache(async (): Promise<MangoolsDomain[]> => {
  const accessToken = process.env.MANGOOLS_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error("MANGOOLS_ACCESS_TOKEN environment variable is not set")
  }

  try {
    const response = await fetch(`${MANGOOLS_API_BASE}/domains`, {
      method: "GET",
      headers: {
        "x-access-token": accessToken,
        "Content-Type": "application/json",
      },
      // cache: 'force-cache',
    })

    if (!response.ok) {
      throw new Error(`Mangools API error: ${response.statusText}`)
    }

    const data = (await response.json()) as MangoolsResponse
    return data.domains || []
  } catch (error) {
    console.error("[v0] Mangools API fetch failed:", error)
    throw error
  }
})

/**
 * Parse and normalize Mangools domain data
 * Extract only required fields: domain, rank, traffic, difficulty
 */
export function parseMangoolsDomain(domain: MangoolsDomain): MangoolsDomain {
  return {
    domain: domain.domain,
    rank: domain.rank ?? null,
    traffic: domain.traffic ?? null,
    difficulty: domain.difficulty ?? null,
  }
}
