import { NextResponse } from "next/server"
import { signInWithPassword } from "@/lib/gmb/api"

/**
 * Initial authentication endpoint
 * This should only be called once during setup to get and store the refresh token
 * POST /api/gmb/auth
 */
export async function POST() {
  console.log("[API] POST /api/gmb/auth")

  try {
    const result = await signInWithPassword()

    return NextResponse.json({
      success: true,
      message: "Successfully authenticated with Grid My Business",
      email: result.email,
      displayName: result.displayName
    })
  } catch (error) {
    console.error("[API] GMB authentication error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
