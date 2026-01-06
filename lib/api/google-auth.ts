/**
 * Google API Authentication Helpers
 * Consolidated Google Service Account credentials management
 * Used by Google Analytics and Google Search Console APIs
 */

import { google } from "googleapis"

/**
 * Get Google service account credentials from environment variables
 * Used by both Google Analytics and Google Search Console APIs
 */
export function getGoogleServiceAccountCredentials() {
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
 * Create Google Auth client with service account credentials
 * @param scopes - Array of OAuth2 scopes required for the API
 */
export function createGoogleAuthClient(scopes: string[]) {
  return new google.auth.GoogleAuth({
    credentials: getGoogleServiceAccountCredentials(),
    scopes,
  })
}

/**
 * Validate that Google service account credentials are configured
 * Throws an error if credentials are missing
 */
export function validateGoogleCredentials() {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error("Google service account credentials are not configured")
  }
}

