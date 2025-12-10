"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchMangoolsDomains } from "@/lib/mangools/api"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const attachDomainSchema = z.object({
  datasource_id: z.string().uuid("Invalid datasource ID"),
  domain: z.string().min(1, "Domain is required"),
})

type AttachDomainInput = z.infer<typeof attachDomainSchema>

/**
 * Attach a domain from Mangools API to a datasource
 * Only stores domain name and tracking_id
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

    // Insert into database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("mangools_domains")
      .insert([
        {
          datasource_id: validated.datasource_id,
          tracking_id: foundDomain._id,
          domain: foundDomain.domain,
        },
      ])
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "This domain is already attached to another project" }
      }
      throw new Error(error.message)
    }
    
    // Revalidate the project page
    const { data: datasource } = await supabase
      .from("datasources")
      .select("project_id")
      .eq("id", validated.datasource_id)
      .single()
    
    if (datasource) {
      revalidatePath(`/dashboard/projects/${datasource.project_id}`)
    }
    
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to attach domain"
    return { success: false, error: message }
  }
}

// Note: No detach function - domains are automatically deleted when datasource is deleted (CASCADE)

/**
 * Get attached domain by datasource ID
 */
export async function getAttachedDomainByDatasourceId(datasourceId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("mangools_domains")
      .select("*")
      .eq("datasource_id", datasourceId)
      .single()

    if (error) return null
    return data
  } catch (error) {
    console.error("Error fetching attached domain:", error)
    return null
  }
}
