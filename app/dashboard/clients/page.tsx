"use client"

import { useState, useEffect } from "react"
import type { ClientWithProjects } from "@/lib/supabase/types"
import { CreateClientDialog } from "@/components/clients/create-client-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientSearch } from "@/components/clients/client-search"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"

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
    <div className="flex-1 space-y-2 sm:space-y-2.5 p-3 sm:p-4 md:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
            Manage clients, their projects, and SEO data sources
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <CreateClientDialog onClientAdded={handleClientAdded} />
        </div>
      </div>

      <Card>
        <CardHeader className="px-3 sm:px-4 pt-3 pb-2">
          <CardTitle className="text-base sm:text-lg">All Clients</CardTitle>
          <CardDescription className="text-xs sm:text-sm">View and manage all clients</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pt-0 pb-3 sm:pb-4">
          {loading ? (
            <LoadingSpinner message="Loading clients..." variant="card" />
          ) : error ? (
            <ErrorDisplay 
              title="Failed to Load Clients" 
              message={error}
              variant="card"
            />
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

