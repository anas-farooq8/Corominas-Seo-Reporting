import { cache } from "react"
import { google } from "googleapis"
import { calculateDashboardDateRanges } from "@/lib/utils/date-ranges"

const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

// ============================================
// Google Search Console API Types
// ============================================

export interface GSCSiteEntry {
  siteUrl: string
}

export interface GSCSitesResponse {
  siteEntry: GSCSiteEntry[]
}

export interface GSCDailyData {
  date: string // YYYYMMDD format
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GSCDashboardResponse {
  dailyData: GSCDailyData[]
  dateRanges: {
    startDate: string
    endDate: string
  }
}

// ============================================
// Google Search Console API Client
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
 * Get authenticated Google Search Console API client
 */
function getSearchConsoleClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: SCOPES,
  })

  return google.searchconsole({ version: "v1", auth })
}

/**
 * List all Google Search Console sites
 * @returns Array of Search Console sites
 */
export const fetchSearchConsoleSites = cache(async (): Promise<GSCSiteEntry[]> => {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error("Google service account credentials are not configured")
  }

  try {
    const client = getSearchConsoleClient()

    // Create abort controller with 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await client.sites.list({}, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const sites = response.data.siteEntry || []

      console.log('[GSC API] Fetched', sites.length, 'sites')

      return sites.map((site: any) => ({
        siteUrl: site.siteUrl || ""
      }))
    } catch (apiError: any) {
      clearTimeout(timeoutId)
      if (apiError.name === 'AbortError') {
        throw new Error('Google Search Console API request timed out after 30 seconds')
      }
      throw apiError
    }
  } catch (error) {
    console.error("[Google Search Console API] Fetch failed:", error)
    throw error
  }
})

/**
 * Fetch daily Search Console data for the last 12 months
 * @param siteUrl - The site URL to query
 * @returns Daily data with clicks, impressions, CTR, and position
 */
export async function fetchSearchConsoleData(siteUrl: string): Promise<GSCDashboardResponse> {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error("Google service account credentials are not configured")
  }

  // Helper function to format date as YYYYMMDD
  function formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }

  try {
    const client = getSearchConsoleClient()
    const { startDate, endDate } = calculateDashboardDateRanges()
    
    // Create abort controller with 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await client.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
          startDate: startDate,
          endDate: endDate,
          dimensions: ['date'],
          dataState: "all",
        }
      }, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const dailyData: GSCDailyData[] = []

      response.data.rows?.forEach((row: any, index: number) => {
        const date = row.keys[0] // Date from API (could be YYYY-MM-DD or YYYYMMDD)
        const clicks = row.clicks || 0
        const impressions = row.impressions || 0
        const ctr = row.ctr || 0
        const position = row.position || 0

        // Convert date to YYYYMMDD format if it's in YYYY-MM-DD format
        const dateYYYYMMDD = date.replace(/-/g, '')

        dailyData.push({
          date: dateYYYYMMDD,
          clicks,
          impressions,
          ctr,
          position,
        })
      })

      // Fill in missing dates with zero values to ensure complete dataset
      const filledDailyData: GSCDailyData[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      const dailyDataMap: { [date: string]: GSCDailyData } = {}
      dailyData.forEach(day => {
        dailyDataMap[day.date] = day
      })
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = formatDateKey(d)
        
        if (dailyDataMap[dateKey]) {
          filledDailyData.push(dailyDataMap[dateKey])
        } else {
          // Fill missing days with zeros
          filledDailyData.push({
            date: dateKey,
            clicks: 0,
            impressions: 0,
            ctr: 0,
            position: 0,
          })
        }
      }

      const totalClicks = filledDailyData.reduce((sum, d) => sum + d.clicks, 0)
      const totalImpressions = filledDailyData.reduce((sum, d) => sum + d.impressions, 0)
      
      return {
        dailyData: filledDailyData,
        dateRanges: {
          startDate,
          endDate,
        }
      }
    } catch (apiError: any) {
      clearTimeout(timeoutId)
      if (apiError.name === 'AbortError') {
        throw new Error('Google Search Console API request timed out after 30 seconds')
      }
      throw apiError
    }
  } catch (error) {
    console.error("[Google Search Console Data] Fetch failed:", error)
    throw error
  }
}


