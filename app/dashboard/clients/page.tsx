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
    <div className="flex-1 space-y-5 sm:space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-sm sm:text-[15px] text-muted-foreground mt-1 leading-relaxed">
            Manage clients, their projects, and SEO data sources
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <CreateClientDialog onClientAdded={handleClientAdded} />
        </div>
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">All Clients</CardTitle>
          <CardDescription className="text-sm">View and manage all clients</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
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

