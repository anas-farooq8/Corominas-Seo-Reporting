// ============================================
// Datasource Database Operations
// ============================================

import { createClient } from "@/lib/supabase/server"
import type { 
  Datasource, 
  DatasourceInput, 
  MangoolsDomain,
  GoogleAnalyticsProperty,
  SemrushDomain,
  GoogleSearchConsoleSite,
  GoogleBusinessProfileLocation,
  GMBProfile, 
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
      ),
      semrush_domains (
        *
      ),
      google_search_console_sites (
        *
      ),
      google_business_profile_locations (
        *
      ),
      gmb_profiles (
        *
      )
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data || []).map((datasource: any) => ({
    ...datasource,
    domain_count: (datasource.mangools_domains?.length || 0) + (datasource.google_analytics_properties?.length || 0) + (datasource.semrush_domains?.length || 0) + (datasource.google_search_console_sites?.length || 0) + (datasource.google_business_profile_locations?.length || 0) + (datasource.gmb_profiles?.length || 0)
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
 * Stores domain name, tracking_id, and automatically fetches tracking creation date from Mangools
 */
export async function attachDomain(
  datasourceId: string,
  trackingId: string,
  domain: string
): Promise<MangoolsDomain> {
  // Validate and sanitize input
  const trimmedDomain = domain?.trim().toLowerCase()
  const trimmedTrackingId = trackingId?.trim()

  if (!trimmedDomain) {
    throw new Error("Domain is required")
  }

  if (!trimmedTrackingId) {
    throw new Error("Tracking ID is required")
  }

  // Import here to avoid circular dependencies
  const { fetchTrackingDetail } = await import("@/lib/mangools/api")
  
  // Fetch tracking creation date from Mangools API
  let trackingCreatedAt: string | null = null
  try {
    const trackingDetail = await fetchTrackingDetail(trimmedTrackingId)
    if (trackingDetail.tracking.created_at) {
      trackingCreatedAt = new Date(trackingDetail.tracking.created_at * 1000).toISOString()
    }
  } catch (error) {
    console.warn("Could not fetch tracking creation date from Mangools:", error)
    // Continue without creation date - it's not critical
  }
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("mangools_domains")
    .insert({
      datasource_id: datasourceId,
      tracking_id: trimmedTrackingId,
      domain: trimmedDomain,
      tracking_created_at: trackingCreatedAt
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
  // Validate and sanitize input
  const trimmedName = name?.trim()
  const trimmedParent = parent?.trim()
  const trimmedDisplayName = displayName?.trim()
  const trimmedTimeZone = timeZone?.trim()
  const trimmedCurrencyCode = currencyCode?.trim().toUpperCase()

  if (!trimmedName) {
    throw new Error("Property name is required")
  }

  if (!trimmedDisplayName) {
    throw new Error("Display name is required")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("google_analytics_properties")
    .insert({
      datasource_id: datasourceId,
      name: trimmedName,
      parent: trimmedParent,
      display_name: trimmedDisplayName,
      time_zone: trimmedTimeZone,
      currency_code: trimmedCurrencyCode
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Attach a Semrush domain to a datasource
 */
export async function attachSemrushDomain(
  datasourceId: string,
  domain: string
): Promise<SemrushDomain> {
  // Validate and sanitize input
  const trimmedDomain = domain?.trim().toLowerCase()

  if (!trimmedDomain) {
    throw new Error("Domain is required")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("semrush_domains")
    .insert({
      datasource_id: datasourceId,
      domain: trimmedDomain
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Attach a Google Search Console site to a datasource
 */
export async function attachGoogleSearchConsoleSite(
  datasourceId: string,
  siteUrl: string
): Promise<GoogleSearchConsoleSite> {
  // Validate and sanitize input
  const trimmedSiteUrl = siteUrl?.trim()

  if (!trimmedSiteUrl) {
    throw new Error("Site URL is required")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("google_search_console_sites")
    .insert({
      datasource_id: datasourceId,
      site_url: trimmedSiteUrl
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Attach a Google Business Profile location to a datasource
 */
export async function attachGoogleBusinessProfileLocation(
  datasourceId: string,
  locationId: string,
  businessName: string,
  address?: string | null
): Promise<GoogleBusinessProfileLocation> {
  // Validate and sanitize input
  const trimmedLocationId = locationId?.trim()
  const trimmedBusinessName = businessName?.trim()
  const trimmedAddress = address?.trim()

  if (!trimmedLocationId) {
    throw new Error("Location ID is required")
  }

  if (!trimmedBusinessName) {
    throw new Error("Business name is required")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("google_business_profile_locations")
    .insert({
      datasource_id: datasourceId,
      location_id: trimmedLocationId,
      business_name: trimmedBusinessName,
      address: trimmedAddress || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Attach a GMB profile to a datasource
 */
export async function attachGMBProfile(
  datasourceId: string,
  profileId: string,
  businessName: string,
  address?: string | null
): Promise<GMBProfile> {
  // Validate and sanitize input
  const trimmedProfileId = profileId?.trim()
  const trimmedBusinessName = businessName?.trim()
  const trimmedAddress = address?.trim()

  if (!trimmedProfileId) {
    throw new Error("Profile ID is required")
  }

  if (!trimmedBusinessName) {
    throw new Error("Business name is required")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("gmb_profiles")
    .insert({
      datasource_id: datasourceId,
      profile_id: trimmedProfileId,
      business_name: trimmedBusinessName,
      address: trimmedAddress || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

