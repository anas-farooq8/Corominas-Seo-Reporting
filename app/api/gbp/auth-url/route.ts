import { NextResponse } from "next/server"
import { generateAuthUrl } from "@/lib/google-business-profile/api"

/**
 * Generate OAuth2 authorization URL for GBP
 * GET /api/gbp/auth-url
 */
export async function GET() {
  console.log("[API] GET /api/gbp/auth-url")
  
  try {
    const authUrl = generateAuthUrl()
    
    console.log("[API] GBP authorization URL generated")
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("[API] Error generating auth URL:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate authorization URL" },
      { status: 500 }
    )
  }
}

