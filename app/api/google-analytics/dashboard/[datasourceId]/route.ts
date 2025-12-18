import { NextResponse } from "next/server"
import { fetchGADashboardData } from "@/lib/actions/google-analytics-dashboard"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ datasourceId: string }> }
) {
  try {
    const { datasourceId } = await params
    const data = await fetchGADashboardData(datasourceId)
    
    if (!data) {
      return NextResponse.json(
        { error: "Dashboard data not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching GA dashboard:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}

