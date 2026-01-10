import { NextResponse } from "next/server"
import { fetchGoogleAnalyticsAccountsWithProperties } from "@/lib/google-analytics/api"

/**
 * GET /api/google-analytics/properties
 * Fetches all Google Analytics accounts with their properties
 */
export async function GET() {
  try {
    const accountsWithProperties = await fetchGoogleAnalyticsAccountsWithProperties()
    return NextResponse.json(accountsWithProperties)
  } catch (error) {
    console.error("Error fetching Google Analytics accounts with properties:", error)
    return NextResponse.json(
      { error: "Failed to fetch Google Analytics accounts with properties" },
      { status: 500 }
    )
  }
}

