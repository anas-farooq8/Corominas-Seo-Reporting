"use client"

import { deleteDatasource } from "@/lib/actions/datasources"
import { DeleteButton } from "@/components/ui/delete-button"

interface DeleteDatasourceButtonProps {
  datasourceId: string
  datasourceType: string
  onDatasourceDeleted?: () => void
}

export function DeleteDatasourceButton({ 
  datasourceId, 
  datasourceType, 
  onDatasourceDeleted 
}: DeleteDatasourceButtonProps) {
  return (
    <DeleteButton
      itemId={datasourceId}
      itemName={datasourceType}
      entityType="Data Source"
      warningMessage={`This will permanently delete the ${datasourceType} data source and all associated domains. This action cannot be undone.`}
      onDelete={deleteDatasource}
      onDeleted={onDatasourceDeleted}
    />
  )
}
