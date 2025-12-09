"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ClientsTable } from "./clients-table"
import { Search } from "lucide-react"
import type { ClientWithProjects } from "@/lib/supabase/types"

interface ClientSearchProps {
  clients: ClientWithProjects[]
  onClientUpdated?: (client: ClientWithProjects) => void
  onClientDeleted?: (clientId: string) => void
}

export function ClientSearch({ clients, onClientUpdated, onClientDeleted }: ClientSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredClients = clients.filter((client) => {
    const search = searchTerm.toLowerCase()
    return (
      client.name.toLowerCase().includes(search) ||
      client.email.toLowerCase().includes(search) ||
      (client.notes && client.notes.toLowerCase().includes(search))
    )
  })

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by name, email, or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <ClientsTable
        clients={filteredClients}
        onClientUpdated={onClientUpdated}
        onClientDeleted={onClientDeleted}
        isSearching={!!searchTerm}
      />
    </div>
  )
}

