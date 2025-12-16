import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/google-analytics/attached
 * Returns all Google Analytics properties that are already attached to any datasource
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("google_analytics_properties")
      .select("name")
    
    if (error) {
      console.error("Error fetching attached GA properties:", error)
      return NextResponse.json(
        { error: "Failed to fetch attached properties" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in GET /api/google-analytics/attached:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

