// ============================================
// Google Business Profile (GBP) API Library
// ============================================

import { google } from "googleapis"
import { getKVS, setKVS } from "@/lib/db/kvs"
import { calculateDashboardDateRanges } from "@/lib/utils/date-ranges"

const GBP_REFRESH_TOKEN_KEY = "gbp-refresh-token"

// OAuth2 Scopes for Google Business Profile
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
  console.log("[GBP OAuth] Generating authorization URL")
  
  const oauth2Client = getOAuth2Client()
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force consent to get refresh token
  })

  console.log("[GBP OAuth] Authorization URL generated")
  return authUrl
}

/**
 * Exchange authorization code for tokens
 * Stores the refresh token in KVS
 */
export async function exchangeCodeForTokens(code: string): Promise<void> {
  console.log("[GBP OAuth] Exchanging authorization code for tokens")
  
  const oauth2Client = getOAuth2Client()
  
  try {
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.refresh_token) {
      throw new Error("No refresh token received. User may have already authorized this app.")
    }

    console.log("[GBP OAuth] Tokens received, storing refresh token")
    
    // Store the refresh token in KVS (will be encrypted automatically)
    await setKVS(GBP_REFRESH_TOKEN_KEY, tokens.refresh_token)
    
    console.log("[GBP OAuth] Refresh token stored successfully")
  } catch (error) {
    console.error("[GBP OAuth] Failed to exchange code for tokens:", error)
    throw new Error("Failed to exchange authorization code for tokens")
  }
}

/**
 * Get authenticated OAuth2 client
 * Uses refresh token from KVS
 */
