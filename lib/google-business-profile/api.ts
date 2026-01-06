// ============================================
// Google Business Profile (GBP) API Library
// ============================================

import { google } from "googleapis"
import { getKVS, setKVS } from "@/lib/db/kvs"
import { calculateDashboardDateRanges } from "@/lib/utils/date-ranges"

const GBP_REFRESH_TOKEN_KEY = "gbp-refresh-token"

// OAuth2 Scopes for Google Business Profile
// Note: The Performance API requires the business.manage scope
const SCOPES = ["https://www.googleapis.com/auth/business.manage"]

// ============================================
// OAuth2 Configuration
// ============================================

/**
 * Get OAuth2 client configuration
 */
function getOAuth2Client() {
  const clientId = process.env.GBP_CLIENT_ID
  const clientSecret = process.env.GBP_CLIENT_SECRET
  const redirectUri = process.env.GBP_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("GBP OAuth2 credentials are not configured. Please set GBP_CLIENT_ID, GBP_CLIENT_SECRET, and GBP_REDIRECT_URI environment variables.")
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  )

  return oauth2Client
}

/**
 * Generate OAuth2 authorization URL
 */
export function generateAuthUrl(): string {
  const oauth2Client = getOAuth2Client()
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  })

  return authUrl
}

/**
 * Exchange authorization code for tokens
 * Stores the refresh token in KVS
 */
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const oauth2Client = getOAuth2Client()
  
  try {
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.refresh_token) {
      throw new Error("No refresh token received. User may have already authorized this app.")
    }

    await setKVS(GBP_REFRESH_TOKEN_KEY, tokens.refresh_token)
  } catch (error) {
    console.error("[GBP OAuth] Failed to exchange tokens:", error)
    throw new Error("Failed to exchange authorization code for tokens")
  }
}

/**
 * Get authenticated OAuth2 client
 * Uses refresh token from KVS
 */
async function getAuthenticatedClient() {
  const oauth2Client = getOAuth2Client()
  const refreshToken = await getKVS(GBP_REFRESH_TOKEN_KEY)
  
  if (!refreshToken) {
    throw new Error("No refresh token found. Please authorize the application first.")
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  return oauth2Client
}

/**
 * Check if refresh token exists
 */
export async function hasRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = await getKVS(GBP_REFRESH_TOKEN_KEY)
    return refreshToken !== null && refreshToken !== ""
  } catch (error) {
    console.error("[GBP Auth] Error checking refresh token:", error)
    return false
  }
}

// ============================================
// GBP API Data Types
// ============================================

export interface GBPAccount {
  name: string // e.g., "accounts/123456789"
  accountName: string // Display name
  type: string
  role: string
}

export interface GBPLocation {
  name: string // e.g., "accounts/123456789/locations/987654321"
  locationName: string // Business name (display name from API)
  primaryCategory?: {
    displayName: string // e.g., "Marketing Agency"
  }
  address?: {
    addressLines?: string[] // e.g., ["Tölzer Straße 1"]
    locality?: string // City, e.g., "Grünwald"
    administrativeArea?: string // State/Province
    postalCode?: string // e.g., "82031"
    regionCode?: string // Country code, e.g., "DE"
  }
  websiteUrl?: string
}

export interface GBPAccountWithLocations extends GBPAccount {
  locations: GBPLocation[]
}

// ============================================
// GBP API Functions
// ============================================

/**
 * List all GBP accounts
 */
export async function listAccounts(): Promise<GBPAccount[]> {
  try {
    const auth = await getAuthenticatedClient()
    const mybusiness = google.mybusinessaccountmanagement({ version: "v1", auth })

    const response = await mybusiness.accounts.list()
    
    const accounts: GBPAccount[] = (response.data.accounts || []).map((account: any) => ({
      name: account.name || "",
      accountName: account.accountName || account.name || "",
      type: account.type || "PERSONAL",
      role: account.role || "OWNER",
    }))

    return accounts
  } catch (error: any) {
    console.error("[GBP API] Failed to fetch accounts:", error)
    
    if (error.code === 401 || error.code === 403) {
      throw new Error("Authentication failed. Please re-authorize the application.")
    }
    
    throw new Error("Failed to fetch Google Business Profile accounts")
  }
}

/**
 * List all locations for a specific account
 */
export async function listLocations(accountName: string): Promise<GBPLocation[]> {
  try {
    const auth = await getAuthenticatedClient()
    const mybusiness = google.mybusinessbusinessinformation({ version: "v1", auth })

    const response = await mybusiness.accounts.locations.list({
      parent: accountName,
      readMask: "name,title,websiteUri,storefrontAddress",
    })
    
    const locations: GBPLocation[] = (response.data.locations || []).map((location: any) => ({
      name: `${accountName}/${location.name}`,
      locationName: location.title || location.name || "",
      address: location.storefrontAddress ? {
        addressLines: location.storefrontAddress.addressLines || [],
        locality: location.storefrontAddress.locality,
        administrativeArea: location.storefrontAddress.administrativeArea,
        postalCode: location.storefrontAddress.postalCode,
        regionCode: location.storefrontAddress.regionCode,
      } : undefined,
      websiteUrl: location.websiteUri,
    }))

    return locations
  } catch (error: any) {
    console.error(`[GBP API] Failed to fetch locations:`, error)
    
    if (error.code === 401 || error.code === 403) {
      throw new Error("Authentication failed. Please re-authorize the application.")
    }
    
    throw new Error(`Failed to fetch locations for account: ${accountName}`)
  }
}

