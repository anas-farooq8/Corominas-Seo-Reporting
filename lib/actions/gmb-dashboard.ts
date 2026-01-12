/**
 * GMB (Grid My Business) Dashboard Actions
 * Fetch and process keyword ranking data for dashboard display
 */

import { createClient } from "@/lib/supabase/server"
import { 
  listKeywords, 
  getFreshAccessToken, 
  getGridReportWithToken, 
  type GMBKeyword, 
  type GMBScanId 
} from "@/lib/gmb/api"
import { getLast2CompletedMonths, filterByMonth } from "@/lib/utils/date-ranges"
import { 
  aggregateGridScans, 
  compareGrids, 
  calculateGridStats, 
  fetchGridReportsParallel,
  selectBestKeyword,
  type AggregatedGrid,
  type GridComparison,
  type GridStats,
  type KeywordWithGrid
} from "@/lib/gmb/grid-utils"

// ============================================
// Type Definitions
// ============================================

export interface GMBKeywordData {
  keyword: string
  keywordId: string // profileId from GMB
  lastMonthScans: GMBScanId[]
  previousMonthScans: GMBScanId[]
  lastMonthCount: number
  previousMonthCount: number
}

export interface GMBKeywordGridData extends GMBKeywordData {
  previousMonthGrid: AggregatedGrid | null
  lastMonthGrid: AggregatedGrid | null
  gridComparison: GridComparison[]
  gridStats: GridStats
}

