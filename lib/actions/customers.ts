"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  notes: z.string().optional().nullable(),
})

type CustomerInput = z.infer<typeof customerSchema>

export async function createCustomer(input: CustomerInput) {
  try {
    const validated = customerSchema.parse(input)
    const supabase = await createClient()

    // Check if email already exists (case-insensitive)
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .ilike("email", validated.email)
      .single()

    if (existingCustomer) {
      return { success: false, error: "A customer with this email already exists" }
    }

    const { data, error } = await supabase.from("customers").insert([validated]).select().single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === "23505") {
        return { success: false, error: "A customer with this email already exists" }
      }
      throw new Error(error.message)
    }

    revalidatePath("/dashboard")
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

    // Check if email already exists (case-insensitive) for a different customer
    if (validated.email) {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .ilike("email", validated.email)
        .neq("id", id)
        .single()

      if (existingCustomer) {
        return { success: false, error: "A customer with this email already exists" }
      }
    }

    const { data, error } = await supabase
      .from("customers")
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === "23505") {
        return { success: false, error: "A customer with this email already exists" }
      }
      throw new Error(error.message)
    }

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/customers/${id}`)
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

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete customer"
    return { success: false, error: message }
  }
}
