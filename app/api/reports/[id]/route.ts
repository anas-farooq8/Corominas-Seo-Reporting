import { NextResponse } from "next/server"
import { getReportWithLinks } from "@/lib/db/reports"

/**
 * GET /api/reports/[id] - Get a specific report with all its links
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = await getReportWithLinks(id)
    
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(report)
  } catch (error) {
    console.error("Error in GET /api/reports/[id]:", error)
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    )
  }
}
