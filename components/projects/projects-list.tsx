"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EditProjectDialog } from "./edit-project-dialog"
import { DeleteProjectButton } from "./delete-project-button"
import type { ProjectWithDatasources } from "@/lib/supabase/types"
import { FolderOpen } from "lucide-react"

interface ProjectsListProps {
  projects: ProjectWithDatasources[]
  onProjectUpdated?: (project: ProjectWithDatasources) => void
  onProjectDeleted?: (projectId: string) => void
}

export function ProjectsList({ projects, onProjectUpdated, onProjectDeleted }: ProjectsListProps) {
  const router = useRouter()

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-muted-foreground px-4">
        <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
        <p className="text-sm sm:text-base">No projects yet. Create your first project to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
        >
          <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg leading-tight">{project.name}</CardTitle>
                <CardDescription className="mt-1.5 text-sm line-clamp-2">
                  {project.details || "No details provided"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <EditProjectDialog project={project} onProjectUpdated={onProjectUpdated} />
                <DeleteProjectButton
                  projectId={project.id}
                  projectName={project.name}
                  onProjectDeleted={() => onProjectDeleted?.(project.id)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Data Sources</span>
              <Badge variant="secondary" className="text-xs sm:text-sm">{project.datasource_count || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

