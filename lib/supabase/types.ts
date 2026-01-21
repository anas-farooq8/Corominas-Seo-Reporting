// ============================================
// Database Types - Corominas SEO Reporting System
// ============================================

export interface Client {
  id: string
  name: string
  email: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  client_id: string
  name: string
  details: string | null
  created_at: string
  updated_at: string
}

export interface Datasource {
  id: string
  project_id: string
  type: "mangools" | "semrush" | "google_analytics" | "google_search_console" | "gbp" | "gmb"
  created_at: string
  updated_at: string
}

export interface MangoolsDomain {
  id: string
  datasource_id: string
  tracking_id: string  // The _id from Mangools API (used for tracking)
  domain: string
  tracking_created_at: string | null  // When tracking was created in Mangools
  created_at: string
  updated_at: string
}

export interface GoogleAnalyticsProperty {
  id: string
  datasource_id: string
  name: string  // The "name" field from GA API (e.g., "properties/516632017")
  parent: string
  display_name: string
  time_zone: string
  currency_code: string
  created_at: string
  updated_at: string
}

export interface SemrushDomain {
  id: string
  datasource_id: string
  domain: string  // The verified domain (e.g., "example.com")
  created_at: string
  updated_at: string
}

export interface GoogleSearchConsoleSite {
  id: string
  datasource_id: string
  site_url: string  // The site URL (e.g., "https://example.com/")
  created_at: string
  updated_at: string
}

export interface GoogleBusinessProfileLocation {
  id: string
  datasource_id: string
  location_id: string  // Full location ID (e.g., "accounts/123456789/locations/987654321")
  business_name: string
  address: string | null  // Business address from storefrontAddress API data
  created_at: string
  updated_at: string
}

export interface GMBProfile {
  id: string
  datasource_id: string
  profile_id: string  // The _id from GMB API (e.g., "695f6d6a0bdde7be0bb0abae")
  business_name: string  // Main text from structured_formatting
  address: string | null  // Secondary text (address)
  created_at: string
  updated_at: string
}

// Alias for MangoolsDomain used in datasource components
export type DatasourceDomain = MangoolsDomain

// ============================================
// Extended Types with Relations
// ============================================

export interface ClientWithProjects extends Client {
  projects?: Project[]
  project_count?: number
}

export interface ProjectWithDatasources extends Project {
  datasources?: Datasource[]
  datasource_count?: number
}

export interface DatasourceWithDomains extends Datasource {
  mangools_domains?: MangoolsDomain[]
  google_analytics_properties?: GoogleAnalyticsProperty[]
  semrush_domains?: SemrushDomain[]
  google_search_console_sites?: GoogleSearchConsoleSite[]
  google_business_profile_locations?: GoogleBusinessProfileLocation[]
  gmb_profiles?: GMBProfile[]
  domain_count?: number
}

// Keep the old alias for backwards compatibility
export type getDataSourcesWithRespectiveData = DatasourceWithDomains

// ============================================
// API Response Types
// ============================================

export interface MangoolsApiDomain {
  _id: string
  domain: string
  location: {
    label: string
  }
  count: number
}

export interface GoogleAnalyticsApiProperty {
  name: string  // e.g., "properties/516632017"
  parent: string  // e.g., "accounts/335827031"
  display_name: string
  time_zone: string
  currency_code: string
}

export interface GAAccount {
  name: string // e.g., "accounts/335827031"
  accountName: string // Display name
}

export interface GAAccountWithProperties extends GAAccount {
  properties: GoogleAnalyticsApiProperty[]
}

// ============================================
// Form Input Types
// ============================================

export interface ClientInput {
  name: string
  email: string
  notes?: string | null
}

export interface ProjectInput {
  client_id: string
  name: string
  details?: string | null
}

export interface DatasourceInput {
  project_id: string
  type: "mangools" | "semrush" | "google_analytics" | "google_search_console" | "gbp" | "gmb"
}

// ============================================
// GBP API Response Types
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
// GMB API Response Types
// ============================================

export interface GMBApiProfile {
  _id: string
  workspaceId: string
  source: string
  location: {
    structured_formatting: {
      main_text: string
      secondary_text?: string
    }
  }
}
