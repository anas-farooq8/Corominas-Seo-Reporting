import type { GoogleAnalyticsApiProperty } from "@/lib/supabase/types"
import { cache } from "react"
import { google } from "googleapis"
import { calculateDashboardDateRanges } from "@/lib/utils/date-ranges"
import { createGoogleAuthClient, validateGoogleCredentials } from "@/lib/api/google-auth"

const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]

// ============================================
// Google Analytics API Clients
// ============================================

/**
 * Get authenticated Google Analytics Admin API client
 */
function getAdminClient() {
  const auth = createGoogleAuthClient(SCOPES)
  return google.analyticsadmin({ version: "v1beta", auth })
}

/**
 * Get authenticated Google Analytics Data API client
 */
function getDataClient() {
  const auth = createGoogleAuthClient(SCOPES)
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

  validateGoogleCredentials()

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
    const { startDate, endDate, endDateObj } = calculateDashboardDateRanges()
    
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
      
      return {
        dailyData,
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

// ============================================
// Google Analytics Landing Pages Data
// ============================================

export interface GALandingPageData {
  landingPage: string
  sessions: number
  conversions: number
  conversionRate: number
}

export interface GADailyLandingPageData {
  date: string
  landingPages: { [url: string]: { sessions: number; conversions: number } }
}

export interface GALandingPagesResponse {
  dailyData: GADailyLandingPageData[]
  topLandingPages: GALandingPageData[]
  totalSessions: number
  totalConversions: number
  dateRanges: {
    startDate: string
    endDate: string
  }
}

/**
 * Fetch top landing pages data from Google Analytics (Organic Search only)
 * Returns daily data for top 10 landing pages over 12 months
 */
export async function fetchGALandingPagesData(propertyId: string): Promise<GALandingPagesResponse> {
  // Helper function to format date as YYYYMMDD
  function formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }
  
  try {
    const client = getDataClient()
    const { startDate, endDate } = calculateDashboardDateRanges()
    
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
            { name: 'landingPage' }, // Changed from landingPagePlusQueryString to landingPage
            { name: 'sessionPrimaryChannelGroup' }
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'keyEvents' }
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'sessionPrimaryChannelGroup',
              stringFilter: {
                matchType: 'EXACT',
                value: 'Organic Search'
              }
            }
          },
          keepEmptyRows: false
        }
      }, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      // Process the data
      // First, aggregate by landing page to find the top 10
      const landingPageTotals: { [url: string]: { sessions: number; conversions: number } } = {}
      const dailyDataMap: { [date: string]: { [url: string]: { sessions: number; conversions: number } } } = {}
      
      response.data.rows?.forEach((row: any) => {
        const date = row.dimensionValues[0].value
        const landingPage = row.dimensionValues[1].value
        const sessions = parseInt(row.metricValues[0].value || '0')
        const conversions = parseInt(row.metricValues[1].value || '0')
        
        // Aggregate totals for finding top 10
        if (!landingPageTotals[landingPage]) {
          landingPageTotals[landingPage] = { sessions: 0, conversions: 0 }
        }
        landingPageTotals[landingPage].sessions += sessions
        landingPageTotals[landingPage].conversions += conversions
        
        // Store daily data
        if (!dailyDataMap[date]) {
          dailyDataMap[date] = {}
        }
        if (!dailyDataMap[date][landingPage]) {
          dailyDataMap[date][landingPage] = { sessions: 0, conversions: 0 }
        }
        dailyDataMap[date][landingPage].sessions += sessions
        dailyDataMap[date][landingPage].conversions += conversions
      })
      
      // Calculate grand totals for ALL landing pages
      let totalSessions = 0
      let totalConversions = 0
      Object.values(landingPageTotals).forEach(data => {
        totalSessions += data.sessions
        totalConversions += data.conversions
      })
      
      // Find top 10 landing pages by sessions
      const topLandingPages: GALandingPageData[] = Object.entries(landingPageTotals)
        .map(([url, data]) => ({
          landingPage: url,
          sessions: data.sessions,
          conversions: data.conversions,
          conversionRate: data.sessions > 0 ? (data.conversions / data.sessions) : 0
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10)
      
      const topUrls = new Set(topLandingPages.map(lp => lp.landingPage))
      
      // Fill in missing dates with zero values to ensure complete dataset
      const dailyData: GADailyLandingPageData[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = formatDateKey(d)
        const landingPages: { [url: string]: { sessions: number; conversions: number } } = {}
        
        // Initialize all top 10 landing pages with zero values
        topUrls.forEach(url => {
          if (dailyDataMap[dateKey] && dailyDataMap[dateKey][url]) {
            landingPages[url] = dailyDataMap[dateKey][url]
          } else {
            landingPages[url] = { sessions: 0, conversions: 0 }
          }
        })
        
        dailyData.push({
          date: dateKey,
          landingPages
        })
      }
      
      return {
        dailyData,
        topLandingPages,
        totalSessions,
        totalConversions,
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
    console.error("[Google Analytics Landing Pages] Fetch failed:", error)
    throw error
  }
}