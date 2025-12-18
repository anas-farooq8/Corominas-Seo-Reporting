// ============================================
// Project Database Operations
// ============================================

import { createClient } from "@/lib/supabase/server"
import type { Project, ProjectInput, ProjectWithDatasources } from "@/lib/supabase/types"

/**
 * Get all projects for a client with datasource count
 */
export async function getProjectsWithDatasourceCount(clientId: string): Promise<ProjectWithDatasources[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      datasources (
        id
      )
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data || []).map((project: any) => ({
    ...project,
    datasource_count: project.datasources?.length || 0,
    datasources: undefined
  }))
}

/**
 * Get a project by ID with datasources
 */
export async function getProjectWithDatasources(id: string): Promise<ProjectWithDatasources | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      datasources (
        *,
        mangools_domains (
          *
        ),
        google_analytics_properties (
          *
        ),
        semrush_domains (
          *
        )
      )
    `)
    .eq("id", id)
    .single()

  if (error) return null
  
  // Map datasources to include domain_count for each datasource
  const datasourcesWithCount = (data.datasources || []).map((datasource: any) => ({
    ...datasource,
    domain_count: (datasource.mangools_domains?.length || 0) + (datasource.google_analytics_properties?.length || 0) + (datasource.semrush_domains?.length || 0)
  }))
  
  return {
    ...data,
    datasources: datasourcesWithCount,
    datasource_count: datasourcesWithCount.length
  }
}

/**
 * Create a new project
 */
export async function dbCreateProject(input: ProjectInput): Promise<Project> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: input.client_id,
      name: input.name,
      details: input.details || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a project
 */
export async function updateProject(id: string, input: Partial<ProjectInput>): Promise<Project> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .update({
      name: input.name,
      details: input.details
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<Project> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

