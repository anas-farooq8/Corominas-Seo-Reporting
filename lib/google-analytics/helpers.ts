/**
 * Google Analytics Helper Functions
 * Consolidated functions to reduce duplication across GA action files
 */

import { createClient } from "@/lib/supabase/server"

/**
 * Get Google Analytics property details from database
 * Used by both dashboard and landing pages actions
 */
export async function getGAPropertyDetails(datasourceId: string) {
  const supabase = await createClient()
  const { data: property, error: propertyError } = await supabase
    .from("google_analytics_properties")
    .select("name, display_name, time_zone, currency_code")
    .eq("datasource_id", datasourceId)
    .single()
  
  if (propertyError || !property) {
    console.error("Property not found for datasource:", datasourceId, propertyError)
    return null
  }
  
  return property
}

/**
 * Extract property ID from property name
 * e.g., "properties/469744307" -> "469744307"
 */
export function extractPropertyId(propertyName: string): string {
  const propertyId = propertyName.split('/')[1]
  
  if (!propertyId) {
    throw new Error("Invalid property name format")
  }
  
  return propertyId
}

