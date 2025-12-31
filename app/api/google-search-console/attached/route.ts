import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/google-search-console/attached
 * Returns all Google Search Console sites that are already attached to any datasource
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("google_search_console_sites")
      .select("site_url")
    
    if (error) {
      console.error("Error fetching attached GSC sites:", error)
      return NextResponse.json(
        { error: "Failed to fetch attached sites" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in GET /api/google-search-console/attached:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