async function getAuthenticatedClient() {
  console.log("[GBP Auth] Getting authenticated client")
  
  const oauth2Client = getOAuth2Client()
  
  // Get refresh token from KVS (will be decrypted automatically)
  const refreshToken = await getKVS(GBP_REFRESH_TOKEN_KEY)
  
  if (!refreshToken) {
    throw new Error("No refresh token found. Please authorize the application first.")
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  console.log("[GBP Auth] Client authenticated with refresh token")
  return oauth2Client
}

/**
 * Check if refresh token exists
 */
export async function hasRefreshToken(): Promise<boolean> {
  console.log("[GBP Auth] Checking if refresh token exists")
  
  try {
    const refreshToken = await getKVS(GBP_REFRESH_TOKEN_KEY)
    const exists = refreshToken !== null && refreshToken !== ""
    console.log(`[GBP Auth] Refresh token exists: ${exists}`)
    return exists
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
  console.log("[GBP API] Fetching accounts")
  
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

    console.log(`[GBP API] Found ${accounts.length} account(s)`)
    return accounts
  } catch (error: any) {
    console.error("[GBP API] Failed to fetch accounts:", error)
    
    // Handle specific error cases
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
  console.log(`[GBP API] Fetching locations for account: ${accountName}`)
  
  try {
    const auth = await getAuthenticatedClient()
    const mybusiness = google.mybusinessbusinessinformation({ version: "v1", auth })

    const response = await mybusiness.accounts.locations.list({
      parent: accountName,
      // Keep the mask minimal to avoid extra payload; categories omitted per request
      readMask: "name,title,websiteUri,storefrontAddress",
    })
    
    const locations: GBPLocation[] = (response.data.locations || []).map((location: any) => ({
      // Always use "accountName/location.name" as the full name path, because the location.name is only location/locationId
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

    console.log(`[GBP API] Found ${locations.length} location(s) for account: ${accountName}`)
    return locations
  } catch (error: any) {
    console.error(`[GBP API] Failed to fetch locations for account ${accountName}:`, error)
    
    // Handle specific error cases
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
 * 1. One call to mybusinessaccountmanagement.accounts.list() - Gets all accounts
 * 2. For each account: One call to mybusinessbusinessinformation.accounts.locations.list() - Gets locations for that account
 * 
 * Total API calls = 1 + (number of accounts)
 * 
 * LOCATION ID FORMAT:
 * The 'name' field in each location contains the full path: "accounts/123456789/locations/987654321"
 * This full path is required for the Business Performance API.
 */
export async function listAccountsWithLocations(): Promise<GBPAccountWithLocations[]> {
  console.log("[GBP API] Fetching all accounts with locations")
  
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
          console.error(`[GBP API] Failed to fetch locations for account ${account.name}:`, error)
          // Return account with empty locations if fetching fails
          return {
            ...account,
            locations: [],
          }
        }
      })
    )

    const totalLocations = accountsWithLocations.reduce((sum, acc) => sum + acc.locations.length, 0)
    console.log(`[GBP API] Fetched ${accounts.length} account(s) with ${totalLocations} total location(s)`)
    
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
 * IMPORTANT: locationId should be in format "locations/{locationId}" only
 * NOT the full "accounts/{accountId}/locations/{locationId}" path
 * 
 * The Performance API expects: "locations/{locationId}"
 * But in our database we store: "accounts/{accountId}/locations/{locationId}"
 * So we need to extract just the "locations/{locationId}" part
 * 
 * @param locationId - The location ID in format "locations/123456789"
 * @returns Activity data for the past 12 months
 */
export async function fetchGBPActivityData(locationId: string): Promise<GBPActivityResponse> {
  console.log(`[GBP Activity] Fetching activity data for location: ${locationId}`)
  
  try {
    const auth = await getAuthenticatedClient()
    
    // Use the same date calculation as all dashboards for consistency
    const { startDate: startDateStr, endDate: endDateStr, startDateObj, endDateObj } = calculateDashboardDateRanges()
    
    console.log(`[GBP Activity] Date range: ${startDateStr} to ${endDateStr}`)
    
    // Build request - NOTE: This is a custom request because the Performance API
    // is not fully supported by the standard googleapis library
    // We need to call it directly using the authenticated client
    const url = `https://businessprofileperformance.googleapis.com/v1/${locationId}:fetchMultiDailyMetricsTimeSeries`
    
    // GBP API expects month as 1-12 (not 0-11 like JavaScript Date)
    // The +1 is necessary to convert from JavaScript's 0-indexed months to API's 1-indexed months
    const requestBody = {
      dailyMetrics: [
        "CALL_CLICKS",
        "BUSINESS_DIRECTION_REQUESTS",
        "WEBSITE_CLICKS",
      ],
      dailyRange: {
        startDate: {
          year: startDateObj.getFullYear(),
          month: startDateObj.getMonth() + 1, // Convert from 0-11 to 1-12
          day: startDateObj.getDate(),
        },
        endDate: {
          year: endDateObj.getFullYear(),
          month: endDateObj.getMonth() + 1, // Convert from 0-11 to 1-12
          day: endDateObj.getDate(),
        },
      },
    }
    
    console.log(`[GBP Activity] Request URL: ${url}`)
    console.log(`[GBP Activity] Request body:`, JSON.stringify(requestBody, null, 2))
    
    // Make the API request using the authenticated client
    const response = await auth.request({
      url: url,
      method: "POST",
      data: requestBody,
    })
    
    console.log(`[GBP Activity] Response status: ${response.status}`)
    
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
    
    console.log(`[GBP Activity] Processing ${blocks.length} metric blocks`)
    
    for (const block of blocks) {
      const metricSeries = block.dailyMetricTimeSeries || []
      
      for (const series of metricSeries) {
        const metric = series.dailyMetric
        const datedValues = series.timeSeries?.datedValues || []
        
        console.log(`[GBP Activity] Processing metric: ${metric} with ${datedValues.length} data points`)
        
        for (const row of datedValues) {
          const date = row.date
          // Format date as YYYYMMDD (date.month is 1-12 from API, so we pad directly)
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
    
    console.log(`[GBP Activity] Processed ${dailyData.length} days of activity data`)
    
    return {
      dailyData,
    }
  } catch (error: any) {
    console.error(`[GBP Activity] Failed to fetch activity data:`, error)
    
    // Log detailed error information
    if (error.response) {
      console.error(`[GBP Activity] Error response:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      })
    }
    
    // Handle specific error cases
    if (error.code === 401 || error.code === 403) {
      throw new Error("Authentication failed. Please re-authorize the application.")
    }
    
    if (error.response?.status === 404) {
      throw new Error(`Location not found: ${locationId}. Please check the location ID format.`)
    }
    
    throw new Error(`Failed to fetch activity data: ${error.message || 'Unknown error'}`)
  }
}

