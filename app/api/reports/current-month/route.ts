import { NextResponse } from "next/server"
import { getCurrentMonthReport } from "@/lib/db/reports"

/**
 * GET /api/reports/current-month - Check if current month report exists
 */
export async function GET() {
  try {
    const report = await getCurrentMonthReport()
    
    return NextResponse.json({
      exists: !!report,
      report: report || null
    })
  } catch (error) {
    console.error("Error in GET /api/reports/current-month:", error)
    return NextResponse.json(
      { error: "Failed to check current month report" },
      { status: 500 }
    )
  }
}
