import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Get all attached GBP locations across all projects
 * GET /api/gbp/attached
 */
export async function GET() {
  console.log("[API] GET /api/gbp/attached")
  
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("google_business_profile_locations")
      .select("location_id, business_name, address")

    if (error) {
      console.error("[API] Database error:", error)
      throw error
    }

    console.log(`[API] Found ${data?.length || 0} attached GBP location(s)`)
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[API] Error fetching attached GBP locations:", error)
    return NextResponse.json(
      { error: "Failed to fetch attached locations" },
      { status: 500 }
    )
  }
}

