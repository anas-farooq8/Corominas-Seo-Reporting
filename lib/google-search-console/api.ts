import { cache } from "react"
import { google } from "googleapis"

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

