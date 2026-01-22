/**
 * Date range calculation utilities
 * 
 * This file contains:
 * - Common date formatting functions (YYYY-MM-DD, YYYYMMDD)
 * - General date range calculations (last 2 completed months, last completed month)
 * - Dashboard-specific date ranges (24 months for GA/Semrush, 12 months for landing pages)
 * - Mangools-specific date range logic based on tracking creation date
 * - GMB filtering functions by timestamp
 */

// ============================================
// Common Date Formatting Utilities
// ============================================

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format date as YYYYMMDD integer (no separators)
 */
export function formatDateYYYYMMDDCompact(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * Format month label (e.g., "Dec 2024")
 */
function formatMonthLabel(date: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

// ============================================
// Main Date Range Functions
// ============================================

/**
 * Get last 2 completed months date range
 * Used for filtering scans by month (especially for GMB keywords)
 * Examples:
 * - If today = 31 Dec 2024 → Last: Nov 2024, Previous: Oct 2024
 * - If today = 2 Jan 2025 → Last: Dec 2024, Previous: Nov 2024
 * - If today = 15 Mar 2025 → Last: Feb 2025, Previous: Jan 2025
 */
export function getLast2CompletedMonths(): { 
  lastMonth: { start: Date, end: Date, startTimestamp: number, endTimestamp: number, label: string }
  previousMonth: { start: Date, end: Date, startTimestamp: number, endTimestamp: number, label: string }
} {
  const now = new Date()
  
  // Get first day of current month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Last Month (previous month) - the most recent completed month
  const lastMonthEnd = new Date(currentMonthStart.getTime() - 1) // Last day of previous month
  const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1)
  
  // Previous Month (2 months ago) - the month before last month
  const previousMonthEnd = new Date(lastMonthStart.getTime() - 1) // Last day of 2 months ago
  const previousMonthStart = new Date(previousMonthEnd.getFullYear(), previousMonthEnd.getMonth(), 1)
  
  return {
    lastMonth: {
      start: lastMonthStart,
      end: lastMonthEnd,
      startTimestamp: lastMonthStart.getTime(),
      endTimestamp: new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), lastMonthEnd.getDate(), 23, 59, 59, 999).getTime(),
      label: formatMonthLabel(lastMonthStart)
    },
    previousMonth: {
      start: previousMonthStart,
      end: previousMonthEnd,
      startTimestamp: previousMonthStart.getTime(),
      endTimestamp: new Date(previousMonthEnd.getFullYear(), previousMonthEnd.getMonth(), previousMonthEnd.getDate(), 23, 59, 59, 999).getTime(),
      label: formatMonthLabel(previousMonthStart)
    }
  }
}

/**
 * Calculate date ranges for dashboard reports (24 months of data)
 * Returns last completed month going back 24 months
 * This allows for 12-month comparisons (current 12 months vs previous 12 months)
 */
export function calculateDashboardDateRanges() {
  const today = new Date()
  
  // Last completed month end date (last day of previous month)
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0)
  
  // Start date: 24 months before the end date (first day of that month)
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 23, 1)
  
  // Reuse getLast2CompletedMonths for consistency
  const last2Months = getLast2CompletedMonths()
  
  const result = {
    startDate: formatDateYYYYMMDD(startDate),
    endDate: formatDateYYYYMMDD(endDate),
    startDateAPI: formatDateYYYYMMDDCompact(startDate),
    endDateAPI: formatDateYYYYMMDDCompact(endDate),
    startDateObj: startDate,
    endDateObj: endDate,
    lastMonth: {
      start: formatDateYYYYMMDD(last2Months.lastMonth.start),
      end: formatDateYYYYMMDD(last2Months.lastMonth.end),
      startAPI: formatDateYYYYMMDDCompact(last2Months.lastMonth.start),
      endAPI: formatDateYYYYMMDDCompact(last2Months.lastMonth.end),
      startObj: last2Months.lastMonth.start,
      endObj: last2Months.lastMonth.end
    },
    previousMonth: {
      start: formatDateYYYYMMDD(last2Months.previousMonth.start),
      end: formatDateYYYYMMDD(last2Months.previousMonth.end),
      startAPI: formatDateYYYYMMDDCompact(last2Months.previousMonth.start),
      endAPI: formatDateYYYYMMDDCompact(last2Months.previousMonth.end),
      startObj: last2Months.previousMonth.start,
      endObj: last2Months.previousMonth.end
    }
  }
  
  console.log('[Dashboard Date Ranges]', {
    today: formatDateYYYYMMDD(today),
    startDate: result.startDate,
    endDate: result.endDate,
    lastMonth: result.lastMonth.start + ' to ' + result.lastMonth.end,
    previousMonth: result.previousMonth.start + ' to ' + result.previousMonth.end,
    monthsIncluded: 24
  })
  
  return result
}

