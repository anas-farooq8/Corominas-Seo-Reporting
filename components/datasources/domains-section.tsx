"use client"

import { useState, useEffect } from "react"
import { AvailableDomainsSection } from "./available-domains-section"
import { AttachedDomainsSection } from "./attached-domains-section"
import type { DatasourceWithDomains } from "@/lib/supabase/types"

interface DomainsSectionProps {
  datasource: DatasourceWithDomains
  hasDomains: boolean
  onDomainAttached?: () => void
  onDomainDetached?: () => void
}

export function DomainsSection({
  datasource,
  hasDomains,
  onDomainAttached,
  onDomainDetached,
}: DomainsSectionProps) {
  // Only show domain attachment options for Mangools (Semrush coming soon)
  if (datasource.type !== "mangools") {
    return (
      <div className="text-sm text-muted-foreground">
        Domain management coming soon for this data source type.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Show available domains only if no domain is attached */}
      {!hasDomains && (
        <AvailableDomainsSection
          datasourceId={datasource.id}
          onDomainAttached={onDomainAttached}
        />
      )}

      {/* Show attached domains */}
      {hasDomains && datasource.mangools_domains && (
        <AttachedDomainsSection
          domains={datasource.mangools_domains}
          onDomainDetached={onDomainDetached}
        />
      )}
    </div>
  )
}
