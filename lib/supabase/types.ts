export interface Customer {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

export interface Datasource {
  id: string
  customer_id: string
  type: "mangools" | string
  name: string
  created_at: string
  updated_at: string
}

export interface DatasourceDomain {
  id: string
  datasource_id: string
  domain: string
  rank: number | null
  traffic: number | null
  difficulty: number | null
  created_at: string
  updated_at: string
}

export interface MangoolsDomain {
  domain: string
  rank: number
  traffic: number
  difficulty: number
}
