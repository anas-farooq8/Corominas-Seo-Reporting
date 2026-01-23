import { NextResponse } from "next/server"
import { getReportLinkByToken, lockReportLinkTodayDate } from "@/lib/db/reports"
import { formatDateYYYYMMDD } from "@/lib/utils/date-ranges"

/**
 * GET /api/reports/link/[token] - Get report link details and lock today date if first access
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const reportLink = await getReportLinkByToken(token)
    
    if (!reportLink) {
      return NextResponse.json(
        { error: "Report link not found or expired" },
        { status: 404 }
      )
    }
    
    // If this is the first access (locked_today_date is null), lock it to today
    if (!reportLink.locked_today_date) {
      const todayDate = formatDateYYYYMMDD(new Date())
      const locked = await lockReportLinkTodayDate(reportLink.id, todayDate)
      
      if (locked) {
        reportLink.locked_today_date = todayDate
        reportLink.first_opened_at = new Date().toISOString()
      }
    }
    
    return NextResponse.json({
      success: true,
      link: reportLink,
      today: reportLink.locked_today_date
    })
  } catch (error) {
    console.error("Error in GET /api/reports/link/[token]:", error)
    return NextResponse.json(
      { error: "Failed to access report link" },
      { status: 500 }
    )
  }
}
