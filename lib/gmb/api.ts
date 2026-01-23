// ============================================
// Grid My Business (GMB) API Library
// ============================================

import { getKVS, setKVS, deleteKVS } from "@/lib/db/kvs"

const GMB_REFRESH_TOKEN_KEY = "gmb-refresh-token"
const GMB_API_BASE = "https://gmb-main-sb7q6jfhda-uc.a.run.app"

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const REQUEST_TIMEOUT = 30000 // 30 seconds

// Common headers for GMB API requests
const COMMON_HEADERS = {
  "accept": "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9",
  "content-type": "application/json",
  "origin": "https://app.gridmybusiness.com",
  "referer": "https://app.gridmybusiness.com/",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
} as const

// ============================================
// Access Token Cache (Universal - stored in KVS)
// ============================================

// Access tokens expire in 1 hour (3600 seconds)
// We'll cache for 55 minutes to be safe (add 5 minute buffer)
const TOKEN_CACHE_DURATION_MS = 55 * 60 * 1000 // 55 minutes in milliseconds
const GMB_ACCESS_TOKEN_KEY = "gmb-access-token"

interface CachedToken {
  token: string
  expiresAt: number // Unix timestamp in milliseconds
}

/**
 * Clear the cached access token from KVS
 * This is called when we detect the token is invalid
 */
async function clearTokenCache(): Promise<void> {
  await deleteKVS(GMB_ACCESS_TOKEN_KEY)
}

/**
 * Get cached access token from KVS (if valid)
 * Returns null if no cached token exists or if it's expired
 */
async function getCachedAccessToken(): Promise<string | null> {
  try {
    const cachedData = await getKVS(GMB_ACCESS_TOKEN_KEY)
    if (!cachedData) {
      return null
    }

    // Parse the cached data
    const cached: CachedToken = JSON.parse(cachedData)
    
    // Check if token is expired
    const now = Date.now()
    if (now >= cached.expiresAt) {
      await clearTokenCache()
      return null
    }

    console.log("[GMB Token Cache] Using cached token")
    return cached.token
  } catch (error) {
    console.error("[GMB Token Cache] Error reading from cache:", error)
    // Clear invalid cache entry
    await clearTokenCache().catch(() => {}) // Ignore errors when clearing
    return null
  }
}

/**
 * Save access token to KVS with expiry timestamp
 */
async function saveCachedAccessToken(token: string): Promise<void> {
  try {
    const cached: CachedToken = {
      token,
      expiresAt: Date.now() + TOKEN_CACHE_DURATION_MS
    }
    await setKVS(GMB_ACCESS_TOKEN_KEY, JSON.stringify(cached))
    console.log("[GMB Token Cache] Token cached (valid for 55 min)")
  } catch (error) {
    console.error("[GMB Token Cache] Cache save failed:", error)
    // Don't throw - cache failure shouldn't break the flow
  }
}

// ============================================
// GMB API Data Types
// ============================================

export interface GMBAuthResponse {
  email: string
  displayName: string
  refreshToken: string
}

export interface GMBTokenResponse {
  access_token: string
}

export interface GMBProfile {
  _id: string
  location: {
    structured_formatting: {
      main_text: string
      secondary_text?: string
    }
  }
  totalReviews?: number
  rating?: number
  gmbScore?: number
  active: boolean
}

export interface GMBProfilesResponse {
  success: boolean
  data: {
    profiles: GMBProfile[]
    total: number
    tags: string[]
  }
}

export interface GMBScanId {
  _id: string
  dateAdded: number // Unix timestamp in milliseconds
}

export interface GMBKeyword {
  keyword: string
  profileId: string // This is the keyword ID
  profileIds: GMBScanId[] // These are the scan IDs with timestamps
}

export interface GMBKeywordsResponse {
  success: boolean
  data: {
    keywords: Array<{
      keyword: string
      profileId: string
      profileIds: GMBScanId[]
    }>
    total: number
  }
}

export interface GMBGridCoord {
  coord: {
    lat: number
    lng: number
  }
  position: number
}

export interface GMBGridReportResponse {
  _id: string
  keyword: string
  gridSize: number
  distance: number
  distanceUnit: string
  dateAdded: number
  coords: GMBGridCoord[]
}

// ============================================
// GMB Metrics API
// ============================================

export interface GMBMetricHistory {
  timestamp: string  // ISO date string
  value: number
}

export interface GMBMetricData {
  current: number
  history: GMBMetricHistory[]
}

export interface GMBMetricsResponse {
  success: boolean
  data: {
    gmbscore?: GMBMetricData
    rating?: GMBMetricData
    review?: GMBMetricData
  }
}

