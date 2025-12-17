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
      <div className="text-center py-8 sm:py-12 text-sm sm:text-base text-muted-foreground px-4">
        {isSearching ? "No clients match your criteria." : "No clients found. Create your first client to get started."}
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-sm sm:text-[15px]">Name</TableHead>
              <TableHead className="hidden sm:table-cell text-sm sm:text-[15px]">Email</TableHead>
              <TableHead className="hidden lg:table-cell text-sm sm:text-[15px]">Notes</TableHead>
              <TableHead className="text-center text-sm sm:text-[15px] whitespace-nowrap">Projects</TableHead>
              <TableHead className="text-right text-sm sm:text-[15px] w-[100px] sm:w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
              >
                <TableCell className="font-medium text-sm sm:text-[15px] min-w-[120px]">
                  <div className="flex flex-col">
                    <span>{client.name}</span>
                    <span className="sm:hidden text-xs text-muted-foreground mt-0.5">{client.email}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm min-w-[180px]">{client.email}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm max-w-[200px] xl:max-w-xs truncate">
                  {client.notes || <span className="text-muted-foreground">N/A</span>}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-xs sm:text-sm">{client.project_count || 0}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5 sm:gap-1" onClick={(e) => e.stopPropagation()}>
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
    </div>
  )
}

