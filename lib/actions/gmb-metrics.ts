/**
 * GMB Metrics Actions
 * Fetch and process GMB KPI metrics (GMB Score, Rating, Review)
 */

import { createClient } from "@/lib/supabase/server"
import { fetchGMBMetrics, type GMBMetricsResponse } from "@/lib/gmb/api"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"
import { calculateDashboardDateRanges } from "@/lib/utils/date-ranges"

// ============================================
// Type Definitions
// ============================================

export interface GMBKPICard {
  current: number
  previous: number
  change: number
  isIncrease: boolean
  periodType: string
  periodLabel: string
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
 * Compares current value vs last history entry (index 0)
 */
function processMetricData(
  currentValue: number,
  historyData: Array<{ timestamp: string; value: number }>
): {
  current: number
  previous: number
  change: number
  isIncrease: boolean
} {
  // Default: if no history, previous = current (no change)
  let previous = currentValue
  
  if (historyData && historyData.length > 0) {
    // Compare current vs first entry in history (oldest value for monthly comparison)
    previous = historyData[0].value
  }
  
  // Calculate percentage change
  let change = 0
  if (previous !== 0) {
    change = ((currentValue - previous) / previous) * 100
  } else if (currentValue > 0) {
    change = 100 // If previous was 0 and current > 0, that's 100% increase
  }
  
  return {
    current: currentValue,
    previous,
    change: Math.abs(change),
    isIncrease: currentValue >= previous
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
  datasourceId: string
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
    
    // Calculate date range for cache key
    const dateRanges = calculateDashboardDateRanges()
    const cacheStartDate = dateRanges.previousMonth.start
    const cacheEndDate = dateRanges.lastMonth.end
    
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
    
    // Fetch metrics from GMB API with 1 month interval
    const metricsResponse = await fetchGMBMetrics(
      profile.profile_id,
      1,           // interval: 1
      'month',     // intervalUnit: month
      'gmbscore,rating,review'
    )
    
    console.log('[GMB Metrics Dashboard] Metrics response:', JSON.stringify(metricsResponse, null, 2))
    
    if (!metricsResponse.success || !metricsResponse.data) {
      console.error('[GMB Metrics Dashboard] Failed to fetch metrics')
      return null
    }
    
    const { gmbscore, rating, review } = metricsResponse.data
    
    // Period label for 1 month comparison
    const periodType = '1-month'
    const periodLabel = '1-month comparison'
    
    // Process each metric
    const gmbScoreData = gmbscore 
      ? processMetricData(gmbscore.current, gmbscore.history)
      : { current: 0, previous: 0, change: 0, isIncrease: true }
    
    const ratingData = rating
      ? processMetricData(rating.current, rating.history)
      : { current: 0, previous: 0, change: 0, isIncrease: true }
    
    const reviewData = review
      ? processMetricData(review.current, review.history)
      : { current: 0, previous: 0, change: 0, isIncrease: true }
    
    // Build dashboard data
    const dashboardData: GMBMetricsDashboardData = {
      businessName: profile.business_name,
      address: profile.address || '',
      kpiCards: {
        gmbScore: {
          ...gmbScoreData,
          periodType,
          periodLabel
        },
        rating: {
          ...ratingData,
          periodType,
          periodLabel
        },
        reviews: {
          ...reviewData,
          periodType,
          periodLabel
        }
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
