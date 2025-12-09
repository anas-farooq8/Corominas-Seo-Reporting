// ============================================
// Database Types - Corominas SEO Reporting System
// ============================================

export interface Customer {
  id: string
  name: string
  email: string | null
  created_at: string
  updated_at: string
}

export interface Datasource {
  id: string
  customer_id: string
  type: "mangools" | "semrush"
  name: string
  is_active: boolean
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
  is_active: boolean
  created_at: string
  updated_at: string
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

export interface CustomerInput {
  name: string
  email?: string | null
}

export interface DatasourceInput {
  customer_id: string
  type: "mangools" | "semrush"
  name: string
}
