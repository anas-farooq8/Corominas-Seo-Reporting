"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import type { ClientWithProjects, ProjectWithDatasources } from "@/lib/supabase/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { ProjectsList } from "@/components/projects/projects-list"
import { Loader2, ArrowLeft } from "lucide-react"

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [client, setClient] = useState<ClientWithProjects | null>(null)
  const [projects, setProjects] = useState<ProjectWithDatasources[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClientData()
  }, [id])

  async function fetchClientData() {
    try {
      const response = await fetch(`/api/clients/${id}`)
      if (!response.ok) throw new Error("Failed to fetch client")
      const data = await response.json()
      setClient(data)
      setProjects(data.projects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch client")
    } finally {
      setLoading(false)
    }
  }

  function handleProjectAdded(project: ProjectWithDatasources) {
    setProjects((prev) => [{ ...project, datasource_count: 0 }, ...prev])
  }

  function handleProjectUpdated(project: ProjectWithDatasources) {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)))
  }

  function handleProjectDeleted(projectId: string) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error || "Client not found"}</p>
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/clients")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{client.name}</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">{client.email}</p>
            {client.notes && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{client.notes}</p>
            )}
          </div>
          <CreateProjectDialog clientId={client.id} onProjectAdded={handleProjectAdded} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>
            Manage projects for {client.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectsList
            projects={projects}
            onProjectUpdated={handleProjectUpdated}
            onProjectDeleted={handleProjectDeleted}
          />
        </CardContent>
      </Card>
    </div>
  )
}

