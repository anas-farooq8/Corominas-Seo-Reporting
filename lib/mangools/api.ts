import type { MangoolsApiDomain } from "@/lib/supabase/types"
import { cache } from "react"

const MANGOOLS_API_BASE = "https://api.mangools.com/v3"

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
    const response = await fetch(`${MANGOOLS_API_BASE}/serpwatcher/trackings`, {
      method: "GET",
      headers: {
        "x-access-token": accessToken,
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      next: {
        revalidate: 180, // Cache for 3 minutes
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Mangools API] Error response:", errorText)
      throw new Error(`Mangools API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as MangoolsApiDomain[]
    
    // Filter out deleted domains
    const activeDomains = data.filter((domain) => !domain.is_deleted)
    
    return activeDomains
  } catch (error) {
    console.error("[Mangools API] Fetch failed:", error)
    throw error
  }
})

/**
 * Parse Mangools domain data for storage
 * Extracts only the fields we need for our database
 */
export function parseMangoolsDomainForDb(domain: MangoolsApiDomain) {
  return {
    mangools_id: domain._id,
    domain: domain.domain,
    location_code: domain.location?.code ?? null,
    location_label: domain.location?.label ?? null,
    platform_id: domain.platform_id ?? null,
    keywords_count: domain.count ?? 0,
    mangools_created_at: domain.created_at ?? null,
  }
}
