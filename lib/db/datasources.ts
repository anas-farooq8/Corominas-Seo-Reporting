// ============================================
// Datasource Database Operations
// ============================================

import { createClient } from "@/lib/supabase/server"
import type { 
  Datasource, 
  DatasourceInput, 
  MangoolsDomain,
  GoogleAnalyticsProperty, 
  getDataSourcesWithRespectiveData 
} from "@/lib/supabase/types"

/**
 * Get all datasources for a project with their respective data (domains, properties, etc.)
 */
export async function getDataSourcesWithRespectiveData(projectId: string): Promise<getDataSourcesWithRespectiveData[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("datasources")
    .select(`
      *,
      mangools_domains (
        *
      ),
      google_analytics_properties (
        *
      )
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data || []).map((datasource: any) => ({
    ...datasource,
    domain_count: (datasource.mangools_domains?.length || 0) + (datasource.google_analytics_properties?.length || 0)
  }))
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
export async function deleteDatasource(id: string): Promise<Datasource> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("datasources")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
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

/**
 * Attach a Google Analytics property to a datasource
 */
export async function attachGoogleAnalyticsProperty(
  datasourceId: string,
  name: string,
  parent: string,
  displayName: string,
  timeZone: string,
  currencyCode: string
): Promise<GoogleAnalyticsProperty> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("google_analytics_properties")
    .insert({
      datasource_id: datasourceId,
      name,
      parent,
      display_name: displayName,
      time_zone: timeZone,
      currency_code: currencyCode
    })
    .select()
    .single()

  if (error) throw error
  return data
}
