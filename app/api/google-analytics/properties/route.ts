import { NextResponse } from "next/server"
import { fetchGoogleAnalyticsProperties } from "@/lib/google-analytics/api"

/**
 * GET /api/google-analytics/properties
 * Fetches all Google Analytics properties from the configured account
 */
export async function GET() {
  try {
    const properties = await fetchGoogleAnalyticsProperties()
    return NextResponse.json(properties)
  } catch (error) {
    console.error("Error fetching Google Analytics properties:", error)
    return NextResponse.json(
      { error: "Failed to fetch Google Analytics properties" },
      { status: 500 }
    )
  }
}

