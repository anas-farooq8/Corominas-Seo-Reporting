/**
 * GMB (Grid My Business) Dashboard Actions
 * Fetch and process keyword ranking data for dashboard display
 */

import { createClient } from "@/lib/supabase/server"
import { listKeywords, type GMBKeyword, type GMBScanId } from "@/lib/gmb/api"
import { getLast2CompletedMonths, filterByMonth } from "@/lib/utils/date-ranges"

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

export interface GMBDashboardData {
  profileId: string
  businessName: string
  address: string
  keywords: GMBKeywordData[]
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
 * Fetch all data needed for the GMB keywords dashboard
 * @param datasourceId - The datasource ID
 */
export async function fetchGMBDashboardData(
  datasourceId: string
): Promise<GMBDashboardData | null> {
  try {
    console.log('[GMB Dashboard] Fetching dashboard data for datasource:', datasourceId)
    
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
    
    console.log('[GMB Dashboard] Profile found:', profile.profile_id, profile.business_name)
    
    // Fetch keywords from GMB API
    const keywords = await listKeywords(profile.profile_id)
    
    console.log('[GMB Dashboard] Fetched', keywords.length, 'keywords')
    
    // Process keyword data and filter by months
    const { keywordData, monthLabels } = processKeywordData(keywords)
    
    console.log('[GMB Dashboard] Processed keywords:', keywordData.length)
    console.log('[GMB Dashboard] Month labels:', monthLabels)
    
    return {
      profileId: profile.profile_id,
      businessName: profile.business_name,
      address: profile.address || '',
      keywords: keywordData,
      monthLabels
    }
  } catch (error) {
    console.error("[GMB Dashboard] Error fetching dashboard data:", error)
    throw error
  }
}
