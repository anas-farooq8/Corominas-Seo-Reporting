"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Dashboard Cache Entry
 */
export interface DashboardCacheEntry {
  id: string
  datasource_id: string
  resource_id: string
  start_date: string
  end_date: string
  data: any
  created_at: string
  updated_at: string
}

/**
 * Get cached dashboard data
 * @param datasourceId - The datasource ID
 * @param resourceId - The resource ID (tracking_id for Mangools, property name for GA)
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Cached data or null if not found
 */
export async function getCachedDashboardData(
  datasourceId: string,
  resourceId: string,
  startDate: string,
  endDate: string
): Promise<any | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("dashboard_cache")
      .select("data")
      .eq("datasource_id", datasourceId)
      .eq("resource_id", resourceId)
      .eq("start_date", startDate)
      .eq("end_date", endDate)
      .single()
    
    if (error) {
      // Not found or other error - return null
      console.log(`Cache miss for datasource ${datasourceId}, resource ${resourceId}, dates ${startDate} to ${endDate}`)
      return null
    }
    
    console.log(`✓ Cache hit for datasource ${datasourceId}, resource ${resourceId}`)
    return data.data
  } catch (error) {
    console.error("Error fetching cached dashboard data:", error)
    return null
  }
}

/**
 * Save dashboard data to cache
 * @param datasourceId - The datasource ID
 * @param resourceId - The resource ID (tracking_id for Mangools, property name for GA)
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param data - The dashboard data to cache
 * @returns True if saved successfully, false otherwise
 */
export async function saveDashboardCache(
  datasourceId: string,
  resourceId: string,
  startDate: string,
  endDate: string,
  data: any
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("dashboard_cache")
      .upsert({
        datasource_id: datasourceId,
        resource_id: resourceId,
        start_date: startDate,
        end_date: endDate,
        data: data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "datasource_id,resource_id,start_date,end_date"
      })
    
    if (error) {
      console.error("Error saving dashboard cache:", error)
      return false
    }
    
    console.log(`✓ Cached data for datasource ${datasourceId}, resource ${resourceId}`)
    return true
  } catch (error) {
    console.error("Error saving dashboard cache:", error)
    return false
  }
}
