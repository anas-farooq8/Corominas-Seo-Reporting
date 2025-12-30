import { NextResponse } from "next/server"
import { fetchGALandingPagesDashboard } from "@/lib/actions/google-analytics-landing-pages"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ datasourceId: string }> }
) {
  try {
    const { datasourceId } = await params
    const data = await fetchGALandingPagesDashboard(datasourceId)
    
    if (!data) {
      return NextResponse.json(
        { error: "Landing pages data not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching GA landing pages:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch landing pages data" },
      { status: 500 }
    )
  }
}

