import { NextResponse } from "next/server"
import { hasRefreshToken } from "@/lib/google-business-profile/api"

/**
 * Check if GBP OAuth is configured and has a refresh token
 * GET /api/gbp/auth-status
 */
export async function GET() {
  console.log("[API] GET /api/gbp/auth-status")
  
  try {
    const hasToken = await hasRefreshToken()
    
    console.log(`[API] GBP auth status: ${hasToken ? "authenticated" : "not authenticated"}`)
    
    return NextResponse.json({ 
      authenticated: hasToken,
    })
  } catch (error) {
    console.error("[API] Error checking GBP auth status:", error)
    return NextResponse.json(
      { error: "Failed to check authentication status" },
      { status: 500 }
    )
  }
}

