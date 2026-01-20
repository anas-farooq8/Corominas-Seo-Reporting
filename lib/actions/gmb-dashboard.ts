/**
 * GMB (Grid My Business) Dashboard Actions
 * Fetch and process keyword ranking data for dashboard display
 */

import { createClient } from "@/lib/supabase/server"
import { 
  listKeywords, 
  getFreshAccessToken, 
  getGridReportWithToken, 
  type GMBKeyword
} from "@/lib/gmb/api"
import { getLast2CompletedMonths, filterByMonth, calculateDashboardDateRanges } from "@/lib/utils/date-ranges"
import { 
  aggregateGridScans, 
  compareGrids, 
  calculateGridStats, 
  fetchGridReportsParallel,
  selectBestKeyword
} from "@/lib/gmb/grid-utils"
import { getCachedDashboardData, saveDashboardCache } from "@/lib/cache/dashboard-cache"

// ============================================
// Type Definitions
// ============================================

/**
 * KPI Card Data for GMB Grid metrics
 */
export interface GMBKPICardData {
  localPackCoverage: {
    current: number // Percentage (0-100)
    previous: number // Percentage (0-100)
    change: number // Percentage point change
    isIncrease: boolean
    periodLabel: string
  }
  averagePosition: {
    current: number
    previous: number
    change: number
    isIncrease: boolean
    periodLabel: string
  }
}

/**
 * Simplified heatmap cell data for storage
 */
export interface GMBHeatmapCell {
  lat: number
  lng: number
  last: number | null
  previous: number | null
}

/**
 * Optimized data structure for Supabase storage and API response
 */
export interface GMBGridDashboardCacheData {
  keyword: string
  address: string
  gridSize: number
  radius: number
  centerLat: number
  centerLng: number
  kpiCards: GMBKPICardData
  heatmapData: GMBHeatmapCell[]
  monthLabels: {
    last: string
    previous: string
  }
}

