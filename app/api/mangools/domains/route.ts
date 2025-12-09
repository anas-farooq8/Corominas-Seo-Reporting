import { NextResponse } from "next/server"
import { fetchMangoolsDomains } from "@/lib/mangools/api"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch domains from Mangools
    const domains = await fetchMangoolsDomains()

    return NextResponse.json(domains)
  } catch (error) {
    console.error("Mangools API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch domains" },
      { status: 500 }
    )
  }
}

