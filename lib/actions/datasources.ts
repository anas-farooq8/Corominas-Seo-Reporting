"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const datasourceSchema = z.object({
  customer_id: z.string().uuid(),
  type: z.enum(["mangools", "semrush"]),
})

type DatasourceInput = z.infer<typeof datasourceSchema>

/**
 * Create a new datasource for a customer
 */
export async function createDatasource(input: DatasourceInput) {
  try {
    const validated = datasourceSchema.parse(input)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("datasources")
      .insert([validated])
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/customers/${validated.customer_id}`)
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create datasource"
    console.error("Create datasource error:", error)
    return { success: false, error: message }
  }
}

/**
 * Update a datasource
 */
export async function updateDatasource(id: string, input: Partial<DatasourceInput>) {
  try {
    const validated = datasourceSchema.partial().parse(input)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("datasources")
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath("/dashboard")
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update datasource"
    console.error("Update datasource error:", error)
    return { success: false, error: message }
  }
}

/**
 * Delete a datasource
 */
export async function deleteDatasource(id: string) {
  try {
    const supabase = await createClient()

    // Soft delete by setting is_active to false
    const { error } = await supabase.from("datasources").update({ is_active: false }).eq("id", id)

    if (error) throw new Error(error.message)

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete datasource"
    console.error("Delete datasource error:", error)
    return { success: false, error: message }
  }
}
