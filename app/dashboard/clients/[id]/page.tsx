"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import type { ClientWithProjects, ProjectWithDatasources } from "@/lib/supabase/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { ProjectsList } from "@/components/projects/projects-list"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { ArrowLeft } from "lucide-react"

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

  return (
    <div className="flex-1 space-y-2 sm:space-y-2.5 p-3 sm:p-4 md:p-5">
      <div className="space-y-2 sm:space-y-2.5">
        <Button variant="ghost" onClick={() => router.push("/dashboard/clients")} className="h-8 sm:h-9 text-xs sm:text-sm -ml-2 touch-manipulation">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Clients
        </Button>

        {loading ? (
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Loading...</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Please wait</p>
          </div>
        ) : error || !client ? (
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Client Not Found</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Unable to load client details</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{client.name}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">{client.email}</p>
              {client.notes && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">{client.notes}</p>
              )}
            </div>
            <div className="w-full sm:w-auto">
              <CreateProjectDialog clientId={client.id} onProjectAdded={handleProjectAdded} />
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="px-3 sm:px-4 pt-3 pb-2">
          <CardTitle className="text-base sm:text-lg">Projects</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {loading ? "Loading projects..." : error || !client ? "Unable to load projects" : `Manage projects for ${client.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pt-0 pb-3 sm:pb-4">
          {loading ? (
            <LoadingSpinner message="Loading client details..." variant="card" />
          ) : error || !client ? (
            <ErrorDisplay 
              title="Failed to Load Client" 
              message={error || "The client you're looking for doesn't exist or you don't have access to it."}
              variant="card"
              action={{
                label: "Back to Clients",
                onClick: () => router.push("/dashboard/clients"),
                icon: <ArrowLeft className="mr-2 h-4 w-4" />
              }}
            />
          ) : (
            <ProjectsList
              projects={projects}
              onProjectUpdated={handleProjectUpdated}
              onProjectDeleted={handleProjectDeleted}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

