// ============================================
// Client Database Operations
// ============================================

import { createClient } from "@/lib/supabase/server"
import type { Client, ClientInput, ClientWithProjects } from "@/lib/supabase/types"

/**
 * Get all clients
 */
export async function getClients(): Promise<Client[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

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
 * Get a client by ID
 */
export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return null
  return data
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
        *
      )
    `)
    .eq("id", id)
    .single()

  if (error) return null
  
  return {
    ...data,
    project_count: data.projects?.length || 0
  }
}

/**
 * Create a new client
 */
export async function dbCreateClient(input: ClientInput): Promise<Client> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: input.name,
      email: input.email,
      notes: input.notes || null
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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .update({
      name: input.name,
      email: input.email,
      notes: input.notes
    })
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

