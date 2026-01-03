/**
 * Shared comparison and window calculation helpers for dashboard KPIs
 * Used by Google Analytics, SEMrush, and Google Search Console dashboards
 */

export type PeriodType = '1-month' | '3-month' | '6-month'

export interface ComparisonWindow {
  current: number
  previous: number
  change: number
  isIncrease: boolean
  periodType: PeriodType
  periodLabel: string
  currentPeriod?: string
  previousPeriod?: string
}

export interface WindowResult {
  type: PeriodType
  currentPeriodStart: string
  currentPeriodEnd: string
  previousPeriodStart: string
  previousPeriodEnd: string
  currentValue: number
  previousValue: number
  change: number
  isIncrease: boolean
  currentStartYYYYMMDD: number
  currentEndYYYYMMDD: number
}

/**
 * Calculate window dates and filter data for a specific time period
 * @param endDate - End date string (YYYY-MM-DD) - the last day of the data period
 * @param monthsBack - Number of months to go back from endDate (0 = current period)
 * @param windowMonths - Number of months in the window
 * @returns Window start/end dates and YYYYMMDD integers for filtering
 */
export function calculateWindowDates(
  endDate: string,
  monthsBack: number,
  windowMonths: number
): {
  startDate: string
  endDate: string
  startYYYYMMDD: number
  endYYYYMMDD: number
} {
  const dataEnd = new Date(endDate)
  const lastMonth = dataEnd.getMonth()
  const lastYear = dataEnd.getFullYear()
  
  // Calculate target month (going back monthsBack months from the last month)
  const targetMonth = lastMonth - monthsBack
  const targetYear = lastYear + Math.floor(targetMonth / 12)
  const normalizedMonth = ((targetMonth % 12) + 12) % 12
  
  // Get the last day of the target month (end of window)
  const windowEndLastDay = new Date(targetYear, normalizedMonth + 1, 0)
  
  // Calculate the start of the window (go back windowMonths-1 from target month)
  const startMonth = normalizedMonth - windowMonths + 1
  const startYear = targetYear + Math.floor(startMonth / 12)
  const normalizedStartMonth = ((startMonth % 12) + 12) % 12
  const windowStart = new Date(startYear, normalizedStartMonth, 1)
  
  const startYYYYMMDD = parseInt(
    windowStart.getFullYear() + 
    String(windowStart.getMonth() + 1).padStart(2, '0') + 
    String(windowStart.getDate()).padStart(2, '0')
  )
  
  const endYYYYMMDD = parseInt(
    windowEndLastDay.getFullYear() + 
    String(windowEndLastDay.getMonth() + 1).padStart(2, '0') + 
    String(windowEndLastDay.getDate()).padStart(2, '0')
  )
  
  const formatDate = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  
  return {
    startDate: formatDate(windowStart),
    endDate: formatDate(windowEndLastDay),
    startYYYYMMDD,
    endYYYYMMDD
  }
}

/**
 * Calculate comparison for a specific window
 * @param dailyData - Array of daily data with date field (YYYYMMDD format)
 * @param endDate - End date string (YYYY-MM-DD)
 * @param windowMonths - Number of months in the window (1, 3, or 6)
 * @param valueExtractor - Function to extract the value from each daily data point
 * @returns Window comparison with current/previous values and dates
 */
export function calculateWindowComparison<T extends { date: string }>(
  dailyData: T[],
  endDate: string,
  windowMonths: number,
  valueExtractor: (item: T) => number
): {
  current: number
  previous: number
  dates: {
    currentStart: string
    currentEnd: string
    previousStart: string
    previousEnd: string
  }
  currentStartYYYYMMDD: number
  currentEndYYYYMMDD: number
} {
  // Current window (monthsBack = 0)
  const currentDates = calculateWindowDates(endDate, 0, windowMonths)
  
  // Previous window (monthsBack = windowMonths)
  const previousDates = calculateWindowDates(endDate, windowMonths, windowMonths)
  
  // Filter and sum current period
  const currentData = dailyData.filter(d => {
    const dateNum = parseInt(d.date)
    return dateNum >= currentDates.startYYYYMMDD && dateNum <= currentDates.endYYYYMMDD
  })
  const currentSum = currentData.reduce((sum, d) => sum + valueExtractor(d), 0)
  const currentAvg = currentData.length > 0 ? currentSum / windowMonths : 0
  
  // Filter and sum previous period
  const previousData = dailyData.filter(d => {
    const dateNum = parseInt(d.date)
    return dateNum >= previousDates.startYYYYMMDD && dateNum <= previousDates.endYYYYMMDD
  })
  const previousSum = previousData.reduce((sum, d) => sum + valueExtractor(d), 0)
  const previousAvg = previousData.length > 0 ? previousSum / windowMonths : 0
  
  return {
    current: currentAvg,
    previous: previousAvg,
    dates: {
      currentStart: currentDates.startDate,
      currentEnd: currentDates.endDate,
      previousStart: previousDates.startDate,
      previousEnd: previousDates.endDate
    },
    currentStartYYYYMMDD: currentDates.startYYYYMMDD,
    currentEndYYYYMMDD: currentDates.endYYYYMMDD
  }
}

