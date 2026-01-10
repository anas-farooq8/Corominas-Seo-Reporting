"use server"

// ============================================
// Datasource Actions
// ============================================

import * as db from "@/lib/db/datasources"
import type { Datasource, DatasourceInput, MangoolsDomain, GoogleAnalyticsProperty, SemrushDomain, GoogleSearchConsoleSite, GoogleBusinessProfileLocation, GMBProfile } from "@/lib/supabase/types"
import { withActionHandler } from "./action-helpers"

/**
 * Get all datasources for a project with their respective data (domains, etc.)
 */
export async function getDataSourcesWithRespectiveData(projectId: string) {
  return await db.getDataSourcesWithRespectiveData(projectId)
}

/**
 * Create a new datasource
 */
export async function createDatasource(input: DatasourceInput): Promise<Datasource> {
  return withActionHandler(
    () => db.createDatasource(input),
    {
      errorMessage: "Failed to create datasource",
      revalidatePaths: [`/dashboard/projects/${input.project_id}`]
    }
  )
}

/**
 * Delete a datasource
 */
export async function deleteDatasource(id: string): Promise<void> {
  return withActionHandler(
    async () => {
      const datasource = await db.deleteDatasource(id)
      // Manually revalidate since we need datasource data
      const { revalidatePath } = await import("next/cache")
      revalidatePath(`/dashboard/projects/${datasource.project_id}`)
    },
    {
      errorMessage: "Failed to delete datasource",
      revalidatePaths: []
    }
  )
}

/**
 * Attach a domain to a datasource
 * Only stores domain name and tracking_id
 */
export async function attachDomain(
  datasourceId: string,
  trackingId: string,
  domain: string,
  projectId: string
): Promise<MangoolsDomain> {
  return withActionHandler(
    () => db.attachDomain(datasourceId, trackingId, domain),
    {
      errorMessage: "Failed to attach domain",
      revalidatePaths: [`/dashboard/projects/${projectId}`]
    }
  )
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
  currencyCode: string,
  projectId: string
): Promise<GoogleAnalyticsProperty> {
  return withActionHandler(
    () => db.attachGoogleAnalyticsProperty(datasourceId, name, parent, displayName, timeZone, currencyCode),
    {
      errorMessage: "Failed to attach Google Analytics property",
      revalidatePaths: [`/dashboard/projects/${projectId}`]
    }
  )
}

/**
 * Attach a Semrush domain to a datasource
 */
export async function attachSemrushDomain(
  datasourceId: string,
  domain: string,
  projectId: string
): Promise<SemrushDomain> {
  return withActionHandler(
    () => db.attachSemrushDomain(datasourceId, domain),
    {
      errorMessage: "Failed to attach Semrush domain",
      revalidatePaths: [`/dashboard/projects/${projectId}`]
    }
  )
}

/**
 * Attach a Google Search Console site to a datasource
 */
export async function attachGoogleSearchConsoleSite(
  datasourceId: string,
  siteUrl: string,
  projectId: string
): Promise<GoogleSearchConsoleSite> {
  return withActionHandler(
    () => db.attachGoogleSearchConsoleSite(datasourceId, siteUrl),
    {
      errorMessage: "Failed to attach Google Search Console site",
      revalidatePaths: [`/dashboard/projects/${projectId}`]
    }
  )
}

/**
 * Attach a Google Business Profile location to a datasource
 */
export async function attachGoogleBusinessProfileLocation(
  datasourceId: string,
  locationId: string,
  businessName: string,
  projectId: string
): Promise<GoogleBusinessProfileLocation> {
  return withActionHandler(
    () => db.attachGoogleBusinessProfileLocation(datasourceId, locationId, businessName),
    {
      errorMessage: "Failed to attach Google Business Profile location",
      revalidatePaths: [`/dashboard/projects/${projectId}`]
    }
  )
}

/**
 * Attach a GMB profile to a datasource
 */
export async function attachGMBProfile(
  datasourceId: string,
  profileId: string,
  businessName: string,
  address: string | null,
  projectId: string
): Promise<GMBProfile> {
  return withActionHandler(
    () => db.attachGMBProfile(datasourceId, profileId, businessName, address),
    {
      errorMessage: "Failed to attach Grid My Business profile",
      revalidatePaths: [`/dashboard/projects/${projectId}`]
    }
  )
}