/**
 * List all accounts with their locations
 * 
 * API CALLS MADE:
 * - One call to list all accounts
 * - One call per account to list locations
 * 
 * LOCATION ID FORMAT:
 * The 'name' field in each location contains the full path: "accounts/123456789/locations/987654321"
 */
export async function listAccountsWithLocations(): Promise<GBPAccountWithLocations[]> {
  try {
    const accounts = await listAccounts()
    
    const accountsWithLocations: GBPAccountWithLocations[] = await Promise.all(
      accounts.map(async (account) => {
        try {
          const locations = await listLocations(account.name)
          return {
            ...account,
            locations,
          }
        } catch (error) {
          console.error(`[GBP API] Failed to fetch locations for account:`, error)
          return {
            ...account,
            locations: [],
          }
        }
      })
    )
    
    return accountsWithLocations
  } catch (error) {
    console.error("[GBP API] Failed to fetch accounts with locations:", error)
    throw error
  }
}

// ============================================
// GBP Performance API - Activity Data
// ============================================

/**
 * Daily activity metrics data structure
 */
export interface GBPDailyActivityData {
  date: string // YYYYMMDD format
  calls: number
  directions: number
  websiteClicks: number
}

/**
 * Response from GBP Activity API
 */
export interface GBPActivityResponse {
  dailyData: GBPDailyActivityData[]
}

/**
 * Fetch activity data (calls, directions, website clicks) for a location
 * 
 * IMPORTANT: locationId should be in format "locations/{locationId}" ONLY
 * NOT the full "accounts/{accountId}/locations/{locationId}" path
 * 
 * The Performance API expects ONLY "locations/{locationId}" as per Google's Python SDK.
 * In our database we store the full path, so we extract just the locations part before calling this.
 * 
 * @param locationId - The location ID in format "locations/123456789"
 * @returns Activity data for the past 12 months
 */
export async function fetchGBPActivityData(locationId: string): Promise<GBPActivityResponse> {
  try {
    const auth = await getAuthenticatedClient()
    
    // Use the same date calculation as all dashboards for consistency
    const { startDateObj, endDateObj } = calculateDashboardDateRanges()
    
    // locationId should be in format "locations/123456789"
    console.log(`[GBP Activity API] Fetching data for location: ${locationId}`)
    
    // Use the official googleapis library for businessprofileperformance API
    const businessPerformance = google.businessprofileperformance({ version: "v1", auth })
    
    // Create abort controller with 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await businessPerformance.locations.fetchMultiDailyMetricsTimeSeries({
        location: locationId,
        dailyMetrics: [
          "CALL_CLICKS",
          "BUSINESS_DIRECTION_REQUESTS",
          "WEBSITE_CLICKS",
        ],
        // Note: The googleapis library expects these as nested parameters
        'dailyRange.startDate.year': startDateObj.getFullYear(),
        'dailyRange.startDate.month': startDateObj.getMonth() + 1,
        'dailyRange.startDate.day': startDateObj.getDate(),
        'dailyRange.endDate.year': endDateObj.getFullYear(),
        'dailyRange.endDate.month': endDateObj.getMonth() + 1,
        'dailyRange.endDate.day': endDateObj.getDate(),
      }, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    
      const responseData = response.data as any
    
      // Parse the response
      const dailyDataMap = new Map<string, GBPDailyActivityData>()
    
      // Initialize all dates in range with zeros
      const currentDate = new Date(startDateObj)
      while (currentDate <= endDateObj) {
        // Format as YYYYMMDD (getMonth() is 0-11, so we add 1)
        const dateStr = currentDate.getFullYear() + 
          String(currentDate.getMonth() + 1).padStart(2, '0') + 
          String(currentDate.getDate()).padStart(2, '0')
        
        dailyDataMap.set(dateStr, {
          date: dateStr,
          calls: 0,
          directions: 0,
          websiteClicks: 0,
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // Process the response data
      const blocks = responseData.multiDailyMetricTimeSeries || []
      
      for (const block of blocks) {
        const metricSeries = block.dailyMetricTimeSeries || []
        
        for (const series of metricSeries) {
          const metric = series.dailyMetric
          const datedValues = series.timeSeries?.datedValues || []
          
          for (const row of datedValues) {
            const date = row.date
            const dateStr = date.year + 
              String(date.month).padStart(2, '0') + 
              String(date.day).padStart(2, '0')
            
            const value = parseInt(row.value || '0', 10)
            
            const existingData = dailyDataMap.get(dateStr)
            if (existingData) {
              if (metric === "CALL_CLICKS") {
                existingData.calls = value
              } else if (metric === "BUSINESS_DIRECTION_REQUESTS") {
                existingData.directions = value
              } else if (metric === "WEBSITE_CLICKS") {
                existingData.websiteClicks = value
              }
            }
          }
        }
      }
      
      // Convert map to sorted array
      const dailyData = Array.from(dailyDataMap.values()).sort((a, b) => 
        parseInt(a.date) - parseInt(b.date)
      )
      
      return {
        dailyData,
      }
    } catch (apiError: any) {
      clearTimeout(timeoutId)
      if (apiError.name === 'AbortError') {
        throw new Error('Google Business Profile API request timed out after 30 seconds')
      }
      throw apiError
    }
  } catch (error: any) {
    console.error("[GBP Activity] Error fetching activity data:", error.message)
    
    // Handle specific error cases
    if (error.code === 401 || error.code === 403) {
      throw new Error("Authentication failed. Please re-authorize the application.")
    }
    
    if (error.response?.status === 404) {
      throw new Error("Location not found or Performance API not enabled.")
    }
    
    throw new Error(`Failed to fetch activity data: ${error.message || 'Unknown error'}`)
  }
}

