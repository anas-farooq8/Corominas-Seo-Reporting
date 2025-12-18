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

