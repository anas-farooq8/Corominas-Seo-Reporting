import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all datasources for this customer
    const { data: datasources, error: datasourcesError } = await supabase
      .from("datasources")
      .select("id")
      .eq("customer_id", id)
      .eq("is_active", true)

    if (datasourcesError) {
      throw new Error(datasourcesError.message)
    }

    if (!datasources || datasources.length === 0) {
      return NextResponse.json([])
    }

    const datasourceIds = datasources.map((ds) => ds.id)

    // Get all attached domains for these datasources
    const { data: domains, error: domainsError } = await supabase
      .from("mangools_domains")
      .select("domain")
      .in("datasource_id", datasourceIds)
      .eq("is_active", true)

    if (domainsError) {
      throw new Error(domainsError.message)
    }

    return NextResponse.json(domains || [])
  } catch (error) {
    console.error("Attached domains API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch attached domains" },
      { status: 500 }
    )
  }
}

