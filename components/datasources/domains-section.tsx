"use client"

import { useState, useEffect } from "react"
import { AvailableDomainsSection } from "./available-domains-section"
import { AttachedDomainsSection } from "./attached-domains-section"
import type { DatasourceWithDomains } from "@/lib/supabase/types"

interface DomainsSectionProps {
  datasource: DatasourceWithDomains
  hasDomains: boolean
  onDomainAttached?: () => void
}

export function DomainsSection({
  datasource,
  hasDomains,
  onDomainAttached,
}: DomainsSectionProps) {
  // Handle Mangools datasources
  if (datasource.type === "mangools") {
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
            datasourceId={datasource.id}
          />
        )}
      </div>
    )
  }

  // Handle Google Analytics datasources
  if (datasource.type === "google_analytics") {
    const properties = datasource.google_analytics_properties || []
    
    if (properties.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          No Google Analytics property attached.
        </div>
      )
    }

    const property = properties[0]
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">Google Analytics Property</div>
        <div className="border rounded-lg p-4 space-y-2">
          <div className="font-medium">{property.display_name}</div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>🕐 {property.time_zone}</span>
            <span>💰 {property.currency_code}</span>
          </div>
        </div>
      </div>
    )
  }

  // Other datasource types
  return (
    <div className="text-sm text-muted-foreground">
      Data management coming soon for this data source type.
    </div>
  )
}
