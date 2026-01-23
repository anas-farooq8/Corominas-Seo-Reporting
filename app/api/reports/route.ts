import { NextResponse } from "next/server"
import { getAllReports, createReport, generateReportLinks, getCurrentMonthReport } from "@/lib/db/reports"

/**
 * GET /api/reports - Get all reports
 */
export async function GET() {
  try {
    const reports = await getAllReports()
    return NextResponse.json(reports)
  } catch (error) {
    console.error("Error in GET /api/reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reports - Generate reports for current month
 */
export async function POST() {
  try {
    // Check if report already exists for current month
    const existingReport = await getCurrentMonthReport()
    
    if (existingReport) {
      return NextResponse.json(
        { error: "Report for current month already exists" },
        { status: 400 }
      )
    }
    
    // Create new report
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    
    const report = await createReport(month, year)
    
    // Generate links for all client-project combinations
    const { count, links } = await generateReportLinks(report.id)
    
    return NextResponse.json({
      report,
      generated_count: count,
      message: `Successfully generated ${count} report links`
    })
  } catch (error) {
    console.error("Error in POST /api/reports:", error)
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    )
  }
}