// For backward compatibility with UI components
export type GMBGridDashboardData = GMBGridDashboardCacheData & {
  profileId?: string
  businessName?: string
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate KPI cards from grid data
 */
function calculateGMBKPICards(
  lastMonthCells: GMBHeatmapCell[],
  monthLabels: { last: string, previous: string }
): GMBKPICardData {
  // Filter cells with valid data
  const currentCells = lastMonthCells.filter(c => c.last !== null)
  const previousCells = lastMonthCells.filter(c => c.previous !== null)
  
  if (currentCells.length === 0) {
    return {
      localPackCoverage: {
        current: 0,
        previous: 0,
        change: 0,
        isIncrease: false,
        periodLabel: `${monthLabels.last} vs ${monthLabels.previous}`
      },
      averagePosition: {
        current: 0,
        previous: 0,
        change: 0,
        isIncrease: false,
        periodLabel: `${monthLabels.last} vs ${monthLabels.previous}`
      }
    }
  }
  
  // Current month Local Pack coverage
  const currentTop3Count = currentCells.filter(c => c.last! <= 3).length
  const currentCoverage = (currentTop3Count / currentCells.length) * 100
  
  // Previous month Local Pack coverage
  let previousCoverage = 0
  if (previousCells.length > 0) {
    const previousTop3Count = previousCells.filter(c => c.previous! <= 3).length
    previousCoverage = (previousTop3Count / previousCells.length) * 100
  }
  
  // Coverage change
  const coverageChange = currentCoverage - previousCoverage
  
  // Average Position
  const currentAvgPosition = currentCells.reduce((sum, c) => sum + c.last!, 0) / currentCells.length
  const previousAvgPosition = previousCells.length > 0
    ? previousCells.reduce((sum, c) => sum + c.previous!, 0) / previousCells.length
    : null
  
  // Position change (only calculate if we have previous data)
  const positionChange = previousAvgPosition !== null && previousAvgPosition > 0
    ? currentAvgPosition - previousAvgPosition
    : 0
  
  console.log('\n=== GMB KPI CALCULATIONS ===')
  console.log(`Local Pack Coverage (Top 3):`)
  console.log(`  Current: ${currentTop3Count}/${currentCells.length} = ${currentCoverage.toFixed(1)}%`)
  console.log(`  Previous: ${previousCells.length > 0 ? `${previousCells.filter(c => c.previous! <= 3).length}/${previousCells.length} = ${previousCoverage.toFixed(1)}%` : 'N/A'}`)
  console.log(`  Change: ${coverageChange >= 0 ? '+' : ''}${coverageChange.toFixed(1)}%`)
  console.log(`Average Position:`)
  console.log(`  Current: ${currentAvgPosition.toFixed(2)}`)
  console.log(`  Previous: ${previousAvgPosition !== null ? previousAvgPosition.toFixed(2) : 'N/A'}`)
  console.log(`  Change: ${positionChange >= 0 ? '+' : ''}${positionChange.toFixed(2)}`)
  console.log('============================\n')
  
  return {
    localPackCoverage: {
      current: currentCoverage,
      previous: previousCoverage,
      change: Math.abs(coverageChange),
      isIncrease: coverageChange > 0,
      periodLabel: previousCells.length > 0 
        ? `${monthLabels.last} vs ${monthLabels.previous}`
        : `${monthLabels.last} only`
    },
    averagePosition: {
      current: currentAvgPosition,
      previous: previousAvgPosition ?? 0,
      change: Math.abs(positionChange),
      isIncrease: positionChange > 0,
      periodLabel: previousCells.length > 0 
        ? `${monthLabels.last} vs ${monthLabels.previous}`
        : `${monthLabels.last} only`
    }
  }
}

/**
 * Process keyword data and filter scans by month
 */
function processKeywordData(keywords: GMBKeyword[]): {
  keywordData: Array<{
    keyword: string
    keywordId: string
    lastMonthScans: Array<{ _id: string }>
    previousMonthScans: Array<{ _id: string }>
  }>
  monthLabels: { last: string, previous: string }
} {
  const months = getLast2CompletedMonths()
  
  // ============================================
  // 🧪 TESTING ONLY: +1 MONTH OFFSET FOR GMB
  // ============================================
  const testLastMonthStart = new Date(months.lastMonth.start)
  testLastMonthStart.setMonth(testLastMonthStart.getMonth() + 1)
  
  const testLastMonthEnd = new Date(months.lastMonth.end)
  testLastMonthEnd.setMonth(testLastMonthEnd.getMonth() + 1)
  const lastDayOfTestMonth = new Date(testLastMonthEnd.getFullYear(), testLastMonthEnd.getMonth() + 1, 0)
  testLastMonthEnd.setDate(lastDayOfTestMonth.getDate())
  
  const testPreviousMonthStart = new Date(months.previousMonth.start)
  testPreviousMonthStart.setMonth(testPreviousMonthStart.getMonth() + 1)
  
  const testPreviousMonthEnd = new Date(months.previousMonth.end)
  testPreviousMonthEnd.setMonth(testPreviousMonthEnd.getMonth() + 1)
  const lastDayOfTestPrevMonth = new Date(testPreviousMonthEnd.getFullYear(), testPreviousMonthEnd.getMonth() + 1, 0)
  testPreviousMonthEnd.setDate(lastDayOfTestPrevMonth.getDate())
  
  const testMonths = {
    lastMonth: {
      start: testLastMonthStart,
      end: testLastMonthEnd,
      startTimestamp: testLastMonthStart.getTime(),
      endTimestamp: new Date(testLastMonthEnd.getFullYear(), testLastMonthEnd.getMonth(), testLastMonthEnd.getDate(), 23, 59, 59, 999).getTime(),
      label: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][testLastMonthStart.getMonth()]} ${testLastMonthStart.getFullYear()}`
    },
    previousMonth: {
      start: testPreviousMonthStart,
      end: testPreviousMonthEnd,
      startTimestamp: testPreviousMonthStart.getTime(),
      endTimestamp: new Date(testPreviousMonthEnd.getFullYear(), testPreviousMonthEnd.getMonth(), testPreviousMonthEnd.getDate(), 23, 59, 59, 999).getTime(),
      label: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][testPreviousMonthStart.getMonth()]} ${testPreviousMonthStart.getFullYear()}`
    }
  }
  
  const monthsToUse = testMonths
  // ============================================
  // 🧪 END TESTING CODE
  // ============================================
  
  console.log(`\n📅 [GMB Dashboard] Filtering scans by month:`)
  console.log(`   Last Month: ${monthsToUse.lastMonth.label} (${new Date(monthsToUse.lastMonth.startTimestamp).toISOString()} to ${new Date(monthsToUse.lastMonth.endTimestamp).toISOString()})`)
  console.log(`   Previous Month: ${monthsToUse.previousMonth.label} (${new Date(monthsToUse.previousMonth.startTimestamp).toISOString()} to ${new Date(monthsToUse.previousMonth.endTimestamp).toISOString()})`)
  
  const keywordData = keywords.map(kw => {
    const lastMonthScans = filterByMonth(
      kw.profileIds,
      monthsToUse.lastMonth.startTimestamp,
      monthsToUse.lastMonth.endTimestamp
    )
    
    const previousMonthScans = filterByMonth(
      kw.profileIds,
      monthsToUse.previousMonth.startTimestamp,
      monthsToUse.previousMonth.endTimestamp
    )
    
    console.log(`   Keyword "${kw.keyword}": ${lastMonthScans.length} scans in ${monthsToUse.lastMonth.label}, ${previousMonthScans.length} scans in ${monthsToUse.previousMonth.label}`)
    
    // Debug: Show which scans passed the filter
    if (lastMonthScans.length > 0) {
      console.log(`      Last month scans: ${lastMonthScans.map(s => `${s._id.substring(0, 8)} (${new Date(s.dateAdded).toISOString()})`).join(', ')}`)
    }
    if (previousMonthScans.length > 0) {
      console.log(`      Previous month scans: ${previousMonthScans.map(s => `${s._id.substring(0, 8)} (${new Date(s.dateAdded).toISOString()})`).join(', ')}`)
    }
    
    return {
      keyword: kw.keyword,
      keywordId: kw.profileId,
      lastMonthScans,
      previousMonthScans
    }
  })
  
  return {
    keywordData,
    monthLabels: {
      last: monthsToUse.lastMonth.label,
      previous: monthsToUse.previousMonth.label
    }
  }
}

