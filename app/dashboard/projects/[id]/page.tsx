"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import type { ProjectWithDatasources, getDataSourcesWithRespectiveData } from "@/lib/supabase/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatasourcesList } from "@/components/datasources/datasources-list"
import { CreateDatasourceDialog } from "@/components/datasources/create-datasource-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { ArrowLeft } from "lucide-react"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [project, setProject] = useState<ProjectWithDatasources | null>(null)
  const [datasources, setDatasources] = useState<getDataSourcesWithRespectiveData[]>([])
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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => !loading && !error && project ? router.push(`/dashboard/clients/${project.client_id}`) : router.push("/dashboard/clients")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {loading || error || !project ? "Back to Clients" : "Back to Client Projects"}
        </Button>

        {loading ? (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Loading...</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Please wait</p>
          </div>
        ) : error || !project ? (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Project Not Found</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Unable to load project details</p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.name}</h1>
            {project.details && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{project.details}</p>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="space-y-1.5">
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>
              {loading ? "Loading data sources..." : error || !project ? "Unable to load data sources" : `Manage data sources for ${project.name}`}
            </CardDescription>
          </div>
          {!loading && !error && project && (
            <CreateDatasourceDialog
              projectId={project.id}
              existingTypes={datasources.map((ds) => ds.type)}
              onDatasourceAdded={fetchProjectData}
            />
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner message="Loading project and data sources..." variant="card" />
          ) : error || !project ? (
            <ErrorDisplay 
              title="Failed to Load Project" 
              message={error || "The project you're looking for doesn't exist or you don't have access to it."}
              variant="card"
              action={{
                label: "Back to Clients",
                onClick: () => router.push("/dashboard/clients"),
                icon: <ArrowLeft className="mr-2 h-4 w-4" />
              }}
            />
          ) : (
            <DatasourcesList
              datasources={datasources}
              onDatasourcesChange={fetchProjectData}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

