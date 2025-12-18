import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Get all attached Semrush domains across all projects
 * Used to check which domains are already in use
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("semrush_domains")
      .select("domain")
    
    if (error) throw error
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching attached Semrush domains:", error)
    return NextResponse.json(
      { error: "Failed to fetch attached domains" },
      { status: 500 }
    )
  }
}

