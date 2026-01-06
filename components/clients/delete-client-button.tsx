"use client"

import { deleteClient } from "@/lib/actions/clients"
import { DeleteButton } from "@/components/ui/delete-button"

interface DeleteClientButtonProps {
  clientId: string
  clientName: string
  onClientDeleted?: () => void
}

export function DeleteClientButton({ clientId, clientName, onClientDeleted }: DeleteClientButtonProps) {
  return (
    <DeleteButton
      itemId={clientId}
      itemName={clientName}
      entityType="Client"
      warningMessage="This will permanently delete the client and all associated projects, datasources, and domains. This action cannot be undone."
      onDelete={deleteClient}
      onDeleted={onClientDeleted}
    />
  )
}

