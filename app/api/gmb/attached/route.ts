import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Get all attached GMB profiles for datasources
 * Used to filter out already attached profiles
 * GET /api/gmb/attached
 */
export async function GET(request: NextRequest) {
  console.log("[API] GET /api/gmb/attached")

  try {
    const supabase = await createClient()

    // Get all attached GMB profile IDs
    const { data, error } = await supabase
      .from("gmb_profiles")
      .select("profile_id")

    if (error) throw error

    const attachedProfileIds = (data || []).map(item => item.profile_id)

    return NextResponse.json({
      success: true,
      attachedProfileIds
    })
  } catch (error) {
    console.error("[API] Error fetching attached GMB profiles:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * Attach a GMB profile to a datasource
 * POST /api/gmb/attached
 */
export async function POST(request: NextRequest) {
  console.log("[API] POST /api/gmb/attached")

  try {
    const body = await request.json()
    const { datasourceId, profileId, businessName, address } = body

    if (!datasourceId || !profileId || !businessName) {
      return NextResponse.json(
        { error: "Missing required fields: datasourceId, profileId, businessName" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insert the GMB profile
    const { data, error } = await supabase
      .from("gmb_profiles")
      .insert({
        datasource_id: datasourceId,
        profile_id: profileId,
        business_name: businessName,
        address: address || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      profile: data
    })
  } catch (error) {
    console.error("[API] Error attaching GMB profile:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