// ============================================
// Main Dashboard Function
// ============================================

/**
 * Fetch GMB Grid Dashboard Data
 * Returns optimized data structure for storage and display
 */
export async function fetchGMBGridDashboardData(
  datasourceId: string,
  concurrency: number = 5
): Promise<GMBGridDashboardData | null> {
  try {
    console.log('[GMB Grid Dashboard] Fetching grid dashboard data for datasource:', datasourceId)
    
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
    
    console.log('[GMB Grid Dashboard] Profile found:', profile.profile_id, profile.business_name)
    
    // Calculate date range for cache key (use consistent formatting across all dashboards)
    // Use calculateDashboardDateRanges() which formats dates correctly without timezone issues
    const dateRanges = calculateDashboardDateRanges()
    const cacheStartDate = dateRanges.previousMonth.start
    const cacheEndDate = dateRanges.lastMonth.end
    
    console.log('[GMB Grid Dashboard] Cache date range:', { cacheStartDate, cacheEndDate })
    
    // Check cache first
    const cacheKey = `${profile.profile_id}-gmb-grid`
    const cachedData = await getCachedDashboardData(datasourceId, cacheKey, cacheStartDate, cacheEndDate)
    if (cachedData) {
      console.log('[GMB Grid Dashboard] ✓ Cache hit - returning cached data')
      return {
        ...cachedData as GMBGridDashboardCacheData,
        profileId: profile.profile_id,
        businessName: profile.business_name
      }
    }
    
    // Cache miss - fetch from API
    console.log('[GMB Grid Dashboard] ⟳ Cache miss - fetching fresh data from API')
    
    // Fetch keywords from GMB API
    const keywords = await listKeywords(profile.profile_id)
    console.log('[GMB Grid Dashboard] Fetched', keywords.length, 'keywords')
    
    // Process keyword data and filter by months
    const { keywordData, monthLabels } = processKeywordData(keywords)
    console.log('[GMB Grid Dashboard] Processing grid data for', keywordData.length, 'keywords')
    
    // Collect all scan IDs
    const allLastMonthScanIds: string[] = []
    const allPreviousMonthScanIds: string[] = []
    
    for (const kw of keywordData) {
      allLastMonthScanIds.push(...kw.lastMonthScans.map(s => s._id))
      allPreviousMonthScanIds.push(...kw.previousMonthScans.map(s => s._id))
    }
    
    console.log(`[GMB Grid Dashboard] Total scans: ${allLastMonthScanIds.length} last month, ${allPreviousMonthScanIds.length} previous month`)
    
    // Fetch all grid reports in parallel
    console.log('[GMB Grid Dashboard] 📅 Fetching grid reports...')
    const [lastMonthReportsAll, previousMonthReportsAll] = await Promise.all([
      fetchGridReportsParallel(allLastMonthScanIds, getFreshAccessToken, getGridReportWithToken, concurrency),
      fetchGridReportsParallel(allPreviousMonthScanIds, getFreshAccessToken, getGridReportWithToken, concurrency)
    ])
    
    // Create maps for lookup
    const lastMonthReportsMap = new Map(lastMonthReportsAll.map(r => [r._id, r]))
    const previousMonthReportsMap = new Map(previousMonthReportsAll.map(r => [r._id, r]))
    
    // Process each keyword
    const keywordsWithGrids = []
    
    for (const kw of keywordData) {
      const lastMonthReports = kw.lastMonthScans
        .map(s => lastMonthReportsMap.get(s._id))
        .filter((r): r is NonNullable<typeof r> => r !== undefined)
      
      const previousMonthReports = kw.previousMonthScans
        .map(s => previousMonthReportsMap.get(s._id))
        .filter((r): r is NonNullable<typeof r> => r !== undefined)
      
      const lastMonthGrid = aggregateGridScans(lastMonthReports)
      const previousMonthGrid = aggregateGridScans(previousMonthReports)
      
      if (lastMonthGrid || previousMonthGrid) {
        const gridComparison = compareGrids(previousMonthGrid, lastMonthGrid)
        const gridStats = calculateGridStats(lastMonthGrid, gridComparison)
        
        keywordsWithGrids.push({
          keyword: kw.keyword,
          keywordId: kw.keywordId,
          previousMonthGrid,
          lastMonthGrid,
          gridStats
        })
      }
    }
    
    // Select best keyword
    const bestKeyword = selectBestKeyword(keywordsWithGrids)
    
    if (!bestKeyword || !bestKeyword.lastMonthGrid) {
      console.log('[GMB Grid Dashboard] ⚠️ No grid data available')
      return null
    }
    
    console.log(`[GMB Grid Dashboard] 🏆 Best keyword: "${bestKeyword.keyword}"`)
    
    // Build heatmap data
    const heatmapData: GMBHeatmapCell[] = []
    const coordMap = new Map<string, { last: number | null; previous: number | null }>()
    
    // Add last month data
    if (bestKeyword.lastMonthGrid) {
      for (const cell of bestKeyword.lastMonthGrid.cells) {
        const key = `${cell.lat.toFixed(6)},${cell.lng.toFixed(6)}`
        coordMap.set(key, { last: cell.position, previous: null })
      }
    }
    
    // Add/merge previous month data
    if (bestKeyword.previousMonthGrid) {
      for (const cell of bestKeyword.previousMonthGrid.cells) {
        const key = `${cell.lat.toFixed(6)},${cell.lng.toFixed(6)}`
        const existing = coordMap.get(key)
        if (existing) {
          existing.previous = cell.position
        } else {
          coordMap.set(key, { last: null, previous: cell.position })
        }
      }
    }
    
    // Convert to array (maintain full precision)
    for (const [key, data] of coordMap.entries()) {
      const [latStr, lngStr] = key.split(',')
      heatmapData.push({
        lat: parseFloat(latStr), // Full precision maintained
        lng: parseFloat(lngStr), // Full precision maintained
        last: data.last,
        previous: data.previous
      })
    }
    
    // Calculate center from heatmap data
    const centerLat = heatmapData.length > 0
      ? heatmapData.reduce((sum, c) => sum + c.lat, 0) / heatmapData.length
      : 0
    const centerLng = heatmapData.length > 0
      ? heatmapData.reduce((sum, c) => sum + c.lng, 0) / heatmapData.length
      : 0
    
    // Calculate KPI cards
    const kpiCards = calculateGMBKPICards(heatmapData, monthLabels)
    
    // Build final data structure
    const dashboardData: GMBGridDashboardCacheData = {
      keyword: bestKeyword.keyword,
      address: profile.address || '',
      gridSize: bestKeyword.lastMonthGrid.gridSize,
      radius: bestKeyword.lastMonthGrid.distance,
      centerLat,
      centerLng,
      kpiCards,
      heatmapData,
      monthLabels
    }
    
    // Save to cache
    console.log('[GMB Grid Dashboard] Saving to cache:', {
      keyword: dashboardData.keyword,
      heatmapCells: dashboardData.heatmapData.length,
      gridSize: dashboardData.gridSize
    })
    
    saveDashboardCache(datasourceId, cacheKey, cacheStartDate, cacheEndDate, dashboardData)
      .catch(err => console.error('[GMB Grid Dashboard] Failed to save cache:', err))
    
    return {
      ...dashboardData,
      profileId: profile.profile_id,
      businessName: profile.business_name
    }
  } catch (error) {
    console.error("[GMB Grid Dashboard] Error fetching grid dashboard data:", error)
    throw error
  }
}
