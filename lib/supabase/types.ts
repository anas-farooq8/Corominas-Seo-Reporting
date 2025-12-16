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
  type: "mangools" | "semrush" | "google_analytics"
  created_at: string
  updated_at: string
}

export interface MangoolsDomain {
  id: string
  datasource_id: string
  tracking_id: string  // The _id from Mangools API (used for tracking)
  domain: string
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
  create_time: string
  update_time: string
  display_name: string
  industry_category?: string
  time_zone: string
  currency_code: string
  service_level?: string
  account?: string
  property_type?: string
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
  type: "mangools" | "semrush" | "google_analytics"
}
