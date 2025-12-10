"use server"

// ============================================
// Project Actions
// ============================================

import { revalidatePath } from "next/cache"
import * as db from "@/lib/db/projects"
import type { Project, ProjectInput } from "@/lib/supabase/types"

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
  try {
    const project = await db.dbCreateProject(input)
    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/clients/${input.client_id}`)
    return project
  } catch (error) {
    console.error("Error creating project:", error)
    throw new Error("Failed to create project")
  }
}

/**
 * Update a project
 */
export async function updateProject(id: string, input: Partial<ProjectInput>): Promise<Project> {
  try {
    const project = await db.updateProject(id, input)
    
    // Use the returned project data instead of making another DB call
    revalidatePath(`/dashboard/clients/${project.client_id}`)
    revalidatePath(`/dashboard/projects/${id}`)
    
    return project
  } catch (error) {
    console.error("Error updating project:", error)
    throw new Error("Failed to update project")
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    // Delete returns the deleted project, so we get client_id in one call
    const project = await db.deleteProject(id)
    revalidatePath(`/dashboard/clients/${project.client_id}`)
    revalidatePath("/dashboard")
  } catch (error) {
    console.error("Error deleting project:", error)
    throw new Error("Failed to delete project")
  }
}
