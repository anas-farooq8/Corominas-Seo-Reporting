"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
})

type CustomerInput = z.infer<typeof customerSchema>

export async function createCustomer(input: CustomerInput) {
  try {
    const validated = customerSchema.parse(input)
    const supabase = await createClient()

    const { data, error } = await supabase.from("customers").insert([validated]).select().single()

    if (error) throw new Error(error.message)

    revalidateTag("customers")
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create customer"
    return { success: false, error: message }
  }
}

export async function updateCustomer(id: string, input: Partial<CustomerInput>) {
  try {
    const validated = customerSchema.partial().parse(input)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("customers")
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidateTag("customers")
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update customer"
    return { success: false, error: message }
  }
}

export async function deleteCustomer(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("customers").delete().eq("id", id)

    if (error) throw new Error(error.message)

    revalidateTag("customers")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete customer"
    return { success: false, error: message }
  }
}
