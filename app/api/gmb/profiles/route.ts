import { NextResponse } from "next/server"
import { listProfiles } from "@/lib/gmb/api"

/**
 * Get all available GMB profiles from the workspace
 * GET /api/gmb/profiles
 * Returns only essential profile data: business name, address, rating, reviews, GMB score
 */
export async function GET() {
  console.log("[API] GET /api/gmb/profiles")

  try {
    const profiles = await listProfiles()

    // Transform profiles to include only necessary data
    // No profile URLs or extra metadata - just core business info
    const simplifiedProfiles = profiles.map(profile => ({
      _id: profile._id,
      businessName: profile.location.structured_formatting.main_text,
      address: profile.location.structured_formatting.secondary_text || null,
      rating: profile.rating || null,
      totalReviews: profile.totalReviews || null,
      gmbScore: profile.gmbScore || null,
      active: profile.active
    }))

    return NextResponse.json({
      success: true,
      profiles: simplifiedProfiles
    })
  } catch (error) {
    console.error("[API] Error fetching GMB profiles:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
