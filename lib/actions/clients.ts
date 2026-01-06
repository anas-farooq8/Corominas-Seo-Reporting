"use server"

// ============================================
// Client Actions
// ============================================

import * as db from "@/lib/db/clients"
import type { Client, ClientInput } from "@/lib/supabase/types"
import { withActionHandler } from "./action-helpers"

/**
 * Get all clients with project count
 */
export async function getClientsWithProjectCount() {
  return await db.getClientsWithProjectCount()
}

/**
 * Get a client with projects
 */
export async function getClientWithProjects(id: string) {
  return await db.getClientWithProjects(id)
}

/**
 * Create a new client
 */
export async function createClient(input: ClientInput): Promise<Client> {
  return withActionHandler(
    () => db.dbCreateClient(input),
    {
      errorMessage: "Failed to create client",
      revalidatePaths: ["/dashboard"]
    }
  )
}

/**
 * Update a client
 */
export async function updateClient(id: string, input: Partial<ClientInput>): Promise<Client> {
  return withActionHandler(
    () => db.updateClient(id, input),
    {
      errorMessage: "Failed to update client",
      revalidatePaths: ["/dashboard", `/dashboard/clients/${id}`]
    }
  )
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<void> {
  return withActionHandler(
    () => db.deleteClient(id),
    {
      errorMessage: "Failed to delete client",
      revalidatePaths: ["/dashboard"]
    }
  )
}
