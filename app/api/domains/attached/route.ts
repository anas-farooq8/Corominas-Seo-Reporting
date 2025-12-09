import { NextResponse } from "next/server"
import { authenticateRequest, unauthorizedResponse, errorResponse } from "@/lib/api/auth"

/**
 * Get ALL attached domains across ALL customers (global check)
 * This ensures one domain can only be attached to one customer
 */
export async function GET() {
  try {
    const auth = await authenticateRequest()
    if (!auth) return unauthorizedResponse()

    const { supabase } = auth

    // Get ALL attached domains across all customers (no customer filter)
    const { data, error } = await supabase.from("mangools_domains").select("domain").eq("is_active", true)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    return errorResponse(error, "Failed to fetch attached domains")
  }
}

