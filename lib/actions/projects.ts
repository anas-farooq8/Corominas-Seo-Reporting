"use server"

// ============================================
// Project Actions
// ============================================

import { revalidatePath } from "next/cache"
import * as db from "@/lib/db/projects"
import type { Project, ProjectInput } from "@/lib/supabase/types"

/**
 * Get all projects for a client
 */
export async function getProjectsByClientId(clientId: string) {
  return await db.getProjectsByClientId(clientId)
}

/**
 * Get all projects for a client with datasource count
 */
export async function getProjectsWithDatasourceCount(clientId: string) {
  return await db.getProjectsWithDatasourceCount(clientId)
}

/**
 * Get a project by ID
 */
export async function getProjectById(id: string) {
  return await db.getProjectById(id)
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
    const existing = await db.getProjectById(id)
    if (existing) {
      revalidatePath(`/dashboard/clients/${existing.client_id}`)
      revalidatePath(`/dashboard/projects/${id}`)
    }
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
    const project = await db.getProjectById(id)
    await db.deleteProject(id)
    if (project) {
      revalidatePath(`/dashboard/clients/${project.client_id}`)
    }
    revalidatePath("/dashboard")
  } catch (error) {
    console.error("Error deleting project:", error)
    throw new Error("Failed to delete project")
  }
}

