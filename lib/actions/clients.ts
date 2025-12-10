"use server"

// ============================================
// Client Actions
// ============================================

import { revalidatePath } from "next/cache"
import * as db from "@/lib/db/clients"
import type { Client, ClientInput } from "@/lib/supabase/types"

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
  try {
    const client = await db.dbCreateClient(input)
    revalidatePath("/dashboard")
    return client
  } catch (error) {
    console.error("Error creating client:", error)
    throw new Error("Failed to create client")
  }
}

/**
 * Update a client
 */
export async function updateClient(id: string, input: Partial<ClientInput>): Promise<Client> {
  try {
    const client = await db.updateClient(id, input)
    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/clients/${id}`)
    return client
  } catch (error) {
    console.error("Error updating client:", error)
    throw new Error("Failed to update client")
  }
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<void> {
  try {
    await db.deleteClient(id)
    revalidatePath("/dashboard")
  } catch (error) {
    console.error("Error deleting client:", error)
    throw new Error("Failed to delete client")
  }
}
