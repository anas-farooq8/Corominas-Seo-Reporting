"use client"

import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EditClientDialog } from "./edit-client-dialog"
import { DeleteClientButton } from "./delete-client-button"
import type { ClientWithProjects } from "@/lib/supabase/types"

interface ClientsTableProps {
  clients: ClientWithProjects[]
  onClientUpdated?: (client: ClientWithProjects) => void
  onClientDeleted?: (clientId: string) => void
  isSearching?: boolean
}

export function ClientsTable({ clients, onClientUpdated, onClientDeleted, isSearching = false }: ClientsTableProps) {
  const router = useRouter()

  if (clients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isSearching ? "No clients match your criteria." : "No clients found. Create your first client to get started."}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell">Notes</TableHead>
            <TableHead className="text-center">Projects</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell className="hidden md:table-cell">{client.email}</TableCell>
              <TableCell className="hidden lg:table-cell max-w-xs truncate">
                {client.notes || <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{client.project_count || 0}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <EditClientDialog client={client} onClientUpdated={onClientUpdated} />
                  <DeleteClientButton
                    clientId={client.id}
                    clientName={client.name}
                    onClientDeleted={() => onClientDeleted?.(client.id)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

