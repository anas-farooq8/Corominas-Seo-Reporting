import { createClient } from "@/lib/supabase/server"
import type { Datasource, MangoolsDomain } from "@/lib/supabase/types"
import { cache } from "react"

/**
 * Get all datasources for a customer
 */
export const getDatasources = cache(async (customerId: string): Promise<Datasource[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("datasources")
    .select("*")
    .eq("customer_id", customerId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch datasources:", error)
    throw new Error(`Failed to fetch datasources: ${error.message}`)
  }
  return data || []
})

/**
 * Get a single datasource by ID
 */
export const getDatasource = cache(async (id: string): Promise<Datasource | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from("datasources").select("*").eq("id", id).single()

  if (error && error.code !== "PGRST116") {
    console.error("Failed to fetch datasource:", error)
    throw new Error(`Failed to fetch datasource: ${error.message}`)
  }
  return data || null
})

/**
 * Get Mangools domains for a datasource
 */
export const getMangoolsDomains = cache(async (datasourceId: string): Promise<MangoolsDomain[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("mangools_domains")
    .select("*")
    .eq("datasource_id", datasourceId)
    .eq("is_active", true)
    .order("domain", { ascending: true })

  if (error) {
    console.error("Failed to fetch Mangools domains:", error)
    throw new Error(`Failed to fetch Mangools domains: ${error.message}`)
  }
  return data || []
})
