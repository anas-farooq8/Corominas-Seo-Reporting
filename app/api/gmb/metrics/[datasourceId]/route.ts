import { NextResponse } from "next/server"
import { fetchGMBMetricsDashboardData } from "@/lib/actions/gmb-metrics"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/gmb/metrics/[datasourceId]
 * Fetch Grid My Business KPI metrics (GMB Score, Rating, Reviews, Engagements)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ datasourceId: string }> }
) {
  try {
    const { datasourceId } = await params
    console.log("[API] GMB Metrics requested for datasource:", datasourceId)
    
    const data = await fetchGMBMetricsDashboardData(datasourceId)
    
    if (!data) {
      return NextResponse.json(
        { error: "Metrics data not found or no profile configured" },
        { status: 404 }
      )
    }
    
    console.log("[API] GMB Metrics data fetched successfully")
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error fetching GMB metrics:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch Grid My Business metrics",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
