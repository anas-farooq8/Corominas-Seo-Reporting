"use server"

// ============================================
// Datasource Actions
// ============================================

import { revalidatePath } from "next/cache"
import * as db from "@/lib/db/datasources"
import type { Datasource, DatasourceInput, MangoolsDomain, GoogleAnalyticsProperty, SemrushDomain } from "@/lib/supabase/types"

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
  try {
    const datasource = await db.createDatasource(input)
    revalidatePath(`/dashboard/projects/${input.project_id}`)
    return datasource
  } catch (error) {
    console.error("Error creating datasource:", error)
    throw new Error("Failed to create datasource")
  }
}

/**
 * Delete a datasource
 */
export async function deleteDatasource(id: string): Promise<void> {
  try {
    // Delete returns the deleted datasource, so we get project_id in one call
    const datasource = await db.deleteDatasource(id)
    revalidatePath(`/dashboard/projects/${datasource.project_id}`)
  } catch (error) {
    console.error("Error deleting datasource:", error)
    throw new Error("Failed to delete datasource")
  }
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
  try {
    const attachedDomain = await db.attachDomain(
      datasourceId,
      trackingId,
      domain
    )
    
    // Use projectId parameter instead of making extra DB call
    revalidatePath(`/dashboard/projects/${projectId}`)
    
    return attachedDomain
  } catch (error) {
    console.error("Error attaching domain:", error)
    throw new Error("Failed to attach domain")
  }
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
  try {
    const attachedProperty = await db.attachGoogleAnalyticsProperty(
      datasourceId,
      name,
      parent,
      displayName,
      timeZone,
      currencyCode
    )
    
    revalidatePath(`/dashboard/projects/${projectId}`)
    
    return attachedProperty
  } catch (error) {
    console.error("Error attaching Google Analytics property:", error)
    throw new Error("Failed to attach Google Analytics property")
  }
}

/**
 * Attach a Semrush domain to a datasource
 */
export async function attachSemrushDomain(
  datasourceId: string,
  domain: string,
  projectId: string
): Promise<SemrushDomain> {
  try {
    const attachedDomain = await db.attachSemrushDomain(
      datasourceId,
      domain
    )
    
    revalidatePath(`/dashboard/projects/${projectId}`)
    
    return attachedDomain
  } catch (error) {
    console.error("Error attaching Semrush domain:", error)
    throw new Error("Failed to attach Semrush domain")
  }
}

