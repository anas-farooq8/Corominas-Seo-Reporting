"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditProjectDialog } from "./edit-project-dialog"
import { DeleteProjectButton } from "./delete-project-button"
import type { ProjectWithDatasources } from "@/lib/supabase/types"
import { FolderOpen, BarChart3, Loader2 } from "lucide-react"

interface ProjectsListProps {
  projects: ProjectWithDatasources[]
  onProjectUpdated?: (project: ProjectWithDatasources) => void
  onProjectDeleted?: (projectId: string) => void
}

export function ProjectsList({ projects, onProjectUpdated, onProjectDeleted }: ProjectsListProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [navigatingToId, setNavigatingToId] = useState<string | null>(null)
  const [navigatingToDashboard, setNavigatingToDashboard] = useState<string | null>(null)

  const handleCardClick = (projectId: string) => {
    if (navigatingToId || navigatingToDashboard) return
    
    setNavigatingToId(projectId)
    startTransition(() => {
      router.push(`/dashboard/projects/${projectId}`)
    })
  }

  const handleDashboardClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    if (navigatingToId || navigatingToDashboard) return
    
    setNavigatingToDashboard(projectId)
    startTransition(() => {
      router.push(`/dashboard/projects/${projectId}/unified-dashboard`)
    })
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 text-muted-foreground px-3">
        <FolderOpen className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 opacity-50" />
        <p className="text-xs sm:text-sm">No projects yet. Create your first project to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const isNavigatingToProject = navigatingToId === project.id
        const isNavigatingToDash = navigatingToDashboard === project.id
        const isAnyNavigation = isNavigatingToProject || isNavigatingToDash
        
        return (
          <Card
            key={project.id}
            className={`cursor-pointer hover:shadow-md transition-all ${
              isAnyNavigation ? "opacity-50 pointer-events-none" : ""
            }`}
            onClick={() => handleCardClick(project.id)}
          >
            <CardHeader className="pb-2 px-3 pt-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm leading-tight">{project.name}</CardTitle>
                    {isNavigatingToProject && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground flex-shrink-0" />}
                  </div>
                  <CardDescription className="mt-0.5 text-xs line-clamp-2">
                    {project.details || "No details provided"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <EditProjectDialog project={project} onProjectUpdated={onProjectUpdated} />
                  <DeleteProjectButton
                    projectId={project.id}
                    projectName={project.name}
                    onProjectDeleted={() => onProjectDeleted?.(project.id)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">Data Sources</span>
                <Badge variant="secondary" className="text-[11px]">{project.datasource_count || 0}</Badge>
              </div>
              {(project.datasource_count || 0) > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  disabled={isAnyNavigation}
                  onClick={(e) => handleDashboardClick(e, project.id)}
                >
                  {isNavigatingToDash ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-1.5 h-3 w-3" />
                      View Dashboard
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

