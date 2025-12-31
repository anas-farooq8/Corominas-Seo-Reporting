import { NextResponse } from "next/server"
import { fetchSearchConsoleSites } from "@/lib/google-search-console/api"

/**
 * GET /api/google-search-console/sites
 * Fetches all Google Search Console sites from the configured account
 */
export async function GET() {
  try {
    const sites = await fetchSearchConsoleSites()
    return NextResponse.json(sites)
  } catch (error) {
    console.error("Error fetching Google Search Console sites:", error)
    return NextResponse.json(
      { error: "Failed to fetch Google Search Console sites" },
      { status: 500 }
    )
  }
}

