// ============================================
// Client Database Operations
// ============================================

import { createClient } from "@/lib/supabase/server"
import type { Client, ClientInput, ClientWithProjects } from "@/lib/supabase/types"

/**
 * Get all clients with their project count
 */
export async function getClientsWithProjectCount(): Promise<ClientWithProjects[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      projects (
        id
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data || []).map((client: any) => ({
    ...client,
    project_count: client.projects?.length || 0,
    projects: undefined
  }))
}

/**
 * Get a client by ID with their projects
 */
export async function getClientWithProjects(id: string): Promise<ClientWithProjects | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      projects (
        *,
        datasources (
          id
        )
      )
    `)
    .eq("id", id)
    .single()

  if (error) return null
  
  // Add datasource_count to each project
  const projectsWithCount = (data.projects || []).map((project: any) => ({
    ...project,
    datasource_count: project.datasources?.length || 0,
    datasources: undefined
  }))
  
  return {
    ...data,
    projects: projectsWithCount,
    project_count: data.projects?.length || 0
  }
}

/**
 * Create a new client
 */
export async function dbCreateClient(input: ClientInput): Promise<Client> {
  // Validate and sanitize input
  const trimmedName = input.name?.trim()
  const trimmedEmail = input.email?.trim().toLowerCase()
  const trimmedNotes = input.notes?.trim()

  if (!trimmedName) {
    throw new Error("Client name is required")
  }

  if (!trimmedEmail) {
    throw new Error("Client email is required")
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    throw new Error("Invalid email address")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: trimmedName,
      email: trimmedEmail,
      notes: trimmedNotes || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a client
 */
export async function updateClient(id: string, input: Partial<ClientInput>): Promise<Client> {
  // Validate and sanitize input
  const updateData: Partial<ClientInput> = {}
  
  if (input.name !== undefined) {
    const trimmedName = input.name.trim()
    if (!trimmedName) {
      throw new Error("Client name cannot be empty")
    }
    updateData.name = trimmedName
  }
  
  if (input.email !== undefined) {
    const trimmedEmail = input.email.trim().toLowerCase()
    if (!trimmedEmail) {
      throw new Error("Client email cannot be empty")
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error("Invalid email address")
    }
    updateData.email = trimmedEmail
  }
  
  if (input.notes !== undefined) {
    updateData.notes = input.notes ? input.notes.trim() : null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)

  if (error) throw error
}
