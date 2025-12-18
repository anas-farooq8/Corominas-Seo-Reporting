import { v4 as uuidv4 } from "uuid"
import { calculateDashboardDateRanges } from "@/lib/utils/date-ranges"

// ============================================
// SEMrush API Types
// ============================================

export interface SEMrushOverviewTrendItem {
  date: string // YYYYMMDD format
  organicPositions: number
  organicPositionsTrend: number[] // Array of 11 values
  organicTraffic: number
  aiOverviewPositions: number
  serpFeaturesPositionsWithoutAiOverview: number
  // Other fields from the API response
  adwordsPositions?: number
  adwordsTraffic?: number
  adwordsTrafficCost?: number
  organicTrafficCost?: number
  traffic?: number
  trafficCost?: number
}

export interface SEMrushParsedDailyData {
  date: string // YYYYMMDD format
  top3: number
  top4to10: number
  top11to20: number
  top21to50: number
  top51to100: number
  aiOverviews: number
  serpFunctions: number
  totalKeywords: number
}

// ============================================
// SEMrush API Client
// ============================================

const SEMRUSH_API_URL = "https://de.semrush.com/dpa/rpc"

const HEADERS = {
  "accept": "*/*",
  "accept-language": "en-US,en;q=0.9",
  "content-type": "application/json",
  "origin": "https://de.semrush.com",
  "referer": "https://de.semrush.com/analytics/overview/",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
}

/**
 * Fetch SEMrush organic overview trend data
 * @param searchItem - The domain to fetch data for
 * @param database - The database to search in (default: "us")
 */
export async function fetchSEMrushOverviewTrend(
  searchItem: string,
  database: string = "us"
): Promise<SEMrushOverviewTrendItem[]> {
  const apiKey = process.env.SEMRUSH_API_KEY
  const userId = process.env.SEMRUSH_USER_ID

  if (!apiKey || !userId) {
    throw new Error("SEMRUSH_API_KEY or SEMRUSH_USER_ID environment variables are not set")
  }

  const payload = {
    jsonrpc: "2.0",
    method: "organic.OverviewTrend",
    params: {
      request_id: uuidv4(),
      report: "domain.overview",
      args: {
        dateType: "daily",
        searchItem: searchItem,
        searchType: "domain",
        database: database,
        global: true
      },
      apiKey: apiKey,
      userId: userId
    }
  }

  try {
    console.log(`[SEMrush API] Fetching data for domain: ${searchItem}`)
    
    const response = await fetch(SEMRUSH_API_URL, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`SEMrush API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`SEMrush API error: ${JSON.stringify(data.error)}`)
    }

    if (!data.result || !Array.isArray(data.result)) {
      throw new Error("Invalid response format from SEMrush API")
    }

    console.log(`[SEMrush API] Received ${data.result.length} data points`)
    
    return data.result as SEMrushOverviewTrendItem[]
  } catch (error) {
    console.error("[SEMrush API] Fetch failed:", error)
    throw error
  }
}

/**
 * Filter SEMrush data by date range
 * @param data - The raw data from SEMrush API
 * @param startDate - Start date in YYYYMMDD format
 * @param endDate - End date in YYYYMMDD format
 */
export function filterByDateRange(
  data: SEMrushOverviewTrendItem[],
  startDate: string,
  endDate: string
): SEMrushOverviewTrendItem[] {
  const filtered = data.filter(row => {
    const rowDate = row.date
    return rowDate >= startDate && rowDate <= endDate
  })

  console.log(`[SEMrush Filter] Filtered from ${data.length} to ${filtered.length} rows`)
  if (filtered.length > 0) {
    console.log(`[SEMrush Filter] Date range: ${filtered[0].date} → ${filtered[filtered.length - 1].date}`)
  }

  return filtered
}

/**
 * Parse SEMrush data according to the ranking distribution
 * organicPositionsTrend[0] → Top 3
 * organicPositionsTrend[1] → 4-10
 * organicPositionsTrend[2] → 11-20
 * organicPositionsTrend[3] + [4] + [5] → 21-50
 * organicPositionsTrend[6] + [7] + [8] + [9] + [10] → 51-100
 * aiOverviewPositions → AI Overviews
 * serpFeaturesPositionsWithoutAiOverview → SERP functions
 */
export function parseSEMrushData(
  data: SEMrushOverviewTrendItem[]
): SEMrushParsedDailyData[] {
  return data.map(row => {
    const trend = row.organicPositionsTrend || []
    
    const top3 = trend[0] || 0
    const top4to10 = trend[1] || 0
    const top11to20 = trend[2] || 0
    const top21to50 = (trend[3] || 0) + (trend[4] || 0) + (trend[5] || 0)
    const top51to100 = (trend[6] || 0) + (trend[7] || 0) + (trend[8] || 0) + (trend[9] || 0) + (trend[10] || 0)
    const aiOverviews = row.aiOverviewPositions || 0
    const serpFunctions = row.serpFeaturesPositionsWithoutAiOverview || 0
    
    // Calculate total keywords
    const totalKeywords = top3 + top4to10 + top11to20 + top21to50 + top51to100 + aiOverviews + serpFunctions

    return {
      date: row.date,
      top3,
      top4to10,
      top11to20,
      top21to50,
      top51to100,
      aiOverviews,
      serpFunctions,
      totalKeywords
    }
  })
}

/**
 * Fetch and process SEMrush data
 * This is the main function to use for fetching dashboard data
 */
export async function fetchSEMrushDashboardData(domain: string, database: string = "us") {
  const dateRanges = calculateDashboardDateRanges()
  
  // Fetch raw data from SEMrush
  const rawData = await fetchSEMrushOverviewTrend(domain, database)
  
  // Filter by date range
  const filteredData = filterByDateRange(rawData, dateRanges.startDateAPI, dateRanges.endDateAPI)
  
  // Parse the data
  const parsedData = parseSEMrushData(filteredData)
  
  // Calculate monthly totals for comparison
  const lastMonthTotal = calculateMonthlyTotal(parsedData, dateRanges.lastMonth.startAPI, dateRanges.lastMonth.endAPI)
  const previousMonthTotal = calculateMonthlyTotal(parsedData, dateRanges.previousMonth.startAPI, dateRanges.previousMonth.endAPI)
  
  return {
    dailyData: parsedData,
    lastMonthTotal,
    previousMonthTotal,
    dateRanges: {
      startDate: dateRanges.startDate,
      endDate: dateRanges.endDate
    }
  }
}

/**
 * Calculate total keywords for a specific month
 */
function calculateMonthlyTotal(
  data: SEMrushParsedDailyData[],
  startDate: string,
  endDate: string
): number {
  const monthData = data.filter(day => day.date >= startDate && day.date <= endDate)
  
  if (monthData.length === 0) return 0
  
  // Use the last day of the month for the total
  const lastDay = monthData[monthData.length - 1]
  return lastDay.totalKeywords
}

