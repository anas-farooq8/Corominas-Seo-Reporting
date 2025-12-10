import { NextResponse } from "next/server"
import { fetchMangoolsDashboardData } from "@/lib/actions/mangools-dashboard"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ datasourceId: string }> }
) {
  try {
    const { datasourceId } = await params
    
    const data = await fetchMangoolsDashboardData(datasourceId)
    
    if (!data) {
      return NextResponse.json(
        { error: "Dashboard data not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Mangools dashboard API:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}

