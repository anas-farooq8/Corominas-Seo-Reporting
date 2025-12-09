import { NextResponse } from "next/server"
import { fetchMangoolsDomains } from "@/lib/mangools/api"
import { authenticateRequest, unauthorizedResponse, errorResponse } from "@/lib/api/auth"

export async function GET() {
  try {
    const auth = await authenticateRequest()
    if (!auth) return unauthorizedResponse()

    const domains = await fetchMangoolsDomains()

    return NextResponse.json(domains)
  } catch (error) {
    return errorResponse(error, "Failed to fetch Mangools domains")
  }
}

