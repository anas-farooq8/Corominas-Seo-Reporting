import type { GoogleAnalyticsApiProperty } from "@/lib/supabase/types"
import { cache } from "react"
import { google } from "googleapis"

const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]

// ============================================
// Date Range Calculation
// ============================================

/**
 * Calculate date ranges for GA reports (12 months of data)
 * Similar to Mangools: last completed month going back 12 months
 */
export function calculateGADateRanges() {
  const today = new Date()
  
  // Last completed month end date (last day of previous month)
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0)
  
  // Start date: 12 months before the end date (first day of that month)
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1)
  
  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const startDateStr = formatDate(startDate)
  const endDateStr = formatDate(endDate)
  
  console.log('[GA Date Ranges]', {
    today: formatDate(today),
    startDate: startDateStr,
    endDate: endDateStr,
    monthsIncluded: 12
  })
  
  return {
    startDate: startDateStr,
    endDate: endDateStr,
    startDateObj: startDate,
    endDateObj: endDate
  }
}

// ============================================
// Google Analytics API Clients
// ============================================

/**
 * Get service account credentials
 */
function getCredentials() {
  return {
    type: process.env.GOOGLE_TYPE || "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN || "googleapis.com",
  }
}

/**
 * Get authenticated Google Analytics Admin API client
 */
function getAdminClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: SCOPES,
  })

  return google.analyticsadmin({ version: "v1beta", auth })
}

/**
 * Get authenticated Google Analytics Data API client
 */
function getDataClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: SCOPES,
  })

  return google.analyticsdata({ version: "v1beta", auth })
}

/**
 * List all Google Analytics properties for a given account
 * @param accountId - The Google Analytics account ID (e.g., "335827031")
 * @returns Array of Google Analytics properties
 */
export const fetchGoogleAnalyticsProperties = cache(async (accountId?: string): Promise<GoogleAnalyticsApiProperty[]> => {
  const gaAccountId = accountId || process.env.GA_ACCOUNT_ID

  if (!gaAccountId) {
    throw new Error("GA_ACCOUNT_ID environment variable is not set or accountId not provided")
  }

  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error("Google service account credentials are not configured")
  }

  try {
    const client = getAdminClient()

    // Create abort controller with 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await client.properties.list({
        filter: `parent:accounts/${gaAccountId}`,
        pageSize: 200,
        showDeleted: false,
      }, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const properties = response.data.properties || []

      // Transform to our expected format
      const transformedProperties: GoogleAnalyticsApiProperty[] = properties.map((property: any) => ({
        name: property.name || "",
        parent: property.parent || "",
        create_time: property.createTime || "",
        update_time: property.updateTime || "",
        display_name: property.displayName || "",
        industry_category: property.industryCategory,
        time_zone: property.timeZone || "",
        currency_code: property.currencyCode || "",
        service_level: property.serviceLevel,
        account: property.account,
        property_type: property.propertyType,
      }))

      return transformedProperties
    } catch (apiError: any) {
      clearTimeout(timeoutId)
      if (apiError.name === 'AbortError') {
        throw new Error('Google Analytics API request timed out after 30 seconds')
      }
      throw apiError
    }
  } catch (error) {
    console.error("[Google Analytics API] Fetch failed:", error)
    throw error
  }
})

// ============================================
// Google Analytics Traffic Data
// ============================================

export interface GADailyTrafficData {
  date: string
  totalSessions: number
  organicSessions: number
  organicConversions: number
}

export interface GATrafficResponse {
  dailyData: GADailyTrafficData[]
  lastMonthOrganicSessions: number
  lastMonthOrganicConversions: number
  previousMonthOrganicSessions: number
  previousMonthOrganicConversions: number
  dateRanges: {
    startDate: string
    endDate: string
  }
}

/**
 * Fetch daily traffic data from Google Analytics
 * Returns total traffic, organic traffic, and organic conversions
 */
