"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import type { ProjectWithDatasources, DatasourceWithDomains } from "@/lib/supabase/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatasourcesList } from "@/components/datasources/datasources-list"
import { Loader2, ArrowLeft } from "lucide-react"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [project, setProject] = useState<ProjectWithDatasources | null>(null)
  const [datasources, setDatasources] = useState<DatasourceWithDomains[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjectData()
  }, [id])

  async function fetchProjectData() {
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (!response.ok) throw new Error("Failed to fetch project")
      const data = await response.json()
      setProject(data)
      setDatasources(data.datasources || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch project")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error || "Project not found"}</p>
          <Button variant="outline" onClick={() => router.push("/dashboard/clients")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/clients/${project.client_id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Client Projects
        </Button>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.name}</h1>
          {project.details && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{project.details}</p>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DatasourcesList
            projectId={project.id}
            datasources={datasources}
            onDatasourcesChange={fetchProjectData}
          />
        </CardContent>
      </Card>
    </div>
  )
}

