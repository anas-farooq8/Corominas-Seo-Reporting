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
import { ArrowLeft, BarChart3 } from "lucide-react"

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
    <div className="flex-1 space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-5">
      <div className="space-y-2 sm:space-y-2.5">
        <Button
          variant="ghost"
          onClick={() => !loading && !error && project ? router.push(`/dashboard/clients/${project.client_id}`) : router.push("/dashboard/clients")}
          className="h-8 sm:h-9 text-xs sm:text-sm -ml-2 touch-manipulation"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {loading || error || !project ? "Back to Clients" : "Back to Client Projects"}
        </Button>

        {loading ? (
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Loading...</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Please wait</p>
          </div>
        ) : error || !project ? (
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Project Not Found</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Unable to load project details</p>
          </div>
        ) : (
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{project.name}</h1>
            {project.details && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">{project.details}</p>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-5 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5 sm:gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base sm:text-lg">Data Sources</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {loading ? "Loading data sources..." : error || !project ? "Unable to load data sources" : `Manage data sources for ${project.name}`}
              </CardDescription>
            </div>
            {!loading && !error && project && (
              <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                {datasources.length > 0 && (
                  <Button
                    variant="default"
                    onClick={() => router.push(`/dashboard/projects/${project.id}/unified-dashboard`)}
                    className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm touch-manipulation"
                  >
                    <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                    View Dashboard
                  </Button>
                )}
                <CreateDatasourceDialog
                  projectId={project.id}
                  existingTypes={datasources.map((ds) => ds.type)}
                  onDatasourceAdded={fetchProjectData}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
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

