"use client"

import { deleteProject } from "@/lib/actions/projects"
import { DeleteButton } from "@/components/ui/delete-button"

interface DeleteProjectButtonProps {
  projectId: string
  projectName: string
  onProjectDeleted?: () => void
}

export function DeleteProjectButton({ projectId, projectName, onProjectDeleted }: DeleteProjectButtonProps) {
  return (
    <DeleteButton
      itemId={projectId}
      itemName={projectName}
      entityType="Project"
      warningMessage="This will permanently delete the project and all associated datasources and domains. This action cannot be undone."
      onDelete={deleteProject}
      onDeleted={onProjectDeleted}
    />
  )
}

