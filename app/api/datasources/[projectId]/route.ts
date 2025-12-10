import { NextResponse } from "next/server"
import { getDataSourcesWithRespectiveData } from "@/lib/actions/datasources"
import { requireAuth } from "@/lib/api/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireAuth()
    const { projectId } = await params
    const datasources = await getDataSourcesWithRespectiveData(projectId)
    return NextResponse.json(datasources)
  } catch (error) {
    console.error("Error fetching datasources:", error)
    return NextResponse.json(
      { error: "Failed to fetch datasources" },
      { status: 500 }
    )
  }
}

