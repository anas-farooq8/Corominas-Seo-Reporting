import { NextRequest, NextResponse } from "next/server"
import { fetchGMBDashboardData } from "@/lib/actions/gmb-dashboard"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/gmb/keywords/[datasourceId]
 * Fetch GMB keyword data for dashboard display
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ datasourceId: string }> }
) {
  try {
    const { datasourceId } = await context.params
    
    if (!datasourceId) {
      return NextResponse.json(
        { error: "Datasource ID is required" },
        { status: 400 }
      )
    }

    console.log('[GMB Keywords API] Fetching keywords for datasource:', datasourceId)
    
    const data = await fetchGMBDashboardData(datasourceId)
    
    if (!data) {
      return NextResponse.json(
        { error: "No GMB profile found for this datasource" },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[GMB Keywords API] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch GMB keywords" },
      { status: 500 }
    )
  }
}
