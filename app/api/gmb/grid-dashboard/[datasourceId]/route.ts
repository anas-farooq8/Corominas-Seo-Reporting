import { NextRequest, NextResponse } from "next/server"
import { fetchGMBGridDashboardData } from "@/lib/actions/gmb-dashboard"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/gmb/grid-dashboard/[datasourceId]
 * Fetch Grid My Business grid heatmap dashboard data for a specific datasource
 * Includes aggregated monthly grids and comparisons
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ datasourceId: string }> }
) {
  try {
    const { datasourceId} = await params
    console.log("[API] GMB Grid Dashboard requested for datasource:", datasourceId)
    
    // Extract today query parameter for report links
    const today = request.nextUrl.searchParams.get('today') || undefined
    
    // Fetch grid dashboard data with parallel request concurrency of 5
    const data = await fetchGMBGridDashboardData(datasourceId, 5, { today })
    
    if (!data) {
      return NextResponse.json(
        { error: "Grid dashboard data not found or no profile configured" },
        { status: 404 }
      )
    }
    
    console.log("[API] GMB Grid Dashboard data fetched successfully")
    console.log("[API] Keyword:", data.keyword, "| Grid cells:", data.heatmapData.length)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error fetching GMB grid dashboard:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch Grid My Business grid dashboard",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