export async function fetchGATrafficData(propertyId: string): Promise<GATrafficResponse> {
  // Helper function to format date as YYYYMMDD
  function formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }
  
  try {
    const client = getDataClient()
    const { startDate, endDate, endDateObj } = calculateGADateRanges()
    
    // Create abort controller with 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await client.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [
            { name: 'date' },
            { name: 'sessionPrimaryChannelGroup' }
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'eventCount' }
          ]
        }
      }, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      // Process the data
      const dailyTotals: { [date: string]: GADailyTrafficData } = {}
      
      response.data.rows?.forEach((row: any) => {
        const date = row.dimensionValues[0].value
        const channel = row.dimensionValues[1].value
        const sessions = parseInt(row.metricValues[0].value || '0')
        const conversions = parseFloat(row.metricValues[1].value || '0')
        
        // Initialize date entry if not exists
        if (!dailyTotals[date]) {
          dailyTotals[date] = {
            date,
            totalSessions: 0,
            organicSessions: 0,
            organicConversions: 0
          }
        }
        
        // Add to total traffic
        dailyTotals[date].totalSessions += sessions
        
        // Add to organic if it's organic search
        if (channel === 'Organic Search') {
          dailyTotals[date].organicSessions += sessions
          dailyTotals[date].organicConversions += conversions
        }
      })
      
      // Fill in missing dates with zero values to ensure complete dataset
      const filledDailyTotals: GADailyTrafficData[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = formatDateKey(d)
        
        if (dailyTotals[dateKey]) {
          filledDailyTotals.push(dailyTotals[dateKey])
        } else {
          // Fill missing days with zeros
          filledDailyTotals.push({
            date: dateKey,
            totalSessions: 0,
            organicSessions: 0,
            organicConversions: 0
          })
        }
      }
      
      // Convert to array and sort by date
      const dailyData = filledDailyTotals
      
      // Calculate last month totals (last completed month)
      const lastMonthStart = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), 1)
      const lastMonthEnd = endDateObj
      
      const lastMonthStartKey = formatDateKey(lastMonthStart)
      const lastMonthEndKey = formatDateKey(lastMonthEnd)
      
      // Calculate previous month totals (month before last month)
      const previousMonthStart = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - 1, 1)
      const previousMonthEnd = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), 0) // Last day of previous month
      
      const previousMonthStartKey = formatDateKey(previousMonthStart)
      const previousMonthEndKey = formatDateKey(previousMonthEnd)
      
      let lastMonthOrganicSessions = 0
      let lastMonthOrganicConversions = 0
      let previousMonthOrganicSessions = 0
      let previousMonthOrganicConversions = 0
      
      dailyData.forEach(day => {
        // Last month
        if (day.date >= lastMonthStartKey && day.date <= lastMonthEndKey) {
          lastMonthOrganicSessions += day.organicSessions
          lastMonthOrganicConversions += day.organicConversions
        }
        // Previous month
        if (day.date >= previousMonthStartKey && day.date <= previousMonthEndKey) {
          previousMonthOrganicSessions += day.organicSessions
          previousMonthOrganicConversions += day.organicConversions
        }
      })
      
      console.log('[GA Traffic] Last month organic sessions:', lastMonthOrganicSessions)
      console.log('[GA Traffic] Last month organic conversions:', lastMonthOrganicConversions)
      console.log('[GA Traffic] Previous month organic sessions:', previousMonthOrganicSessions)
      console.log('[GA Traffic] Previous month organic conversions:', previousMonthOrganicConversions)
      console.log('[GA Traffic] Total days of data:', dailyData.length)
      console.log('[GA Traffic] Days with actual traffic:', Object.keys(dailyTotals).length)
      console.log('[GA Traffic] Days filled with zeros:', dailyData.length - Object.keys(dailyTotals).length)
      
      return {
        dailyData,
        lastMonthOrganicSessions,
        lastMonthOrganicConversions,
        previousMonthOrganicSessions,
        previousMonthOrganicConversions,
        dateRanges: {
          startDate,
          endDate
        }
      }
    } catch (apiError: any) {
      clearTimeout(timeoutId)
      if (apiError.name === 'AbortError') {
        throw new Error('Google Analytics API request timed out after 30 seconds')
      }
      throw apiError
    }
  } catch (error) {
    console.error("[Google Analytics Traffic] Fetch failed:", error)
    throw error
  }
}
