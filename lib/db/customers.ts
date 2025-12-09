import { createClient } from "@/lib/supabase/server"
import type { Customer } from "@/lib/supabase/types"
import { cache } from "react"

export const getCustomers = cache(async (): Promise<Customer[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch customers: ${error.message}`)
  return data || []
})

export const getCustomer = cache(async (id: string): Promise<Customer | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).single()

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch customer: ${error.message}`)
  }
  return data || null
})
