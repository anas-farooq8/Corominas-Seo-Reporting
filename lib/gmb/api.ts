// ============================================
// Grid My Business (GMB) API Library
// ============================================

import { getKVS, setKVS } from "@/lib/db/kvs"

const GMB_REFRESH_TOKEN_KEY = "gmb-refresh-token"
const GMB_API_BASE = "https://gmb-main-sb7q6jfhda-uc.a.run.app"

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

    // Create abort controller with 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

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
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('GMB authentication request timed out after 30 seconds')
      }
      throw fetchError
    }
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
 * If refresh token is invalid, automatically re-authenticates
 */
async function getAccessToken(): Promise<string> {
  const refreshToken = await getKVS(GMB_REFRESH_TOKEN_KEY)
  const apiKey = process.env.GMB_API_KEY

  if (!refreshToken) {
    // No refresh token - authenticate to get one
    console.log("[GMB Token] No refresh token found, authenticating...")
    await signInWithPassword()
    // Recursively call to get the token with new refresh token
    return getAccessToken()
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

    // Create abort controller with 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      // Convert payload to URL-encoded format
      const body = new URLSearchParams(payload).toString()

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[GMB Token] Error response:", errorText)
        
        // If refresh token is invalid, try to re-authenticate
        if (response.status === 400) {
          console.log("[GMB Token] Refresh token invalid, re-authenticating...")
          await signInWithPassword()
          // Recursively call to get token with new refresh token
          return getAccessToken()
        }
        
        throw new Error(`GMB token refresh failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as GMBTokenResponse

      return data.access_token
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('GMB token refresh request timed out after 30 seconds')
      }
      throw fetchError
    }
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
// GMB API Functions
// ============================================

/**
 * List all profiles from the current workspace
 * Returns all GMB profiles with their details
 * Automatically retries up to 3 times with 1 second delay if authentication fails
 */
export async function listProfiles(): Promise<GMBProfile[]> {
  const maxRetries = 3
  const retryDelay = 1000 // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[GMB API] Fetching profiles (attempt ${attempt}/${maxRetries})`)
      
      const accessToken = await getAccessToken()
      const workspaceId = process.env.GMB_WORKSPACE_ID

      if (!workspaceId) {
        throw new Error("GMB_WORKSPACE_ID environment variable is not set")
      }

      // Build URL with query parameters
      const params = new URLSearchParams({
        pageIndex: "0",
        pageLimit: "1000",
        sortBy: "alphabetical",
        sortDirection: "desc"
      })
      const url = `${GMB_API_BASE}/workspace/current/profiles?${params.toString()}`

      const headers = {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "authorization": `Bearer ${accessToken}`,
        "content-type": "application/json",
        "origin": "https://app.gridmybusiness.com",
        "referer": "https://app.gridmybusiness.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "workspace": workspaceId
      }

      // Create abort controller with 30 second timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const response = await fetch(url, {
          method: "GET",
          headers,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[GMB API] Error response:", errorText)
          
          // If 401/403, the token might be invalid - retry
          if ((response.status === 401 || response.status === 403) && attempt < maxRetries) {
            console.log(`[GMB API] Authentication error, will retry after ${retryDelay}ms...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay))
            continue // Retry
          }
          
          throw new Error(`GMB API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json() as GMBProfilesResponse

        if (!data.success) {
          throw new Error("GMB API returned unsuccessful response")
        }

        console.log(`[GMB API] Successfully fetched ${data.data.profiles.length} profiles`)
        return data.data.profiles
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('GMB API request timed out after 30 seconds')
        }
        throw fetchError
      }
    } catch (error: any) {
      console.error(`[GMB API] Attempt ${attempt}/${maxRetries} failed:`, error)

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        if (error.message?.includes("token refresh failed") || error.message?.includes("Authentication failed")) {
          throw new Error("Authentication failed after 3 attempts. Please check your credentials.")
        }
        throw new Error("Failed to fetch Grid My Business profiles after 3 attempts")
      }

      // Wait before retrying
      console.log(`[GMB API] Waiting ${retryDelay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  // This should never be reached due to the throw in the last attempt
  throw new Error("Failed to fetch Grid My Business profiles")
}

/**
 * List all keywords for a specific profile
 * Returns keywords with their scan history
 * Automatically retries up to 3 times with 1 second delay if authentication fails
 */
export async function listKeywords(profileId: string): Promise<GMBKeyword[]> {
  const maxRetries = 3
  const retryDelay = 1000 // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[GMB API] Fetching keywords for profile ${profileId} (attempt ${attempt}/${maxRetries})`)
      
      const accessToken = await getAccessToken()
      const workspaceId = process.env.GMB_WORKSPACE_ID

      if (!workspaceId) {
        throw new Error("GMB_WORKSPACE_ID environment variable is not set")
      }

      // Build URL with query parameters
      const params = new URLSearchParams({
        pageIndex: "0",
        pageLimit: "10",
        showMonitoringOnly: "true",
        sortBy: "alphabetical",
        sortDirection: "asc"
      })
      const url = `${GMB_API_BASE}/profile/${profileId}/keyword?${params.toString()}`

      const headers = {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "authorization": `Bearer ${accessToken}`,
        "content-type": "application/json",
        "origin": "https://app.gridmybusiness.com",
        "referer": "https://app.gridmybusiness.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "workspace": workspaceId
      }

      // Create abort controller with 30 second timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const response = await fetch(url, {
          method: "GET",
          headers,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[GMB API] Error response:", errorText)
          
          // If 401/403, the token might be invalid - retry
          if ((response.status === 401 || response.status === 403) && attempt < maxRetries) {
            console.log(`[GMB API] Authentication error, will retry after ${retryDelay}ms...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay))
            continue // Retry
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
          profileIds: kw.profileIds
        }))

        console.log(`[GMB API] Successfully fetched ${keywords.length} keywords`)
        return keywords
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('GMB API request timed out after 30 seconds')
        }
        throw fetchError
      }
    } catch (error: any) {
      console.error(`[GMB API] Attempt ${attempt}/${maxRetries} failed:`, error)

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        if (error.message?.includes("token refresh failed") || error.message?.includes("Authentication failed")) {
          throw new Error("Authentication failed after 3 attempts. Please check your credentials.")
        }
        throw new Error("Failed to fetch Grid My Business keywords after 3 attempts")
      }

      // Wait before retrying
      console.log(`[GMB API] Waiting ${retryDelay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  // This should never be reached due to the throw in the last attempt
  throw new Error("Failed to fetch Grid My Business keywords")
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

  const headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "authorization": `Bearer ${accessToken}`,
    "content-type": "application/json",
    "origin": "https://app.gridmybusiness.com",
    "referer": "https://app.gridmybusiness.com/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    "workspace": workspaceId
  }

  const payload = {
    pid: scanId
  }

  // Create abort controller with 30 second timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

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
  } catch (fetchError: any) {
    clearTimeout(timeoutId)
    if (fetchError.name === 'AbortError') {
      throw new Error('GMB API request timed out after 30 seconds')
    }
    throw fetchError
  }
}

/**
 * Get a fresh access token (exported for use in batch operations)
 */
export async function getFreshAccessToken(): Promise<string> {
  return getAccessToken()
}
