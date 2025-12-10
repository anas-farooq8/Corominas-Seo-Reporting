import { NextResponse } from "next/server"
import { getClientsWithProjectCount } from "@/lib/actions/clients"
import { requireAuth } from "@/lib/api/auth"

export async function GET() {
  try {
    await requireAuth()
    const clients = await getClientsWithProjectCount()
    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}
