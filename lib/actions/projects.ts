"use server"

// ============================================
// Project Actions
// ============================================

import * as db from "@/lib/db/projects"
import type { Project, ProjectInput } from "@/lib/supabase/types"
import { withActionHandler } from "./action-helpers"

/**
 * Get all projects for a client with datasource count
 */
export async function getProjectsWithDatasourceCount(clientId: string) {
  return await db.getProjectsWithDatasourceCount(clientId)
}

/**
 * Get a project with datasources
 */
export async function getProjectWithDatasources(id: string) {
  return await db.getProjectWithDatasources(id)
}

/**
 * Create a new project
 */
export async function createProject(input: ProjectInput): Promise<Project> {
  return withActionHandler(
    () => db.dbCreateProject(input),
    {
      errorMessage: "Failed to create project",
      revalidatePaths: ["/dashboard", `/dashboard/clients/${input.client_id}`]
    }
  )
}

/**
 * Update a project
 */
export async function updateProject(id: string, input: Partial<ProjectInput>): Promise<Project> {
  return withActionHandler(
    async () => {
      const project = await db.updateProject(id, input)
      // Return project for revalidation path calculation
      return project
    },
    {
      errorMessage: "Failed to update project",
      revalidatePaths: [`/dashboard/projects/${id}`]
    }
  )
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  return withActionHandler(
    async () => {
      const project = await db.deleteProject(id)
      // Manually revalidate client path since we need project data
      const { revalidatePath } = await import("next/cache")
      revalidatePath(`/dashboard/clients/${project.client_id}`)
    },
    {
      errorMessage: "Failed to delete project",
      revalidatePaths: ["/dashboard"]
    }
  )
}
