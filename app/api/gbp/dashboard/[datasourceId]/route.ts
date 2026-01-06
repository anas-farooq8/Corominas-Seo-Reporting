import { NextRequest, NextResponse } from "next/server"
import { fetchGBPDashboardData } from "@/lib/actions/gbp-dashboard"

/**
 * GET /api/gbp/dashboard/[datasourceId]
 * Fetch Google Business Profile activity dashboard data for a specific datasource
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ datasourceId: string }> }
) {
  try {
    const { datasourceId } = await params

    if (!datasourceId) {
      return NextResponse.json(
        { error: "Datasource ID is required" },
        { status: 400 }
      )
    }

    console.log(`[GBP Dashboard API] Fetching dashboard for datasource: ${datasourceId}`)

    const dashboardData = await fetchGBPDashboardData(datasourceId)

    if (!dashboardData) {
      return NextResponse.json(
        { error: "No data found for this datasource" },
        { status: 404 }
      )
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("[GBP Dashboard API] Error:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch dashboard data"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