/**
 * Calculate date ranges for landing pages (12 months of data only)
 * Used for Google Analytics landing pages on Page 3
 * Returns last completed month going back 12 months
 */
export function calculateLandingPagesDateRanges() {
  const today = new Date()
  
  // Last completed month end date (last day of previous month)
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0)
  
  // Start date: 12 months before the end date (first day of that month)
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1)
  
  const result = {
    startDate: formatDateYYYYMMDD(startDate),
    endDate: formatDateYYYYMMDD(endDate),
    startDateAPI: formatDateYYYYMMDDCompact(startDate),
    endDateAPI: formatDateYYYYMMDDCompact(endDate),
    startDateObj: startDate,
    endDateObj: endDate
  }
  
  console.log('[Landing Pages Date Ranges]', {
    today: formatDateYYYYMMDD(today),
    startDate: result.startDate,
    endDate: result.endDate,
    monthsIncluded: 12
  })
  
  return result
}

/**
 * Calculate date ranges for SEMrush (all data up to last completed month)
 * Only returns end date - Semrush API will return all historical data
 */
export function calculateSemrushDateRanges() {
  const today = new Date()
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0) // Last day of previous month
  
  const endDateStr = formatDateYYYYMMDD(endDate)
  
  console.log('[SEMrush] Fetching all data up to:', endDateStr)
  
  return {
    startDate: undefined,
    endDate: endDateStr,
    startDateAPI: undefined,
    endDateAPI: formatDateYYYYMMDDCompact(endDate),
    endDateObj: endDate
  }
}

/**
 * Get last 2 completed months in simple YYYY-MM-DD format
 * Used by Mangools API for date range queries
 * Examples:
 * - If today = 31 Dec 2024 → Month A: Oct 1 - Oct 31, Month B: Nov 1 - Nov 30
 * - If today = 2 Jan 2025 → Month A: Nov 1 - Nov 30, Month B: Dec 1 - Dec 31
 * - If today = 15 Mar 2025 → Month A: Jan 1 - Jan 31, Month B: Feb 1 - Feb 28
 */
export function getLast2CompletedMonthsForAPI(): { 
  monthAStart: string
  monthAEnd: string
  monthBStart: string
  monthBEnd: string
} {
  const months = getLast2CompletedMonths()
  
  return {
    monthAStart: formatDateYYYYMMDD(months.previousMonth.start), // Month A is previous month (older)
    monthAEnd: formatDateYYYYMMDD(months.previousMonth.end),
    monthBStart: formatDateYYYYMMDD(months.lastMonth.start), // Month B is last month (more recent)
    monthBEnd: formatDateYYYYMMDD(months.lastMonth.end),
  }
}

/**
 * Filter items by Unix timestamp (milliseconds) within a month range
 * Used for filtering scans with dateAdded timestamps
 */
export function filterByMonth<T extends { dateAdded: number }>(
  items: T[],
  startTimestamp: number,
  endTimestamp: number
): T[] {
  return items.filter(item => 
    item.dateAdded >= startTimestamp && item.dateAdded <= endTimestamp
  )
}

/**
 * Get the last completed month date range for GMB metrics filtering
 * Examples:
 * - If today = 22 Jan 2026 → Dec 1, 2025 to Dec 31, 2025
 * - If today = 15 Mar 2025 → Feb 1, 2025 to Feb 28, 2025
 * - If today = 31 Dec 2024 → Nov 1, 2024 to Nov 30, 2024
 */
export function getLastCompletedMonthRange(): {
  start: Date
  end: Date
  startTimestamp: number
  endTimestamp: number
  label: string
  startDateStr: string
  endDateStr: string
} {
  const now = new Date()
  
  // Get first day of current month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Last completed month end date (last day of previous month)
  const lastMonthEnd = new Date(currentMonthStart.getTime() - 1)
  
  // Last completed month start date (first day of previous month)
  const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1)
  
  return {
    start: lastMonthStart,
    end: lastMonthEnd,
    startTimestamp: lastMonthStart.getTime(),
    endTimestamp: new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), lastMonthEnd.getDate(), 23, 59, 59, 999).getTime(),
    label: formatMonthLabel(lastMonthStart),
    startDateStr: formatDateYYYYMMDD(lastMonthStart),
    endDateStr: formatDateYYYYMMDD(lastMonthEnd)
  }
}

/**
 * Filter GMB metric history by timestamp within a date range
 * @param history - Array of metric history items with timestamp (ISO string)
 * @param startTimestamp - Start timestamp in milliseconds
 * @param endTimestamp - End timestamp in milliseconds
 * @returns Filtered array of history items
 */
export function filterGMBMetricsByMonth<T extends { timestamp: string }>(
  history: T[],
  startTimestamp: number,
  endTimestamp: number
): T[] {
  return history.filter(item => {
    const itemTimestamp = new Date(item.timestamp).getTime()
    return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp
  })
}

