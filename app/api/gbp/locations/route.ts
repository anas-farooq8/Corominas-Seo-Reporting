import { NextResponse } from "next/server"
import { listAccountsWithLocations } from "@/lib/google-business-profile/api"

/**
 * List all GBP accounts with their locations
 * GET /api/gbp/locations
 */
export async function GET() {
  console.log("[API] GET /api/gbp/locations")
  
  try {
    const accountsWithLocations = await listAccountsWithLocations()
    
    console.log(`[API] Returning ${accountsWithLocations.length} account(s) with locations`)
    
    return NextResponse.json(accountsWithLocations)
  } catch (error) {
    console.error("[API] Error fetching GBP locations:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch locations" },
      { status: 500 }
    )
  }
}

