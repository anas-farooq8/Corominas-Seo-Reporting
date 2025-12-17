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
    <div className="flex-1 space-y-5 sm:space-y-6 p-4 sm:p-6 md:p-8">
      <div className="space-y-3 sm:space-y-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/clients")} className="h-9 sm:h-10 text-sm sm:text-[15px] -ml-2 touch-manipulation">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>

        {loading ? (
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Loading...</h1>
            <p className="text-sm sm:text-[15px] text-muted-foreground mt-1">Please wait</p>
          </div>
        ) : error || !client ? (
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Client Not Found</h1>
            <p className="text-sm sm:text-[15px] text-muted-foreground mt-1">Unable to load client details</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{client.name}</h1>
              <p className="text-sm sm:text-[15px] text-muted-foreground mt-1 leading-relaxed">{client.email}</p>
              {client.notes && (
                <p className="text-sm sm:text-[15px] text-muted-foreground mt-2 max-w-2xl leading-relaxed">{client.notes}</p>
              )}
            </div>
            <div className="w-full sm:w-auto">
              <CreateProjectDialog clientId={client.id} onProjectAdded={handleProjectAdded} />
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">Projects</CardTitle>
          <CardDescription className="text-sm">
            {loading ? "Loading projects..." : error || !client ? "Unable to load projects" : `Manage projects for ${client.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
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

