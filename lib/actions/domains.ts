"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchMangoolsDomains, parseMangoolsDomainForDb } from "@/lib/mangools/api"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const attachDomainSchema = z.object({
  datasource_id: z.string().uuid("Invalid datasource ID"),
  domain: z.string().min(1, "Domain is required"),
})

type AttachDomainInput = z.infer<typeof attachDomainSchema>

/**
 * Attach a domain from Mangools API to a datasource
 * Fetches latest data from API and stores normalized fields
 */
export async function attachDomain(input: AttachDomainInput) {
  try {
    const validated = attachDomainSchema.parse(input)

    // Fetch all available domains from Mangools
    const mangoolsDomains = await fetchMangoolsDomains()

    // Find the domain in the API response
    const foundDomain = mangoolsDomains.find((d) => d.domain === validated.domain)
    if (!foundDomain) {
      return { success: false, error: "Domain not found in Mangools" }
    }

    // Parse and normalize the domain data
    const parsedDomain = parseMangoolsDomainForDb(foundDomain)

    // Insert into database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("mangools_domains")
      .insert([
        {
          datasource_id: validated.datasource_id,
          mangools_id: parsedDomain.mangools_id,
          domain: parsedDomain.domain,
          location_code: parsedDomain.location_code,
          location_label: parsedDomain.location_label,
          platform_id: parsedDomain.platform_id,
          keywords_count: parsedDomain.keywords_count,
          mangools_created_at: parsedDomain.mangools_created_at,
        },
      ])
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "This domain is already attached to another customer" }
      }
      throw new Error(error.message)
    }

    // Get customer_id from datasource to revalidate the correct path
    const { data: datasource } = await supabase
      .from("datasources")
      .select("customer_id")
      .eq("id", validated.datasource_id)
      .single()

    if (datasource) {
      revalidatePath(`/dashboard/customers/${datasource.customer_id}`)
    }
    
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to attach domain"
    return { success: false, error: message }
  }
}

export async function detachDomain(id: string, datasourceId: string) {
  try {
    const supabase = await createClient()

    // Soft delete by setting is_active to false
    const { error } = await supabase.from("mangools_domains").update({ is_active: false }).eq("id", id)

    if (error) throw new Error(error.message)

    // Get customer_id from datasource to revalidate the correct path
    const { data: datasource } = await supabase
      .from("datasources")
      .select("customer_id")
      .eq("id", datasourceId)
      .single()

    if (datasource) {
      revalidatePath(`/dashboard/customers/${datasource.customer_id}`)
    }
    
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to detach domain"
    return { success: false, error: message }
  }
}
