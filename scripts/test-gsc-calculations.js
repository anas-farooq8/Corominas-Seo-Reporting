#!/usr/bin/env node

/**
 * Test script to verify Search Console KPI calculations
 * This simulates the data flow and validates the calculations
 */

// Mock daily data for testing (12 months)
const mockDailyData = []
const startDate = new Date(2024, 0, 1) // Jan 1, 2024

// Generate 365 days of mock data
for (let i = 0; i < 365; i++) {
  const date = new Date(startDate)
  date.setDate(date.getDate() + i)
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateKey = `${year}${month}${day}`
  
  // Simulate gradual growth over time
  const monthIndex = Math.floor(i / 30)
  const baseClicks = 100 + (monthIndex * 10)
  const baseImpressions = 3000 + (monthIndex * 300)
  
  mockDailyData.push({
    date: dateKey,
    clicks: baseClicks + Math.floor(Math.random() * 20),
    impressions: baseImpressions + Math.floor(Math.random() * 500),
    ctr: 0, // Will be calculated
    position: 20 + Math.random() * 10 - monthIndex * 0.5 // Gradual improvement
  })
}

// Calculate CTR for each day
mockDailyData.forEach(day => {
  day.ctr = day.impressions > 0 ? (day.clicks / day.impressions) : 0
})

console.log('\n=== MOCK DATA SUMMARY ===')
console.log(`Total days: ${mockDailyData.length}`)
console.log(`Date range: ${mockDailyData[0].date} to ${mockDailyData[mockDailyData.length - 1].date}`)
console.log(`Sample first day:`, mockDailyData[0])
console.log(`Sample last day:`, mockDailyData[mockDailyData.length - 1])

// Test calculation functions
function calculateWindowTotals(dailyData, endDate, monthsBack, windowMonths) {
  const end = new Date(endDate)
  end.setDate(1)
  end.setMonth(end.getMonth() - monthsBack)
  
  const start = new Date(end)
  start.setMonth(start.getMonth() - windowMonths)
  
  const startYYYYMMDD = parseInt(
    start.getFullYear() + 
    String(start.getMonth() + 1).padStart(2, '0') + 
    '01'
  )
  
  const endLastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0)
  const endYYYYMMDD = parseInt(
    endLastDay.getFullYear() + 
    String(endLastDay.getMonth() + 1).padStart(2, '0') + 
    String(endLastDay.getDate()).padStart(2, '0')
  )
  
  const windowData = dailyData.filter(item => {
    const itemDate = parseInt(item.date)
    return itemDate >= startYYYYMMDD && itemDate <= endYYYYMMDD
  })
  
  if (windowData.length === 0) {
    return { totalClicks: 0, totalImpressions: 0, averageCTR: 0, averagePosition: 0 }
  }
  
  let totalClicks = 0
  let totalImpressions = 0
  let weightedPositionSum = 0
  
  windowData.forEach(day => {
    totalClicks += day.clicks
    totalImpressions += day.impressions
    weightedPositionSum += day.position * day.impressions
  })
  
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const averagePosition = totalImpressions > 0 ? weightedPositionSum / totalImpressions : 0
  
  return { totalClicks, totalImpressions, averageCTR, averagePosition }
}

function testMetric(dailyData, endDate, metric, metricName) {
  console.log(`\n=== ${metricName.toUpperCase()} CALCULATIONS ===`)
  
  const windows = [
    { months: 1, label: '1-month' },
    { months: 3, label: '3-month' },
    { months: 6, label: '6-month' },
  ]
  
  windows.forEach(({ months, label }) => {
    const current = calculateWindowTotals(dailyData, endDate, 0, months)
    const previous = calculateWindowTotals(dailyData, endDate, months, months)
    
    let currentValue, previousValue
    
    switch (metric) {
      case 'clicks':
        currentValue = current.totalClicks
        previousValue = previous.totalClicks
        break
      case 'impressions':
        currentValue = current.totalImpressions
        previousValue = previous.totalImpressions
        break
      case 'ctr':
        currentValue = current.averageCTR
        previousValue = previous.averageCTR
        break
      case 'position':
        currentValue = current.averagePosition
        previousValue = previous.averagePosition
        break
    }
    
    if (previousValue > 0) {
      const change = ((currentValue - previousValue) / previousValue) * 100
      
      console.log(`${label}:`)
      console.log(`  Current: ${currentValue.toFixed(2)}`)
      console.log(`  Previous: ${previousValue.toFixed(2)}`)
      console.log(`  Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`)
      console.log(`  Is Increase: ${change >= 0}`)
    }
  })
}

// Run tests
const endDate = '2024-12-31'

testMetric(mockDailyData, endDate, 'clicks', 'Total Clicks')
testMetric(mockDailyData, endDate, 'impressions', 'Total Impressions')
testMetric(mockDailyData, endDate, 'ctr', 'Average CTR')
testMetric(mockDailyData, endDate, 'position', 'Average Position')

console.log('\n=== TEST COMPLETED ===\n')

