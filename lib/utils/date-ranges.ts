/**
 * Unified date range calculation for dashboard data
 * Used by Google Analytics, SEMrush, and other datasources
 * Returns last 24 months of data (last completed month going back 24 months)
 * This allows for 12-month comparisons (current 12 months vs previous 12 months)
 */

// ============================================
// Common Date Formatting Utilities
// ============================================

/**
 * Format date as YYYY-MM-DD
 */
function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format date as YYYYMMDD (no separators)
 */
function formatDateYYYYMMDDCompact(date: Date): string {
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