export interface GMBGridDashboardData {
  profileId: string
  businessName: string
  address: string
  keywords: GMBKeywordGridData[]
  bestKeyword: GMBKeywordGridData | null
  monthLabels: {
    last: string
    previous: string
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Process keyword data and filter scans by month
 */
function processKeywordData(keywords: GMBKeyword[]): {
  keywordData: GMBKeywordData[]
  monthLabels: { last: string, previous: string }
} {
  const months = getLast2CompletedMonths()
  
  // ============================================
  // 🧪 TESTING ONLY: +1 MONTH OFFSET FOR GMB
  // ============================================
  // This shifts the date range forward by 1 month to simulate future data
  // TODO: REMOVE THIS BEFORE PRODUCTION - Testing purposes only
  // ============================================
  
  // Calculate next month's dates by adding 1 month to the existing ranges
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
  
  console.log('🧪 [GMB TEST MODE] Original months:', {
    last: months.lastMonth.label,
    previous: months.previousMonth.label
  })
  console.log('🧪 [GMB TEST MODE] Test months (+1):', {
    last: testMonths.lastMonth.label,
    previous: testMonths.previousMonth.label
  })
  
  // Use test months instead of real months
  const monthsToUse = testMonths
  // ============================================
  // 🧪 END TESTING CODE
  // ============================================
  
  const keywordData: GMBKeywordData[] = keywords.map(kw => {
    // Filter scans for last month
    const lastMonthScans = filterByMonth(
      kw.profileIds,
      monthsToUse.lastMonth.startTimestamp,
      monthsToUse.lastMonth.endTimestamp
    )
    
    // Filter scans for previous month
    const previousMonthScans = filterByMonth(
      kw.profileIds,
      monthsToUse.previousMonth.startTimestamp,
      monthsToUse.previousMonth.endTimestamp
    )
    
    return {
      keyword: kw.keyword,
      keywordId: kw.profileId,
      lastMonthScans,
      previousMonthScans,
      lastMonthCount: lastMonthScans.length,
      previousMonthCount: previousMonthScans.length
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
 * Fetch GMB Grid Dashboard Data with aggregated grid heatmaps
 * This includes fetching all grid reports for each keyword's scans
 * and aggregating them into monthly grids
 * 
 * @param datasourceId - The datasource ID
 * @param concurrency - Number of parallel requests (default: 5)
 */
export async function fetchGMBGridDashboardData(
  datasourceId: string,
  concurrency: number = 5
): Promise<GMBGridDashboardData | null> {
  try {
    console.log('[GMB Grid Dashboard] Fetching grid dashboard data for datasource:', datasourceId)
    
    // Get the profile info from database
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
    
    // Fetch keywords from GMB API
    const keywords = await listKeywords(profile.profile_id)
    
    console.log('[GMB Grid Dashboard] Fetched', keywords.length, 'keywords')
    
    // Process keyword data and filter by months
    const { keywordData, monthLabels } = processKeywordData(keywords)
    
    console.log('[GMB Grid Dashboard] Processing grid data for', keywordData.length, 'keywords')
    
    // Collect all scan IDs by month across all keywords
    console.log('[GMB Grid Dashboard] Collecting scan IDs by month...')
    const allLastMonthScanIds: string[] = []
    const allPreviousMonthScanIds: string[] = []
    
    for (const kw of keywordData) {
      allLastMonthScanIds.push(...kw.lastMonthScans.map(s => s._id))
      allPreviousMonthScanIds.push(...kw.previousMonthScans.map(s => s._id))
    }
    
    console.log(`[GMB Grid Dashboard] Total last month scans: ${allLastMonthScanIds.length}`)
    console.log(`[GMB Grid Dashboard] Total previous month scans: ${allPreviousMonthScanIds.length}`)
    
    // Fetch all last month reports first (in parallel batches)
    console.log('[GMB Grid Dashboard] 📅 Fetching LAST MONTH reports...')
    const lastMonthReportsAll = await fetchGridReportsParallel(
      allLastMonthScanIds,
      getFreshAccessToken,
      getGridReportWithToken,
      concurrency
    )
    
    // Then fetch all previous month reports (in parallel batches)
    console.log('[GMB Grid Dashboard] 📅 Fetching PREVIOUS MONTH reports...')
    const previousMonthReportsAll = await fetchGridReportsParallel(
      allPreviousMonthScanIds,
      getFreshAccessToken,
      getGridReportWithToken,
      concurrency
    )
    
    // Create maps for quick lookup by scan ID
    const lastMonthReportsMap = new Map<string, typeof lastMonthReportsAll[0]>()
    for (const report of lastMonthReportsAll) {
      lastMonthReportsMap.set(report._id, report)
    }
    
    const previousMonthReportsMap = new Map<string, typeof previousMonthReportsAll[0]>()
    for (const report of previousMonthReportsAll) {
      previousMonthReportsMap.set(report._id, report)
    }
    
    // Process each keyword with the fetched reports
    const keywordGridData: GMBKeywordGridData[] = []
    
    for (const kw of keywordData) {
      console.log(`[GMB Grid Dashboard] Processing keyword: ${kw.keyword}`)
      
      // Get reports for this keyword's scans
      const lastMonthReports = kw.lastMonthScans
        .map(s => lastMonthReportsMap.get(s._id))
        .filter((r): r is NonNullable<typeof r> => r !== undefined)
      
      const previousMonthReports = kw.previousMonthScans
        .map(s => previousMonthReportsMap.get(s._id))
        .filter((r): r is NonNullable<typeof r> => r !== undefined)
      
      console.log(`  - Last month reports fetched: ${lastMonthReports.length}/${kw.lastMonthScans.length}`)
      console.log(`  - Previous month reports fetched: ${previousMonthReports.length}/${kw.previousMonthScans.length}`)
      
      // Aggregate grids
      const lastMonthGrid = aggregateGridScans(lastMonthReports)
      const previousMonthGrid = aggregateGridScans(previousMonthReports)
      
      // Compare grids
      const gridComparison = compareGrids(previousMonthGrid, lastMonthGrid)
      
      // Calculate stats
      const gridStats = calculateGridStats(lastMonthGrid, gridComparison)
      
      console.log(`  - Grid stats:`, {
        totalCells: gridStats.totalCells,
        improved: gridStats.improved,
        worsened: gridStats.worsened,
        avgPosition: gridStats.averagePosition?.toFixed(1)
      })
      
      keywordGridData.push({
        ...kw,
        previousMonthGrid,
        lastMonthGrid,
        gridComparison,
        gridStats
      })
    }
    
    console.log('[GMB Grid Dashboard] Successfully processed all keyword grids')
    
    // Select the best keyword to display
    const bestKeywordSelection = selectBestKeyword(keywordGridData)
    
    // Find the matching full keyword data
    const bestKeyword = bestKeywordSelection 
      ? keywordGridData.find(kw => kw.keywordId === bestKeywordSelection.keywordId) ?? null
      : null
    
    if (bestKeyword) {
      console.log(`[GMB Grid Dashboard] 🏆 Best keyword: "${bestKeyword.keyword}"`)
    } else {
      console.log('[GMB Grid Dashboard] ⚠️ No best keyword could be selected (no grid data)')
    }
    
    return {
      profileId: profile.profile_id,
      businessName: profile.business_name,
      address: profile.address || '',
      keywords: keywordGridData,
      bestKeyword,
      monthLabels
    }
  } catch (error) {
    console.error("[GMB Grid Dashboard] Error fetching grid dashboard data:", error)
    throw error
  }
}
