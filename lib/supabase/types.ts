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
  type: "mangools" | "semrush"
  created_at: string
  updated_at: string
}

export interface MangoolsDomain {
  id: string
  datasource_id: string
  mangools_id: string
  domain: string
  location_code: string | null
  location_label: string | null
  platform_id: number | null
  keywords_count: number
  mangools_created_at: number | null
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
  domain_count?: number
}

// ============================================
// API Response Types
// ============================================

export interface MangoolsApiDomain {
  _id: string
  domain: string
  location: {
    _id: number
    code: string
    label: string
  }
  platform_id: number
  count: number
  tracked_keyword_ids: string[]
  tracking_config: {
    place_id: string | null
    ludocid: string | null
    name: string | null
    address: string | null
    forced_place_id: string | null
  }
  share_token: string
  created_at: number
  is_deleted: boolean
  reports_active: [any, any]
  stats?: {
    timeframes: Record<string, {
      performance_index: number
      visibility_index: number
      performance_total: number
      estimated_visits: number
      rank_distribution: {
        "1": number
        "3": number
        "10": number
        "20": number
        "100": number
        "rest": number
      }
    }>
  }
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
  type: "mangools" | "semrush"
}
