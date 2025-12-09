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
              className="flex items-center justify-between p-3 bg-accent/50 border border-border rounded-md"
            >
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{domain.domain}</p>
                <p className="text-xs text-muted-foreground">
                  Rank: {domain.rank ?? "N/A"} | Traffic: {domain.traffic ?? "N/A"} | Difficulty:{" "}
                  {domain.difficulty ?? "N/A"}
                </p>
              </div>
              <DetachDomainButton domainId={domain.id} datasourceId={datasourceId} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
