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
      <div className="text-center py-6 sm:py-8 text-muted-foreground px-3">
        <FolderOpen className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 opacity-50" />
        <p className="text-xs sm:text-sm">No projects yet. Create your first project to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
        >
          <CardHeader className="pb-2 px-3 pt-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm leading-tight">{project.name}</CardTitle>
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
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Data Sources</span>
              <Badge variant="secondary" className="text-[11px]">{project.datasource_count || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

