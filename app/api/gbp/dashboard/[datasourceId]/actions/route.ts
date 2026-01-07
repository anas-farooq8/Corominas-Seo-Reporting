import { NextRequest, NextResponse } from "next/server"
import { fetchGBPActionsForPage1 } from "@/lib/actions/gbp-dashboard"

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

    const data = await fetchGBPActionsForPage1(datasourceId)

    if (!data) {
      return NextResponse.json(
        { error: "Failed to fetch GBP actions data" },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GBP actions API route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