/**
 * Calculate Mangools dashboard date ranges based on tracking creation date
 * 
 * IMPORTANT: The returned monthAStart, monthAEnd, monthBStart, monthBEnd are the EXACT dates 
 * used for API calls and stored in the database. These dates define the comparison periods.
 * 
 * Handles 3 scenarios:
 * 1. Created BEFORE target range -> Use full target range (2 complete months)
 *    Example: Nov 1-30, 2025 vs Dec 1-31, 2025
 * 2a. Created AFTER target range, SAME month as today -> Use partial current month (1 API call)
 *    Example: Jan 1-22, 2026 vs Jan 1-22, 2026 (same data)
 * 2b. Created AFTER target range, DIFFERENT month -> Use 2 partial months
 *    Example: Dec 18-31, 2025 vs Jan 1-22, 2026
 * 
 * @param trackingCreatedAt - ISO string or null from mangools_domains.tracking_created_at
 * @returns Date ranges for Month A and Month B, plus metadata
 */
export function calculateMangoolsDashboardRanges(trackingCreatedAt: string | null): {
  monthAStart: Date
  monthAEnd: Date
  monthBStart: Date
  monthBEnd: Date
  useSameDataForBoth: boolean
  isLimitedData: boolean
  limitedDataMessage: string
  scenario: '1' | '2a' | '2b'
} {
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of day for inclusive ranges
  
  // Get the standard last 2 completed months (our target range)
  const targetRange = getLast2CompletedMonthsForAPI()
  const targetMonthAStart = new Date(targetRange.monthAStart)
  const targetMonthAEnd = new Date(targetRange.monthAEnd)
  const targetMonthBStart = new Date(targetRange.monthBStart)
  const targetMonthBEnd = new Date(targetRange.monthBEnd)
  
  // Check tracking creation date
  let trackingCreatedDate: Date | null = null
  if (trackingCreatedAt) {
    trackingCreatedDate = new Date(trackingCreatedAt)
    trackingCreatedDate.setHours(0, 0, 0, 0) // Start of day
  }
  
  // SCENARIO 1: Created BEFORE target range (or no creation date)
  if (!trackingCreatedDate || trackingCreatedDate <= targetMonthAStart) {
    return {
      monthAStart: targetMonthAStart,
      monthAEnd: targetMonthAEnd,
      monthBStart: targetMonthBStart,
      monthBEnd: targetMonthBEnd,
      useSameDataForBoth: false,
      isLimitedData: false,
      limitedDataMessage: '',
      scenario: '1'
    }
  }
  
  // Check if created in same month as today
  const isSameMonth = 
    trackingCreatedDate.getMonth() === today.getMonth() &&
    trackingCreatedDate.getFullYear() === today.getFullYear()
  
  // SCENARIO 2a: Created in SAME month as today
  if (isSameMonth) {
    return {
      monthAStart: trackingCreatedDate,
      monthAEnd: today,
      monthBStart: trackingCreatedDate,
      monthBEnd: today,
      useSameDataForBoth: true,
      isLimitedData: true,
      limitedDataMessage: `This tracking was recently added. Showing data from ${trackingCreatedDate.toLocaleDateString()} to ${today.toLocaleDateString()}.`,
      scenario: '2a'
    }
  }
  
  // SCENARIO 2b: Created in DIFFERENT month from today
  const monthAStart = trackingCreatedDate
  const monthAEnd = new Date(trackingCreatedDate.getFullYear(), trackingCreatedDate.getMonth() + 1, 0)
  const monthBStart = new Date(trackingCreatedDate.getFullYear(), trackingCreatedDate.getMonth() + 1, 1)
  const monthBEnd = today
  
  return {
    monthAStart,
    monthAEnd,
    monthBStart,
    monthBEnd,
    useSameDataForBoth: false,
    isLimitedData: true,
    limitedDataMessage: `This tracking was recently added. Comparing partial months from ${trackingCreatedDate.toLocaleDateString()}.`,
    scenario: '2b'
  }
}

/**
 * Format a date range for display in Mangools dashboard
 * Examples:
 * - Same month: "1-22 Jan 2026"
 * - Same year: "18 Dec - 22 Jan 2026"
 * - Different years: "25 Dec 2025 - 15 Jan 2026"
 */
export function formatMangoolsDateRange(start: Date, end: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const startDay = start.getDate()
  const startMonth = monthNames[start.getMonth()]
  const startYear = start.getFullYear()
  const endDay = end.getDate()
  const endMonth = monthNames[end.getMonth()]
  const endYear = end.getFullYear()
  
  // Same month and year: "1-22 Jan 2026"
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay}-${endDay} ${startMonth} ${startYear}`
  }
  // Same year, different months: "18 Dec - 22 Jan 2026"
  else if (start.getFullYear() === end.getFullYear()) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`
  }
  // Different years: "25 Dec 2025 - 15 Jan 2026"
  else {
    return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`
  }
}