/**
 * Select best comparison window using sequential strategy:
 * 1. Try 1-month first - if positive, use it
 * 2. Try 3-month - if positive, use it
 * 3. Use 6-month (even if negative)
 * 
 * If all negative, selects the most neutral (smallest change)
 * 
 * @param dailyData - Array of daily data
 * @param endDate - End date string (YYYY-MM-DD)
 * @param valueExtractor - Function to extract value from each data point
 * @param metricName - Optional name for debug logging (e.g., "Organic Sessions")
 * @returns Best comparison window with all details
 */
export function selectBestComparisonWindow<T extends { date: string }>(
  dailyData: T[],
  endDate: string,
  valueExtractor: (item: T) => number,
  metricName?: string
): WindowResult {
  const windows: Array<{ months: number, label: PeriodType }> = [
    { months: 1, label: '1-month' },
    { months: 3, label: '3-month' },
    { months: 6, label: '6-month' },
  ]
  
  let mostNeutralNegative: WindowResult | null = null
  
  // Try each window sequentially
  for (const { months, label } of windows) {
    const { current, previous, dates, currentStartYYYYMMDD, currentEndYYYYMMDD } = 
      calculateWindowComparison(dailyData, endDate, months, valueExtractor)
    
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0
    const isIncrease = change >= 0
    
    const result: WindowResult = {
      type: label,
      currentPeriodStart: dates.currentStart,
      currentPeriodEnd: dates.currentEnd,
      previousPeriodStart: dates.previousStart,
      previousPeriodEnd: dates.previousEnd,
      currentValue: current,
      previousValue: previous,
      change: Math.abs(change),
      isIncrease,
      currentStartYYYYMMDD,
      currentEndYYYYMMDD
    }
    
    // Calculate days in each period for display
    const currentDays = dailyData.filter(d => {
      const dateNum = parseInt(d.date)
      return dateNum >= currentStartYYYYMMDD && dateNum <= currentEndYYYYMMDD
    }).length
    
    const previousDates = calculateWindowDates(endDate, months, months)
    const previousDays = dailyData.filter(d => {
      const dateNum = parseInt(d.date)
      return dateNum >= previousDates.startYYYYMMDD && dateNum <= previousDates.endYYYYMMDD
    }).length
    
    // Debug logging with detailed format
    if (metricName) {
      console.log(`[${metricName}] ${label}:`)
      console.log(`  Current:  ${dates.currentStart} to ${dates.currentEnd} (${currentDays} days) = ${current.toFixed(2)}`)
      console.log(`  Previous: ${dates.previousStart} to ${dates.previousEnd} (${previousDays} days) = ${previous.toFixed(2)}`)
      console.log(`  Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`)
    }
    
    // Return first positive comparison
    if (isIncrease) {
      if (metricName) {
        console.log(`  ✓ Selected ${label} (positive)\n`)
      }
      return result
    }
    
    // Track most neutral negative for fallback
    if (!mostNeutralNegative || result.change < mostNeutralNegative.change) {
      mostNeutralNegative = result
    }
    
    if (metricName) {
      console.log(`  ✗ Negative, trying next window\n`)
    }
    
    // If this is the last window, return most neutral negative
    if (label === '6-month') {
      if (metricName && mostNeutralNegative) {
        console.log(`  ✓ Selected ${mostNeutralNegative.type} (most neutral negative)\n`)
      }
      return mostNeutralNegative!
    }
  }
  
  // Fallback (should never reach here)
  return mostNeutralNegative || {
    type: '1-month',
    currentPeriodStart: endDate,
    currentPeriodEnd: endDate,
    previousPeriodStart: endDate,
    previousPeriodEnd: endDate,
    currentValue: 0,
    previousValue: 0,
    change: 0,
    isIncrease: true,
    currentStartYYYYMMDD: parseInt(endDate.replace(/-/g, '')),
    currentEndYYYYMMDD: parseInt(endDate.replace(/-/g, ''))
  }
}

