import { NextResponse } from "next/server"
import { getDomainsByDatasourceId } from "@/lib/actions/datasources"
import { requireAuth } from "@/lib/api/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ datasourceId: string }> }
) {
  try {
    await requireAuth()
    const { datasourceId } = await params
    const domains = await getDomainsByDatasourceId(datasourceId)
    return NextResponse.json(domains)
  } catch (error) {
    console.error("Error fetching domains:", error)
    return NextResponse.json(
      { error: "Failed to fetch domains" },
      { status: 500 }
    )
  }
}
