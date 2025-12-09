import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth"

// This endpoint is not used directly - projects are always fetched through clients
// Keeping it for future extensibility
export async function GET() {
  try {
    await requireAuth()
    return NextResponse.json({ message: "Use /api/clients/[id] to get projects" })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }
}