// ============================================
// Authentication Functions
// ============================================

/**
 * Initial sign-in to get refresh token
 * This should only be called once during setup
 * Stores the refresh token in KVS (encrypted)
 */
export async function signInWithPassword(): Promise<GMBAuthResponse> {
  const email = process.env.GMB_EMAIL
  const password = process.env.GMB_PASSWORD
  const apiKey = process.env.GMB_API_KEY
  const gmPid = process.env.GMB_GM_PID

  if (!email || !password || !apiKey || !gmPid) {
    throw new Error("GMB credentials are not configured. Please set GMB_EMAIL, GMB_PASSWORD, GMB_API_KEY, and GMB_GM_PID environment variables.")
  }

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`

    const payload = {
      returnSecureToken: true,
      email,
      password,
      clientType: "CLIENT_TYPE_WEB"
    }

    const headers = {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "x-firebase-gmpid": gmPid,
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      "content-type": "application/json",
      "origin": "https://app.gridmybusiness.com",
    }

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    console.log("[GMB Auth] Response status:", response.status)

    if (!response.ok) {
      let errorDetails = ""
      try {
        const errorData = await response.json()
        errorDetails = JSON.stringify(errorData, null, 2)
        console.error("[GMB Auth] Error response (JSON):", errorDetails)
      } catch {
        errorDetails = await response.text()
        console.error("[GMB Auth] Error response (text):", errorDetails)
      }
      throw new Error(`GMB authentication failed: ${response.status} ${response.statusText}\nDetails: ${errorDetails}`)
    }

    const data = await response.json() as GMBAuthResponse

    // Store refresh token in KVS (will be encrypted by KVS layer)
    if (data.refreshToken) {
      await setKVS(GMB_REFRESH_TOKEN_KEY, data.refreshToken)
    }

    return data
  } catch (error) {
    console.error("[GMB Auth] Sign-in failed:", error)
    throw error
  }
}

/**
 * Get a new access token using the stored refresh token
 * This is called automatically whenever we need to make API requests
 * The access token expires in 1 hour (3600 seconds)
 * 
 * IMPORTANT: This follows the same pattern as Google OAuth2
 * - Refresh tokens are long-lived and reusable
 * - Access tokens are short-lived (1 hour)
 * - Using the same refresh token repeatedly is EXPECTED and SAFE
 * - Google/Firebase will NOT block normal token refresh requests
 * 
 * This function now includes UNIVERSAL caching via KVS:
 * - Returns cached token from KVS if still valid (saves API calls)
 * - Cache is shared across ALL serverless instances
 * - If refresh token is invalid, automatically re-authenticates
 * 
 * @param forceRefresh - Force fetching a new token even if cached token is valid
 */
async function getAccessToken(forceRefresh: boolean = false): Promise<string> {
  // Check KVS cache first (unless force refresh is requested)
  if (!forceRefresh) {
    const cachedToken = await getCachedAccessToken()
    if (cachedToken) {
      return cachedToken
    }
  }
  
  const refreshToken = await getKVS(GMB_REFRESH_TOKEN_KEY)
  const apiKey = process.env.GMB_API_KEY

  if (!refreshToken) {
    // No refresh token - authenticate to get one
    await signInWithPassword()
    // Recursively call to get the token with new refresh token
    return getAccessToken(true) // Force refresh since we just authenticated
  }

  if (!apiKey) {
    throw new Error("GMB_API_KEY environment variable is not set")
  }

  try {
    const url = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`

    const payload = {
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
      "origin": "https://app.gridmybusiness.com",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      "Referer": "https://app.gridmybusiness.com/"
    }

    // Convert payload to URL-encoded format
    const body = new URLSearchParams(payload).toString()

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers,
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[GMB Token] Error response:", errorText)
      
      // If refresh token is invalid, try to re-authenticate
      if (response.status === 400) {
        console.log("[GMB Token] Refresh token invalid, re-authenticating...")
        await clearTokenCache()
        await signInWithPassword()
        // Recursively call to get token with new refresh token
        return getAccessToken(true) // Force refresh since we just authenticated
      }
      
      throw new Error(`GMB token refresh failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as GMBTokenResponse

    // Cache the new token in KVS (universal across all instances)
    await saveCachedAccessToken(data.access_token)

    return data.access_token
  } catch (error) {
    console.error("[GMB Token] Failed to get access token:", error)
    throw error
  }
}

/**
 * Check if refresh token exists
 */
export async function hasRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = await getKVS(GMB_REFRESH_TOKEN_KEY)
    return refreshToken !== null && refreshToken !== ""
  } catch (error) {
    console.error("[GMB Auth] Error checking refresh token:", error)
    return false
  }
}

// ============================================
// Utility Functions (Deduplication)
// ============================================

/**
 * Make HTTP request with timeout handling
 * Centralized timeout logic to avoid duplication
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Build headers for GMB API requests
 * Centralized header construction to avoid duplication
 */
function buildGMBHeaders(accessToken: string, workspaceId: string): HeadersInit {
  return {
    ...COMMON_HEADERS,
    "authorization": `Bearer ${accessToken}`,
    "workspace": workspaceId,
  }
}

/**
 * Generic retry wrapper for GMB API calls with authentication
 * Eliminates duplicate retry logic in listProfiles() and listKeywords()
 */
async function withRetry<T>(
  operation: (accessToken: string, attempt: number) => Promise<T>,
  operationName: string
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[GMB API] ${operationName} (attempt ${attempt}/${MAX_RETRIES})`)
      
      // Only force refresh if this is a retry after auth error (attempt > 1)
      const forceRefresh = attempt > 1
      if (forceRefresh) {
        await clearTokenCache()
      }
      
      const accessToken = await getAccessToken(forceRefresh)
      return await operation(accessToken, attempt)
      
    } catch (error: any) {
      console.error(`[GMB API] ${operationName} attempt ${attempt}/${MAX_RETRIES} failed:`, error)

      // On last attempt, throw with context
      if (attempt === MAX_RETRIES) {
        if (error.message?.includes("token refresh failed") || error.message?.includes("Authentication failed")) {
          throw new Error(`${operationName} failed: Authentication error after ${MAX_RETRIES} attempts`)
        }
        throw new Error(`${operationName} failed after ${MAX_RETRIES} attempts`)
      }

      // Wait before retrying
      console.log(`[GMB API] Waiting ${RETRY_DELAY}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    }
  }

  throw new Error(`${operationName} failed after ${MAX_RETRIES} attempts`)
}

// ============================================
// GMB API Functions
// ============================================

/**
 * List all profiles from the current workspace
 * Returns all GMB profiles with their details
 * Automatically retries up to 3 times with 1 second delay if authentication fails
 * 
 * OPTIMIZED: Reuses cached access token and only refreshes on auth errors
 */
export async function listProfiles(): Promise<GMBProfile[]> {
  const workspaceId = process.env.GMB_WORKSPACE_ID
  if (!workspaceId) {
    throw new Error("GMB_WORKSPACE_ID environment variable is not set")
  }

  return withRetry(async (accessToken, attempt) => {
    const params = new URLSearchParams({
      pageIndex: "0",
      pageLimit: "1000",
      sortBy: "alphabetical",
      sortDirection: "desc",
    })
    const url = `${GMB_API_BASE}/workspace/current/profiles?${params}`
    const headers = buildGMBHeaders(accessToken, workspaceId)

    const response = await fetchWithTimeout(url, { method: "GET", headers })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[GMB API] Error response:", errorText)
      
      // If 401/403, the token is invalid - clear cache and retry
      if ((response.status === 401 || response.status === 403) && attempt < MAX_RETRIES) {
        console.log(`[GMB API] Auth error ${response.status}, retrying...`)
        await clearTokenCache()
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        throw new Error("AUTH_ERROR_RETRY") // Signal to retry
      }
      
      throw new Error(`GMB API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as GMBProfilesResponse

    if (!data.success) {
      throw new Error("GMB API returned unsuccessful response")
    }

    console.log(`[GMB API] Successfully fetched ${data.data.profiles.length} profiles`)
    return data.data.profiles
  }, "Fetching profiles")
}

