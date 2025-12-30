/**
 * Shared utilities for dashboard components
 */

// Format number with commas
export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '0'
  return num.toLocaleString()
}

// Calculate percentage change
export const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return { change: 0, isIncrease: true }
  const change = ((current - previous) / previous) * 100
  return {
    change: Math.abs(change),
    isIncrease: change >= 0
  }
}

// Format date from YYYYMMDD to readable format (for X-axis)
export const formatDateForDisplay = (dateStr: string): string => {
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  const date = new Date(`${year}-${month}-${day}`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Format full date for tooltips
export const formatFullDate = (dateStr: string): string => {
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  const date = new Date(`${year}-${month}-${day}`)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// Format date range for display (YYYY-MM-DD format)
export const formatDateRange = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// Get month and year from date string (YYYY-MM-DD)
export const getMonthYear = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Get previous month/year from date string (YYYY-MM-DD)
export const getPreviousMonthYear = (dateStr: string): string => {
  const date = new Date(dateStr)
  date.setMonth(date.getMonth() - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Custom SEMrush Legend Component
export const CustomSEMrushLegend = () => {
  const legendItems = [
    { value: 'Top 3', color: '#ef4444' },
    { value: '4-10', color: '#f97316' },
    { value: '11-20', color: '#f59e0b' },
    { value: '21-50', color: '#3b82f6' },
    { value: '51-100', color: '#06b6d4' },
    { value: 'AI Overviews', color: '#8b5cf6' },
    { value: 'SERP functions', color: '#22c55e' },
  ]

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      flexWrap: 'wrap', 
      gap: '16px',
      paddingTop: '15px',
      fontSize: '14px'
    }}>
      {legendItems.map((item) => (
        <div key={item.value} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ 
            width: '14px', 
            height: '14px', 
            backgroundColor: item.color,
            borderRadius: '2px'
          }} />
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  )
}

// Custom Google Analytics Traffic Legend (Total Traffic first, then Organic Traffic)
export const CustomGATrafficLegend = () => {
  const legendItems = [
    { value: 'Total Traffic', color: '#8b5cf6', strokeDasharray: '' },
    { value: 'Organic Traffic', color: '#22c55e', strokeDasharray: '5 5' },
  ]

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      flexWrap: 'wrap', 
      gap: '20px',
      paddingTop: '10px',
      fontSize: '14px'
    }}>
      {legendItems.map((item) => (
        <div key={item.value} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="2" style={{ overflow: 'visible' }}>
            <line 
              x1="0" 
              y1="1" 
              x2="18" 
              y2="1" 
              stroke={item.color} 
              strokeWidth="3"
              strokeDasharray={item.strokeDasharray}
            />
          </svg>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  )
}

// Custom Google Analytics Sessions/Conversions Legend (Organic Sessions first)
export const CustomGASessionsLegend = () => {
  const legendItems = [
    { value: 'Organic Sessions', color: '#22c55e', strokeDasharray: '' },
    { value: 'Organic Conversions', color: '#3b82f6', strokeDasharray: '' },
  ]

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      flexWrap: 'wrap', 
      gap: '20px',
      paddingTop: '10px',
      fontSize: '14px'
    }}>
      {legendItems.map((item) => (
        <div key={item.value} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="2" style={{ overflow: 'visible' }}>
            <line 
              x1="0" 
              y1="1" 
              x2="18" 
              y2="1" 
              stroke={item.color} 
              strokeWidth="3"
              strokeDasharray={item.strokeDasharray}
            />
          </svg>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================
// Multi-Window Comparison Helpers
// ============================================

export interface ComparisonWindow {
  current: number
  previous: number
  change: number
  isIncrease: boolean
  periodType: '1-month' | '3-month' | '6-month'
  periodLabel: string
}

/**
 * Calculate average for a time window from daily data
 * @param dailyData - Array of daily data with date field (YYYYMMDD format)
 * @param valueExtractor - Function to extract the value from each daily data point
 * @param endDate - End date string (YYYY-MM-DD)
 * @param monthsBack - Number of months to go back from endDate
 * @param windowMonths - Number of months in the window
 */
export const calculateWindowAverage = <T extends { date: string }>(
  dailyData: T[],
  valueExtractor: (item: T) => number,
  endDate: string,
  monthsBack: number,
  windowMonths: number
): number => {
  // Calculate start and end dates for the window
  const end = new Date(endDate)
  end.setDate(1) // First day of the end month
  end.setMonth(end.getMonth() - monthsBack) // Go back monthsBack months
  
  const start = new Date(end)
  start.setMonth(start.getMonth() - windowMonths) // Go back windowMonths more
  
  // Convert to YYYYMMDD format for comparison
  const startYYYYMMDD = parseInt(
    start.getFullYear() + 
    String(start.getMonth() + 1).padStart(2, '0') + 
    '01'
  )
  
  // Get last day of the end month
  const endLastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0)
  const endYYYYMMDD = parseInt(
    endLastDay.getFullYear() + 
    String(endLastDay.getMonth() + 1).padStart(2, '0') + 
    String(endLastDay.getDate()).padStart(2, '0')
  )
  
  // Filter data within the window and calculate sum
  const windowData = dailyData.filter(item => {
    const itemDate = parseInt(item.date)
    return itemDate >= startYYYYMMDD && itemDate <= endYYYYMMDD
  })
  
  if (windowData.length === 0) return 0
  
  const sum = windowData.reduce((acc, item) => acc + valueExtractor(item), 0)
  return sum / windowMonths // Return monthly average
}

/**
 * Select the best comparison window for a metric based on which shows the most positive trend
 * @param dailyData - Array of daily data
 * @param valueExtractor - Function to extract the value from each data point
 * @param endDate - End date string (YYYY-MM-DD)
 * @returns The best comparison window with all details
 */
export const selectBestComparisonWindow = <T extends { date: string }>(
  dailyData: T[],
  valueExtractor: (item: T) => number,
  endDate: string
): ComparisonWindow => {
  const comparisons: ComparisonWindow[] = []
  
  // 1-month comparison (last month vs previous month)
  const last1Month = calculateWindowAverage(dailyData, valueExtractor, endDate, 0, 1)
  const prev1Month = calculateWindowAverage(dailyData, valueExtractor, endDate, 1, 1)
  
  if (prev1Month > 0) {
    const change1M = ((last1Month - prev1Month) / prev1Month) * 100
    comparisons.push({
      current: last1Month,
      previous: prev1Month,
      change: Math.abs(change1M),
      isIncrease: change1M >= 0,
      periodType: '1-month',
      periodLabel: '1-month comparison'
    })
  }
  
  // 3-month comparison (last 3 months vs previous 3 months)
  const last3Months = calculateWindowAverage(dailyData, valueExtractor, endDate, 0, 3)
  const prev3Months = calculateWindowAverage(dailyData, valueExtractor, endDate, 3, 3)
  
  if (prev3Months > 0) {
    const change3M = ((last3Months - prev3Months) / prev3Months) * 100
    comparisons.push({
      current: last3Months,
      previous: prev3Months,
      change: Math.abs(change3M),
      isIncrease: change3M >= 0,
      periodType: '3-month',
      periodLabel: '3-month comparison'
    })
  }
  
  // 6-month comparison (last 6 months vs previous 6 months)
  const last6Months = calculateWindowAverage(dailyData, valueExtractor, endDate, 0, 6)
  const prev6Months = calculateWindowAverage(dailyData, valueExtractor, endDate, 6, 6)
  
  if (prev6Months > 0) {
    const change6M = ((last6Months - prev6Months) / prev6Months) * 100
    comparisons.push({
      current: last6Months,
      previous: prev6Months,
      change: Math.abs(change6M),
      isIncrease: change6M >= 0,
      periodType: '6-month',
      periodLabel: '6-month comparison'
    })
  }
  
  // If no valid comparisons, return default
  if (comparisons.length === 0) {
    return {
      current: last1Month,
      previous: prev1Month,
      change: 0,
      isIncrease: true,
      periodType: '1-month',
      periodLabel: '1-month comparison'
    }
  }
  
  // Find the most positive comparison
  const positiveComparisons = comparisons.filter(c => c.isIncrease)
  
  if (positiveComparisons.length > 0) {
    // Return the one with highest positive change
    return positiveComparisons.reduce((best, current) => 
      current.change > best.change ? current : best
    )
  } else {
    // All are negative, return the most neutral (lowest negative change)
    return comparisons.reduce((best, current) => 
      current.change < best.change ? current : best
    )
  }
}

// Custom SEMrush Tooltip Factory
export const createSEMrushTooltip = (formatNumberFn: (num: number) => string) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = payload[0].payload.total
      
      return (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <p style={{ 
            color: '#111827', 
            fontWeight: 600, 
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            {payload[0].payload.fullDate}
          </p>
          <div style={{ fontSize: '13px' }}>
            <p style={{ color: '#ef4444', margin: '4px 0' }}>
              <strong>Top 3:</strong> {formatNumberFn(payload[0].payload["Top 3"])}
            </p>
            <p style={{ color: '#f97316', margin: '4px 0' }}>
              <strong>4-10:</strong> {formatNumberFn(payload[0].payload["4-10"])}
            </p>
            <p style={{ color: '#f59e0b', margin: '4px 0' }}>
              <strong>11-20:</strong> {formatNumberFn(payload[0].payload["11-20"])}
            </p>
            <p style={{ color: '#3b82f6', margin: '4px 0' }}>
              <strong>21-50:</strong> {formatNumberFn(payload[0].payload["21-50"])}
            </p>
            <p style={{ color: '#06b6d4', margin: '4px 0' }}>
              <strong>51-100:</strong> {formatNumberFn(payload[0].payload["51-100"])}
            </p>
            <p style={{ color: '#8b5cf6', margin: '4px 0' }}>
              <strong>AI Overviews:</strong> {formatNumberFn(payload[0].payload["AI Overviews"])}
            </p>
            <p style={{ color: '#22c55e', margin: '4px 0' }}>
              <strong>SERP functions:</strong> {formatNumberFn(payload[0].payload["SERP functions"])}
            </p>
            <p style={{ 
              fontWeight: 700, 
              marginTop: '8px', 
              paddingTop: '8px', 
              borderTop: '1px solid #e5e7eb',
              color: '#111827'
            }}>
              <strong>Total:</strong> {formatNumberFn(total)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }
  
  return CustomTooltip
}

