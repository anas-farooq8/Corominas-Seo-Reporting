"use client"

import { useState, useEffect } from "react"
import type { ClientWithProjects } from "@/lib/supabase/types"
import { CreateClientDialog } from "@/components/clients/create-client-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientSearch } from "@/components/clients/client-search"
import { Loader2 } from "lucide-react"

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithProjects[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error("Failed to fetch clients")
      const data = await response.json()
      setClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch clients")
    } finally {
      setLoading(false)
    }
  }

  function handleClientAdded(client: ClientWithProjects) {
    setClients((prev) => [{ ...client, project_count: 0 }, ...prev])
  }

  function handleClientUpdated(client: ClientWithProjects) {
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)))
  }

  function handleClientDeleted(clientId: string) {
    setClients((prev) => prev.filter((c) => c.id !== clientId))
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Manage clients, their projects, and SEO data sources
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <CreateClientDialog onClientAdded={handleClientAdded} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>View and manage all clients</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading clients...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-sm text-destructive">{error}</div>
          ) : (
            <ClientSearch
              clients={clients}
              onClientUpdated={handleClientUpdated}
              onClientDeleted={handleClientDeleted}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

