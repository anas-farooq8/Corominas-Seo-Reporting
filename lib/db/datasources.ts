import { createClient } from "@/lib/supabase/server"
import type { Datasource, DatasourceDomain } from "@/lib/supabase/types"
import { cache } from "react"

export const getDatasources = cache(async (customerId: string): Promise<Datasource[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("datasources")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch datasources: ${error.message}`)
  return data || []
})

export const getDatasource = cache(async (id: string): Promise<Datasource | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from("datasources").select("*").eq("id", id).single()

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch datasource: ${error.message}`)
  }
  return data || null
})

export const getAttachedDomains = cache(async (datasourceId: string): Promise<DatasourceDomain[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("datasource_domains")
    .select("*")
    .eq("datasource_id", datasourceId)
    .order("domain", { ascending: true })

  if (error) throw new Error(`Failed to fetch attached domains: ${error.message}`)
  return data || []
})
