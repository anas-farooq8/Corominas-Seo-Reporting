import { NextResponse } from "next/server"
import { hasRefreshToken } from "@/lib/gmb/api"

/**
 * Check if GMB refresh token exists
 * GET /api/gmb/auth-status
 */
export async function GET() {
  console.log("[API] GET /api/gmb/auth-status")

  try {
    const hasToken = await hasRefreshToken()

    return NextResponse.json({ 
      authenticated: hasToken 
    })
  } catch (error) {
    console.error("[API] Error checking auth status:", error)
    return NextResponse.json(
      { error: "Failed to check authentication status" },
      { status: 500 }
    )
  }
}
