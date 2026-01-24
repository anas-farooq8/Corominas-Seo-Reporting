import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * GET /api/reports/project/[id]
 * Special endpoint for shareable reports to fetch project data
 * Uses service role to bypass RLS (safe because it only returns minimal data)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()
    
    // Fetch project with datasources
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        id,
        name,
        datasources (
          id,
          type
        )
      `)
      .eq("id", id)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project for shareable report:", error)
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    )
  }
}
