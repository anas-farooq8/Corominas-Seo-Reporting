import { NextResponse } from "next/server"
import { fetchGADashboardData } from "@/lib/actions/google-analytics-dashboard"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const propertyName = searchParams.get('propertyName')
    const displayName = searchParams.get('displayName')
    const timeZone = searchParams.get('timeZone')
    const currencyCode = searchParams.get('currencyCode')
    
    if (!propertyName) {
      return NextResponse.json(
        { error: "Property name is required" },
        { status: 400 }
      )
    }

    const data = await fetchGADashboardData(
      propertyName,
      displayName,
      timeZone,
      currencyCode
    )
    
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

