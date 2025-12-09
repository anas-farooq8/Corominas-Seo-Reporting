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
      <div className="text-center py-12 text-muted-foreground">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No projects yet. Create your first project to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription className="mt-1 line-clamp-2">
                  {project.details || "No details provided"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                <EditProjectDialog project={project} onProjectUpdated={onProjectUpdated} />
                <DeleteProjectButton
                  projectId={project.id}
                  projectName={project.name}
                  onProjectDeleted={() => onProjectDeleted?.(project.id)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Data Sources</span>
              <Badge variant="secondary">{project.datasource_count || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

