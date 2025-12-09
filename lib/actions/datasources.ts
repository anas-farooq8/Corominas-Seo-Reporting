"use server"

// ============================================
// Datasource Actions
// ============================================

import { revalidatePath } from "next/cache"
import * as db from "@/lib/db/datasources"
import type { Datasource, DatasourceInput, MangoolsDomain } from "@/lib/supabase/types"

/**
 * Get all datasources for a project
 */
export async function getDatasourcesByProjectId(projectId: string) {
  return await db.getDatasourcesByProjectId(projectId)
}

/**
 * Get all datasources for a project with domains
 */
export async function getDatasourcesWithDomains(projectId: string) {
  return await db.getDatasourcesWithDomains(projectId)
}

/**
 * Get a datasource by ID
 */
export async function getDatasourceById(id: string) {
  return await db.getDatasourceById(id)
}

/**
 * Get a datasource with domains
 */
export async function getDatasourceWithDomains(id: string) {
  return await db.getDatasourceWithDomains(id)
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
    const datasource = await db.getDatasourceById(id)
    await db.deleteDatasource(id)
    if (datasource) {
      revalidatePath(`/dashboard/projects/${datasource.project_id}`)
    }
  } catch (error) {
    console.error("Error deleting datasource:", error)
    throw new Error("Failed to delete datasource")
  }
}

/**
 * Get domains for a datasource
 */
export async function getDomainsByDatasourceId(datasourceId: string): Promise<MangoolsDomain[]> {
  return await db.getDomainsByDatasourceId(datasourceId)
}

/**
 * Attach a domain to a datasource
 */
export async function attachDomain(
  datasourceId: string,
  mangoolsId: string,
  domain: string,
  locationCode: string | null,
  locationLabel: string | null,
  platformId: number | null,
  keywordsCount: number,
  mangoolsCreatedAt: number | null
): Promise<MangoolsDomain> {
  try {
    const attachedDomain = await db.attachDomain(
      datasourceId,
      mangoolsId,
      domain,
      locationCode,
      locationLabel,
      platformId,
      keywordsCount,
      mangoolsCreatedAt
    )
    
    const datasource = await db.getDatasourceById(datasourceId)
    if (datasource) {
      revalidatePath(`/dashboard/projects/${datasource.project_id}`)
    }
    
    return attachedDomain
  } catch (error) {
    console.error("Error attaching domain:", error)
    throw new Error("Failed to attach domain")
  }
}

/**
 * Detach a domain from a datasource
 */
export async function detachDomain(domainId: string): Promise<void> {
  try {
    // Get the domain to find its datasource
    const supabase = await import("@/lib/supabase/server").then(m => m.createClient())
    const client = await supabase
    const { data: domain } = await client
      .from("mangools_domains")
      .select("datasource_id")
      .eq("id", domainId)
      .single()

    await db.detachDomain(domainId)
    
    if (domain) {
      const datasource = await db.getDatasourceById(domain.datasource_id)
      if (datasource) {
        revalidatePath(`/dashboard/projects/${datasource.project_id}`)
      }
    }
  } catch (error) {
    console.error("Error detaching domain:", error)
    throw new Error("Failed to detach domain")
  }
}

/**
 * Get all attached domains
 */
export async function getAllAttachedDomains(): Promise<MangoolsDomain[]> {
  return await db.getAllAttachedDomains()
}

/**
 * Check if a datasource has any attached domains
 */
export async function hasDatasourceAttachedDomains(datasourceId: string): Promise<boolean> {
  return await db.hasDatasourceAttachedDomains(datasourceId)
}
