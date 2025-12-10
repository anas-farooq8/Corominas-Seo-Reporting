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
  tracking_id: string  // The _id from Mangools API (used for tracking)
  domain: string
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

export interface getDataSourcesWithRespectiveData extends Datasource {
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
    label: string
  }
  count: number
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
