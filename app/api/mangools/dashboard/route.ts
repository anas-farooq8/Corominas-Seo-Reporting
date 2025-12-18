import { NextResponse } from "next/server"
import { fetchMangoolsDashboardData } from "@/lib/actions/mangools-dashboard"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const trackingId = searchParams.get('trackingId')
    
    if (!trackingId) {
      return NextResponse.json(
        { error: "Tracking ID is required" },
        { status: 400 }
      )
    }

    const data = await fetchMangoolsDashboardData(trackingId)
    
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

