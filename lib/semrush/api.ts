import { v4 as uuidv4 } from "uuid"
import { calculateDashboardDateRanges, calculateSemrushDateRanges } from "@/lib/utils/date-ranges"

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
  // totalKeywords is computed, not stored: top3 + top4to10 + top11to20 + top21to50 + top51to100 + aiOverviews + serpFunctions
  get totalKeywords(): number
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

  // Create abort controller with 30 second timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(SEMRUSH_API_URL, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

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
    
    return data.result as SEMrushOverviewTrendItem[]
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('SEMrush API request timed out after 30 seconds')
    }
    console.error("[SEMrush API] Fetch failed:", error)
    throw error
  }
}

/**
 * Filter SEMrush data by date range
 * @param data - The raw data from SEMrush API
 * @param startDate - Start date in YYYYMMDD format (optional - if not provided, includes all data from beginning)
 * @param endDate - End date in YYYYMMDD format
 */
export function filterByDateRange(
  data: SEMrushOverviewTrendItem[],
  startDate: string | undefined,
  endDate: string
): SEMrushOverviewTrendItem[] {
  return data.filter(row => {
    const rowDate = row.date
    // If no start date, only filter by end date
    if (!startDate) {
      return rowDate <= endDate
    }
    return rowDate >= startDate && rowDate <= endDate
  })
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
    
    // Return object with getter for totalKeywords
    return {
      date: row.date,
      top3,
      top4to10,
      top11to20,
      top21to50,
      top51to100,
      aiOverviews,
      serpFunctions,
      // Computed property: totalKeywords
      get totalKeywords() {
        return this.top3 + this.top4to10 + this.top11to20 + this.top21to50 + this.top51to100 + this.aiOverviews + this.serpFunctions
      }
    }
  })
}

/**
 * Fetch and process SEMrush data
 * This is the main function to use for fetching dashboard data
 * @param domain - The domain to fetch data for
 * @param startDate - Start date in YYYY-MM-DD format (optional, will calculate if not provided)
 * @param endDate - End date in YYYY-MM-DD format (optional, will calculate if not provided)
 * @param database - The database to search in (default: "us")
 * @param fetchAllData - If true, fetches all historical data from 2010 to last month (default: false)
 */
export async function fetchSEMrushDashboardData(
  domain: string, 
  startDate?: string,
  endDate?: string,
  database: string = "us",
  fetchAllData: boolean = false
) {
  // Use provided dates or calculate them
  const dateRanges = startDate && endDate 
    ? {
        startDate,
        endDate,
        startDateAPI: startDate.replace(/-/g, ''),
        endDateAPI: endDate.replace(/-/g, ''),
        lastMonth: {
          startAPI: calculateLastMonthStart(endDate),
          endAPI: endDate.replace(/-/g, '')
        },
        previousMonth: {
          startAPI: calculatePreviousMonthStart(endDate),
          endAPI: calculateLastMonthEnd(endDate)
        }
      }
    : fetchAllData 
      ? calculateSemrushDateRanges() 
      : calculateDashboardDateRanges()
  
  // Fetch raw data from SEMrush
  const rawData = await fetchSEMrushOverviewTrend(domain, database)
  
  // Filter by date range (startDateAPI can be undefined for "all data" mode)
  const filteredData = filterByDateRange(rawData, dateRanges.startDateAPI, dateRanges.endDateAPI)
  
  // Parse the data
  const parsedData = parseSEMrushData(filteredData)
  
  // Debug log for first and last rows
  if (parsedData.length > 0) {
    const firstRow = parsedData[0]
    const lastRow = parsedData[parsedData.length - 1]
    console.log('[SEMrush API] Data range:', {
      firstDate: firstRow.date,
      lastDate: lastRow.date,
      totalRows: parsedData.length,
      lastRowData: {
        date: lastRow.date,
        top3: lastRow.top3,
        totalKeywords: lastRow.top3 + lastRow.top4to10 + lastRow.top11to20 + 
                       lastRow.top21to50 + lastRow.top51to100 + 
                       lastRow.aiOverviews + lastRow.serpFunctions
      }
    })
  }
  
  return {
    dailyData: parsedData,
    dateRanges: {
      startDate: dateRanges.startDate,
      endDate: dateRanges.endDate
    }
  }
}

/**
 * Helper to calculate last month start date (YYYYMMDD) from end date (YYYY-MM-DD)
 */
function calculateLastMonthStart(endDateStr: string): string {
  const endDate = new Date(endDateStr)
  const year = endDate.getFullYear()
  const month = endDate.getMonth() // 0-11
  return `${year}${String(month + 1).padStart(2, '0')}01`
}

/**
 * Helper to calculate previous month start date (YYYYMMDD) from end date (YYYY-MM-DD)
 */
function calculatePreviousMonthStart(endDateStr: string): string {
  const endDate = new Date(endDateStr)
  const year = endDate.getFullYear()
  const month = endDate.getMonth() // 0-11
  const prevMonth = month - 1
  const prevYear = prevMonth < 0 ? year - 1 : year
  const normalizedMonth = prevMonth < 0 ? 11 : prevMonth
  return `${prevYear}${String(normalizedMonth + 1).padStart(2, '0')}01`
}

/**
 * Helper to calculate last month end date (YYYYMMDD) from end date (YYYY-MM-DD)
 */
function calculateLastMonthEnd(endDateStr: string): string {
  const endDate = new Date(endDateStr)
  const year = endDate.getFullYear()
  const month = endDate.getMonth() // 0-11
  const prevMonth = month - 1
  const prevYear = prevMonth < 0 ? year - 1 : year
  const normalizedMonth = prevMonth < 0 ? 11 : prevMonth
  const lastDay = new Date(prevYear, normalizedMonth + 1, 0).getDate()
  return `${prevYear}${String(normalizedMonth + 1).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`
}

