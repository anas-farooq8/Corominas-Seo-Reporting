// ============================================
// Datasource Database Operations
// ============================================

import { createClient } from "@/lib/supabase/server"
import type { 
  Datasource, 
  DatasourceInput, 
  MangoolsDomain, 
  DatasourceWithDomains 
} from "@/lib/supabase/types"

/**
 * Get all datasources for a project
 */
export async function getDatasourcesByProjectId(projectId: string): Promise<Datasource[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("datasources")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get all datasources for a project with their domains
 */
export async function getDatasourcesWithDomains(projectId: string): Promise<DatasourceWithDomains[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("datasources")
    .select(`
      *,
      mangools_domains (
        *
      )
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data || []).map((datasource: any) => ({
    ...datasource,
    domain_count: datasource.mangools_domains?.length || 0
  }))
}

/**
 * Get a datasource by ID
 */
export async function getDatasourceById(id: string): Promise<Datasource | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("datasources")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return null
  return data
}

/**
 * Get a datasource by ID with domains
 */
export async function getDatasourceWithDomains(id: string): Promise<DatasourceWithDomains | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("datasources")
    .select(`
      *,
      mangools_domains (
        *
      )
    `)
    .eq("id", id)
    .single()

  if (error) return null
  
  return {
    ...data,
    domain_count: data.mangools_domains?.length || 0
  }
}

/**
 * Create a new datasource
 */
export async function createDatasource(input: DatasourceInput): Promise<Datasource> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("datasources")
    .insert({
      project_id: input.project_id,
      type: input.type
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a datasource
 */
export async function deleteDatasource(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("datasources")
    .delete()
    .eq("id", id)

  if (error) throw error
}

/**
 * Get domains for a datasource
 */
export async function getDomainsByDatasourceId(datasourceId: string): Promise<MangoolsDomain[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("mangools_domains")
    .select("*")
    .eq("datasource_id", datasourceId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Attach a domain to a datasource
 * Only stores domain name and tracking_id
 */
export async function attachDomain(
  datasourceId: string,
  trackingId: string,
  domain: string
): Promise<MangoolsDomain> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("mangools_domains")
    .insert({
      datasource_id: datasourceId,
      tracking_id: trackingId,
      domain
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Note: Domains are automatically deleted when datasource is deleted (CASCADE)
// No manual detach function needed

/**
 * Get all attached domains
 */
export async function getAllAttachedDomains(): Promise<MangoolsDomain[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("mangools_domains")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Check if a datasource has any attached domains
 */
export async function hasDatasourceAttachedDomains(datasourceId: string): Promise<boolean> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("mangools_domains")
    .select("*", { count: "exact", head: true })
    .eq("datasource_id", datasourceId)

  if (error) return false
  return (count || 0) > 0
}
