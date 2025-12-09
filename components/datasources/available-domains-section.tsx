"use client"

import { useState, useEffect } from "react"
import type { DatasourceDomain, MangoolsDomain } from "@/lib/supabase/types"
import { fetchMangoolsDomains } from "@/lib/mangools/api"
import { AttachDomainButton } from "./attach-domain-button"
import { AlertCircle, Loader2 } from "lucide-react"

interface AvailableDomainsSectionProps {
  datasourceId: string
  attachedDomains: DatasourceDomain[]
}

export function AvailableDomainsSection({ datasourceId, attachedDomains }: AvailableDomainsSectionProps) {
  const [domains, setDomains] = useState<MangoolsDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDomains()
  }, [])

  async function loadDomains() {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchMangoolsDomains()
      setDomains(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch domains")
    } finally {
      setLoading(false)
    }
  }

  const attachedDomainNames = new Set(attachedDomains.map((d) => d.domain))
  const availableDomains = domains.filter((d) => !attachedDomainNames.has(d.domain))

  return (
    <div>
      <h3 className="font-semibold text-foreground mb-3">Available Domains</h3>
      {error && (
        <div className="flex gap-2 text-sm text-destructive mb-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading domains...</span>
        </div>
      ) : availableDomains.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          {domains.length === 0 ? "No domains available" : "All domains are already attached"}
        </p>
      ) : (
        <div className="grid gap-2">
          {availableDomains.map((domain) => (
            <div key={domain.domain} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border border-border rounded-md">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground break-words">{domain.domain}</p>
                <p className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                  <span>Rank: {domain.rank ?? "N/A"}</span>
                  <span>Traffic: {domain.traffic ?? "N/A"}</span>
                  <span>Difficulty: {domain.difficulty ?? "N/A"}</span>
                </p>
              </div>
              <div className="self-end sm:self-auto">
                <AttachDomainButton datasourceId={datasourceId} domain={domain.domain} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
