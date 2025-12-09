"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

const datasourceSchema = z.object({
  customer_id: z.string().uuid("Invalid customer ID"),
  name: z.string().min(1, "Name is required"),
  type: z.literal("mangools"),
})

type DatasourceInput = z.infer<typeof datasourceSchema>

export async function createDatasource(input: DatasourceInput) {
  try {
    const validated = datasourceSchema.parse(input)
    const supabase = await createClient()

    const { data, error } = await supabase.from("datasources").insert([validated]).select().single()

    if (error) throw new Error(error.message)

    revalidateTag(`datasources-${input.customer_id}`)
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create datasource"
    return { success: false, error: message }
  }
}

export async function deleteDatasource(id: string, customerId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("datasources").delete().eq("id", id)

    if (error) throw new Error(error.message)

    revalidateTag(`datasources-${customerId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete datasource"
    return { success: false, error: message }
  }
}
