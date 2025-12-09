"use client"

import type { DatasourceDomain } from "@/lib/supabase/types"
import { DetachDomainButton } from "./detach-domain-button"

interface AttachedDomainsSectionProps {
  datasourceId: string
  attachedDomains: DatasourceDomain[]
}

export function AttachedDomainsSection({ datasourceId, attachedDomains }: AttachedDomainsSectionProps) {
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-3">Attached Domains ({attachedDomains.length})</h3>
      {attachedDomains.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No domains attached yet</p>
      ) : (
        <div className="grid gap-2">
          {attachedDomains.map((domain) => (
            <div
              key={domain.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-accent/50 border border-border rounded-md"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground break-words">{domain.domain}</p>
                <p className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                  <span>Rank: {domain.rank ?? "N/A"}</span>
                  <span>Traffic: {domain.traffic ?? "N/A"}</span>
                  <span>Difficulty: {domain.difficulty ?? "N/A"}</span>
                </p>
              </div>
              <div className="self-end sm:self-auto">
                <DetachDomainButton domainId={domain.id} datasourceId={datasourceId} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
