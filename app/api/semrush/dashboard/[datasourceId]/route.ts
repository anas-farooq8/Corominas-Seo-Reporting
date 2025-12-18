import { NextRequest, NextResponse } from "next/server"
import { fetchSEMrushDashboard } from "@/lib/actions/semrush-dashboard"

/**
 * GET /api/semrush/dashboard/[datasourceId]
 * Fetch SEMrush dashboard data for a specific datasource
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

    const data = await fetchSEMrushDashboard(datasourceId)

    if (!data) {
      return NextResponse.json(
        { error: "Failed to fetch SEMrush dashboard data" },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in SEMrush dashboard API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

