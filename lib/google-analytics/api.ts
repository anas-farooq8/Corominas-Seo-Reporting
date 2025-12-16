import type { GoogleAnalyticsApiProperty } from "@/lib/supabase/types"
import { cache } from "react"
import { google } from "googleapis"

const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]

// ============================================
// Google Analytics Admin API Client
// ============================================

/**
 * Get authenticated Google Analytics Admin API client
 */
function getClient() {
  const credentials = {
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

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  })

  return google.analyticsadmin({ version: "v1beta", auth })
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
    const client = getClient()

    const response = await client.properties.list({
      filter: `parent:accounts/${gaAccountId}`,
      pageSize: 200,
      showDeleted: false,
    })

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
  } catch (error) {
    console.error("[Google Analytics API] Fetch failed:", error)
    throw error
  }
})

