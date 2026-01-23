/**
 * GMB Metrics Actions
 * Fetch and process GMB KPI metrics (GMB Score, Rating, Review)
 */

import { createClient } from "@/lib/supabase/server"
import { fetchGMBMetrics, type GMBMetricsResponse } from "@/lib/gmb/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"
import { calculateDashboardDateRanges, getLastCompletedMonthRange, filterGMBMetricsByMonth } from "@/lib/utils/date-ranges"
import type { DashboardOptions } from "@/lib/api/dashboard-handler"

// ============================================
// Type Definitions
// ============================================

export interface GMBKPICard {
  current: number
  previous: number
  change: number
  isIncrease: boolean
  dateRange: string // Show the actual date range being used
}

export interface GMBMetricsDashboardData {
  businessName: string
  address: string
  kpiCards: {
    gmbScore: GMBKPICard
    rating: GMBKPICard
    reviews: GMBKPICard
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Process metric data to extract current and previous values with comparison
 * Filters history by last completed month and compares first vs last entry in that range
 * If no entries in filtered range, uses first and last from raw data
 */
function processMetricData(
  currentValue: number,
  historyData: Array<{ timestamp: string; value: number }>,
  targetRange: { startTimestamp: number; endTimestamp: number; startDateStr: string; endDateStr: string }
): {
  current: number
  previous: number
  change: number
  isIncrease: boolean
  dateRange: string
} {
  console.log('[GMB Metrics] Processing metric data:')
  console.log('[GMB Metrics] - Raw history entries:', historyData?.length || 0)
  console.log('[GMB Metrics] - Target range:', targetRange.startDateStr, 'to', targetRange.endDateStr)
  
  // Debug: Show all raw timestamps
  if (historyData && historyData.length > 0) {
    console.log('[GMB Metrics] - Raw data timestamps:', historyData.map(h => h.timestamp).join(', '))
  }
  
  // Filter history by target month range
  const filteredHistory = historyData && historyData.length > 0
    ? filterGMBMetricsByMonth(historyData, targetRange.startTimestamp, targetRange.endTimestamp)
    : []
  
  console.log('[GMB Metrics] - Filtered entries in target range:', filteredHistory.length)
  
  // Debug: Show filtered timestamps
  if (filteredHistory.length > 0) {
    console.log('[GMB Metrics] - Filtered data timestamps:', filteredHistory.map(h => h.timestamp).join(', '))
  }
  
  let current = currentValue
  let previous = currentValue
  let dateRange = `${targetRange.startDateStr} to ${targetRange.endDateStr}`
  
  // CASE 1: We have filtered data in our target range (1 or more entries)
  if (filteredHistory.length > 0) {
    console.log('[GMB Metrics] ✓ Using filtered data from target range')
    
    // Sort by timestamp (oldest first)
    const sortedFiltered = [...filteredHistory].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    // First entry in range = previous (oldest)
    // Last entry in range = current (newest)
    previous = sortedFiltered[0].value
    current = sortedFiltered[sortedFiltered.length - 1].value
    
    console.log('[GMB Metrics] - First entry (previous):', sortedFiltered[0].timestamp, '=', previous)
    console.log('[GMB Metrics] - Last entry (current):', sortedFiltered[sortedFiltered.length - 1].timestamp, '=', current)
  }
  // CASE 2: No entries in filtered range - use first and last from raw data
  else if (historyData && historyData.length > 0) {
    console.log('[GMB Metrics] ⚠️ No data in target range - using fallback (first and last from raw data)')
    
    // Sort by timestamp (oldest first)
    const sortedRaw = [...historyData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    // First entry = previous (oldest)
    // Last entry = current (newest)
    previous = sortedRaw[0].value
    current = sortedRaw[sortedRaw.length - 1].value
    
    // Update date range to show actual range used
    const firstDate = sortedRaw[0].timestamp.split('T')[0]
    const lastDate = sortedRaw[sortedRaw.length - 1].timestamp.split('T')[0]
    dateRange = `${firstDate} to ${lastDate}`
    
    console.log('[GMB Metrics] - First entry (previous):', sortedRaw[0].timestamp, '=', previous)
    console.log('[GMB Metrics] - Last entry (current):', sortedRaw[sortedRaw.length - 1].timestamp, '=', current)
    console.log('[GMB Metrics] - Fallback date range:', dateRange)
  }
  // CASE 3: No history at all
  else {
    console.log('[GMB Metrics] ⚠️ No history data available - using current value only')
    previous = currentValue
    current = currentValue
  }
  
  // Calculate percentage change
  let change = 0
  if (previous !== 0) {
    change = ((current - previous) / previous) * 100
  } else if (current > 0) {
    change = 100 // If previous was 0 and current > 0, that's 100% increase
  }
  
  console.log('[GMB Metrics] - Final values: previous =', previous, ', current =', current, ', change =', change.toFixed(1) + '%')
  
  return {
    current,
    previous,
    change: Math.abs(change),
    isIncrease: current >= previous,
    dateRange
  }
}

// ============================================
// Main Dashboard Function
// ============================================

/**
 * Fetch GMB Metrics Dashboard Data
 * Returns KPI card data for GMB Score, Rating, and Reviews
 */
export async function fetchGMBMetricsDashboardData(
  datasourceId: string,
  options?: DashboardOptions
): Promise<GMBMetricsDashboardData | null> {
  try {
    console.log('[GMB Metrics Dashboard] Fetching metrics for datasource:', datasourceId)
    
    // Get profile info from database
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from("gmb_profiles")
      .select("profile_id, business_name, address")
      .eq("datasource_id", datasourceId)
      .single()
    
    if (profileError || !profile) {
      console.error("Profile not found for datasource:", datasourceId, profileError)
      return null
    }
    
    console.log('[GMB Metrics Dashboard] Profile found:', profile.profile_id, profile.business_name)
    
    // Get last completed month range for filtering
    const lastMonthRange = getLastCompletedMonthRange(options?.today)
    console.log('[GMB Metrics Dashboard] Target month range:', {
      label: lastMonthRange.label,
      start: lastMonthRange.startDateStr,
      end: lastMonthRange.endDateStr
    })
    
    // Calculate date range for cache key (use last month start/end)
    const cacheStartDate = lastMonthRange.startDateStr
    const cacheEndDate = lastMonthRange.endDateStr
    
    console.log('[GMB Metrics Dashboard] Cache date range:', { cacheStartDate, cacheEndDate })
    
    // Check cache first
    const cacheKey = `${profile.profile_id}-gmb-metrics`
    const cachedData = await getCachedDashboardData(datasourceId, cacheKey, cacheStartDate, cacheEndDate)
    if (cachedData) {
      console.log('[GMB Metrics Dashboard] ✓ Cache hit - returning cached data')
      return cachedData as GMBMetricsDashboardData
    }
    
    // Cache miss - fetch from API
    console.log('[GMB Metrics Dashboard] ⟳ Cache miss - fetching fresh data from API')
    
    // Fetch metrics from GMB API with 2 month interval
    // This ensures we have enough data even if profile was added recently
    // Example: If today is Jan 31, 2026, we fetch data from Dec 1, 2025 onwards
    const metricsResponse = await fetchGMBMetrics(
      profile.profile_id,
      2,           // interval: 2 (fetch at least 2 months of data)
      'month',     // intervalUnit: month
      'gmbscore,rating,review'
    )
    
    console.log('[GMB Metrics Dashboard] ========== RAW DATA FROM API ==========')
    console.log('[GMB Metrics Dashboard] Raw metrics response:', JSON.stringify(metricsResponse, null, 2))
    console.log('[GMB Metrics Dashboard] =====================================')
    
    if (!metricsResponse.success || !metricsResponse.data) {
      console.error('[GMB Metrics Dashboard] Failed to fetch metrics')
      return null
    }
    
    const { gmbscore, rating, review } = metricsResponse.data
    
    // Process each metric with filtering
    console.log('\n[GMB Metrics Dashboard] ========== PROCESSING GMB SCORE ==========')
    const gmbScoreData = gmbscore 
      ? processMetricData(gmbscore.current, gmbscore.history, lastMonthRange)
      : { current: 0, previous: 0, change: 0, isIncrease: true, dateRange: `${cacheStartDate} to ${cacheEndDate}` }
    
    console.log('\n[GMB Metrics Dashboard] ========== PROCESSING RATING ==========')
    const ratingData = rating
      ? processMetricData(rating.current, rating.history, lastMonthRange)
      : { current: 0, previous: 0, change: 0, isIncrease: true, dateRange: `${cacheStartDate} to ${cacheEndDate}` }
    
    console.log('\n[GMB Metrics Dashboard] ========== PROCESSING REVIEWS ==========')
    const reviewData = review
      ? processMetricData(review.current, review.history, lastMonthRange)
      : { current: 0, previous: 0, change: 0, isIncrease: true, dateRange: `${cacheStartDate} to ${cacheEndDate}` }
    
    console.log('\n[GMB Metrics Dashboard] ========== FILTERED DATA SUMMARY ==========')
    console.log('[GMB Metrics Dashboard] GMB Score:', gmbScoreData)
    console.log('[GMB Metrics Dashboard] Rating:', ratingData)
    console.log('[GMB Metrics Dashboard] Reviews:', reviewData)
    console.log('[GMB Metrics Dashboard] ======================================')
    
    // Build dashboard data
    const dashboardData: GMBMetricsDashboardData = {
      businessName: profile.business_name,
      address: profile.address || '',
      kpiCards: {
        gmbScore: gmbScoreData,
        rating: ratingData,
        reviews: reviewData
      }
    }
    
    // Save to cache
    console.log('[GMB Metrics Dashboard] Saving to cache')
    saveDashboardCache(datasourceId, cacheKey, cacheStartDate, cacheEndDate, dashboardData)
      .catch(err => console.error('[GMB Metrics Dashboard] Failed to save cache:', err))
    
    console.log('[GMB Metrics Dashboard] ✓ Successfully processed metrics')
    return dashboardData
  } catch (error) {
    console.error("[GMB Metrics Dashboard] Error fetching metrics:", error)
    throw error
  }
}
