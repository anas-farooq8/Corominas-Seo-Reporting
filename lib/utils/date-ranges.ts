/**
 * Unified date range calculation for dashboard data
 * Used by Google Analytics, SEMrush, and other datasources
 * Returns last 12 months of data (last completed month going back 12 months)
 */

/**
 * Calculate date ranges for dashboard reports (12 months of data)
 * Returns last completed month going back 12 months
 */
export function calculateDashboardDateRanges() {
  const today = new Date()
  
  // Last completed month end date (last day of previous month)
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0)
  
  // Start date: 12 months before the end date (first day of that month)
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1)
  
  // Calculate last month (for comparison)
  const lastMonthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  const lastMonthEnd = endDate
  
  // Calculate previous month (for comparison)
  const previousMonthStart = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
  const previousMonthEnd = new Date(endDate.getFullYear(), endDate.getMonth(), 0)
  
  // Format dates as YYYY-MM-DD for storage
  const formatDateStorage = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Format dates as YYYYMMDD for APIs
  const formatDateAPI = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }
  
  const result = {
    startDate: formatDateStorage(startDate),
    endDate: formatDateStorage(endDate),
    startDateAPI: formatDateAPI(startDate),
    endDateAPI: formatDateAPI(endDate),
    startDateObj: startDate,
    endDateObj: endDate,
    lastMonth: {
      start: formatDateStorage(lastMonthStart),
      end: formatDateStorage(lastMonthEnd),
      startAPI: formatDateAPI(lastMonthStart),
      endAPI: formatDateAPI(lastMonthEnd),
      startObj: lastMonthStart,
      endObj: lastMonthEnd
    },
    previousMonth: {
      start: formatDateStorage(previousMonthStart),
      end: formatDateStorage(previousMonthEnd),
      startAPI: formatDateAPI(previousMonthStart),
      endAPI: formatDateAPI(previousMonthEnd),
      startObj: previousMonthStart,
      endObj: previousMonthEnd
    }
  }
  
  console.log('[Dashboard Date Ranges]', {
    today: formatDateStorage(today),
    startDate: result.startDate,
    endDate: result.endDate,
    lastMonth: result.lastMonth.start + ' to ' + result.lastMonth.end,
    previousMonth: result.previousMonth.start + ' to ' + result.previousMonth.end,
    monthsIncluded: 12
  })
  
  return result
}