/**
 * List all keywords for a specific profile
 * Returns keywords with their scan history
 * Automatically retries up to 3 times with 1 second delay if authentication fails
 * 
 * OPTIMIZED: Reuses cached access token and only refreshes on auth errors
 */
export async function listKeywords(profileId: string): Promise<GMBKeyword[]> {
  const workspaceId = process.env.GMB_WORKSPACE_ID
  if (!workspaceId) {
    throw new Error("GMB_WORKSPACE_ID environment variable is not set")
  }

  return withRetry(async (accessToken, attempt) => {
    const params = new URLSearchParams({
      pageIndex: "0",
      pageLimit: "5",
      showMonitoringOnly: "true",
      sortBy: "lastScanned",
      sortDirection: "desc",
    })
    const url = `${GMB_API_BASE}/profile/${profileId}/keyword?${params}`
    const headers = buildGMBHeaders(accessToken, workspaceId)

    const response = await fetchWithTimeout(url, { method: "GET", headers })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[GMB API] Error response:", errorText)
      
      // If 401/403, the token is invalid - clear cache and retry
      if ((response.status === 401 || response.status === 403) && attempt < MAX_RETRIES) {
        console.log(`[GMB API] Auth error ${response.status}, retrying...`)
        await clearTokenCache()
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        throw new Error("AUTH_ERROR_RETRY") // Signal to retry
      }
      
      throw new Error(`GMB API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as GMBKeywordsResponse

    if (!data.success) {
      throw new Error("GMB API returned unsuccessful response")
    }

    // Extract only the fields we need
    const keywords: GMBKeyword[] = data.data.keywords.map(kw => ({
      keyword: kw.keyword,
      profileId: kw.profileId,
      profileIds: kw.profileIds,
    }))

    console.log(`[GMB API] Successfully fetched ${keywords.length} keywords`)
    return keywords
  }, `Fetching keywords for profile ${profileId.substring(0, 8)}...`)
}

/**
 * Get grid report data for a specific scan ID with a provided access token
 * Returns grid positioning data with coordinates and rankings
 * @param scanId - The scan ID to fetch
 * @param accessToken - Pre-fetched access token to use for this request
 */
export async function getGridReportWithToken(
  scanId: string,
  accessToken: string
): Promise<GMBGridReportResponse> {
  const workspaceId = process.env.GMB_WORKSPACE_ID

  if (!workspaceId) {
    throw new Error("GMB_WORKSPACE_ID environment variable is not set")
  }

  const url = `${GMB_API_BASE}/monitoring/reports/list/view`
  const headers = buildGMBHeaders(accessToken, workspaceId)
  const payload = { pid: scanId }

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[GMB API] Grid report error for scan ${scanId}:`, errorText)
    throw new Error(`GMB API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as GMBGridReportResponse

  // Validate required fields
  if (!data._id || !data.coords || !Array.isArray(data.coords)) {
    throw new Error("Invalid grid report response: missing required fields")
  }

  console.log(`[GMB API] ✓ Fetched grid report for scan ${scanId}: ${data.coords.length} coords, keyword: ${data.keyword}`)
  return data
}

/**
 * Get access token (uses cached token if valid)
 * Exported for use in batch operations
 */
export async function getFreshAccessToken(): Promise<string> {
  return getAccessToken()
}

/**
 * Force get a new access token (bypasses cache)
 * Use this after detecting auth errors to get a fresh token
 */
export async function forceRefreshAccessToken(): Promise<string> {
  await clearTokenCache()
  return getAccessToken(true)
}

/**
 * Clear the cached access token (exported for use when auth errors occur)
 * Call this when you detect a 401/403 error to force a fresh token on next request
 */
export { clearTokenCache }

/**
 * Fetch GMB metrics for a specific profile
 * @param profileId - The profile ID to fetch metrics for
 * @param interval - Number of intervals to fetch (default: 1)
 * @param intervalUnit - Unit of interval: 'week' or 'month' (default: 'month')
 * @param fields - Comma-separated list of fields to fetch (default: 'gmbscore,rating,review')
 */
export async function fetchGMBMetrics(
  profileId: string,
  interval: number = 1,
  intervalUnit: 'week' | 'month',
  fields: string = 'gmbscore,rating,review'
): Promise<GMBMetricsResponse> {
  const workspaceId = process.env.GMB_WORKSPACE_ID
  if (!workspaceId) {
    throw new Error("GMB_WORKSPACE_ID environment variable is not set")
  }

  return withRetry(async (accessToken, attempt) => {
    const params = new URLSearchParams({
      fields,
      interval: interval.toString(),
      intervalUnit,
    })
    const url = `${GMB_API_BASE}/profile/${profileId}/metrics?${params}`
    const headers = buildGMBHeaders(accessToken, workspaceId)

    const response = await fetchWithTimeout(url, { method: "GET", headers })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[GMB API] Metrics error response:", errorText)
      
      // If 401/403, the token is invalid - clear cache and retry
      if ((response.status === 401 || response.status === 403) && attempt < MAX_RETRIES) {
        console.log(`[GMB API] Auth error ${response.status}, retrying...`)
        await clearTokenCache()
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        throw new Error("AUTH_ERROR_RETRY") // Signal to retry
      }
      
      throw new Error(`GMB API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as GMBMetricsResponse

    if (!data.success) {
      throw new Error("GMB API returned unsuccessful response")
    }

    console.log(`[GMB API] Successfully fetched metrics for profile ${profileId.substring(0, 8)}`)
    return data
  }, `Fetching metrics for profile ${profileId.substring(0, 8)}...`)
}
