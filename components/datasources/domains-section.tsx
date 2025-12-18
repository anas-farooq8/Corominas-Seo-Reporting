"use client"

import { useState, useEffect } from "react"
import { AvailableDomainsSection } from "./available-domains-section"
import { AttachedDomainsSection } from "./attached-domains-section"
import type { DatasourceWithDomains } from "@/lib/supabase/types"
import { BarChart3, Globe, Clock, DollarSign } from "lucide-react"

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
      <div className="space-y-2">
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
        <div className="text-xs sm:text-sm text-muted-foreground">
          No Google Analytics property attached.
        </div>
      )
    }

    const property = properties[0]
    return (
      <div className="space-y-1.5">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">Google Analytics Property</h3>
        <div className="group relative flex flex-col sm:flex-row items-start gap-2 sm:gap-3 p-3 sm:p-3.5 border rounded-lg bg-gradient-to-br from-background to-muted/30 hover:shadow-sm hover:border-primary/20 transition-all duration-200">
          <div className="relative p-1.5 rounded bg-primary/10 group-hover:bg-primary/15 transition-colors flex-shrink-0">
            <BarChart3 className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <h4 className="font-semibold text-sm sm:text-base truncate mb-1">{property.display_name}</h4>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{property.time_zone}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <span>{property.currency_code}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Handle Semrush datasources
  if (datasource.type === "semrush") {
    const domains = datasource.semrush_domains || []
    
    if (domains.length === 0) {
      return (
        <div className="text-xs sm:text-sm text-muted-foreground">
          No Semrush domain attached.
        </div>
      )
    }

    const domain = domains[0]
    return (
      <div className="space-y-0">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">Semrush Domain</h3>
        <div className="group relative flex flex-col sm:flex-row items-start gap-2 sm:gap-3 p-3 sm:p-3.5 border rounded-lg bg-gradient-to-br from-background to-muted/30 hover:shadow-sm hover:border-primary/20 transition-all duration-200">
          <div className="relative p-1.5 rounded bg-primary/10 group-hover:bg-primary/15 transition-colors flex-shrink-0">
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain.domain}&sz=64`}
              alt={`${domain.domain} favicon`}
              className="h-7 w-7 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <Globe className="h-7 w-7 text-primary hidden" />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <h4 className="font-semibold text-sm sm:text-base truncate mb-1">{domain.domain}</h4>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
              <a 
                href={`https://${domain.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Globe className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Visit website</span>
              </a>
            </div>
          </div>
        </div>
        <p className="text-[11px] sm:text-xs text-muted-foreground">
          To change the domain, delete this data source and create a new one.
        </p>
      </div>
    )
  }

  // Other datasource types
  return (
    <div className="text-xs sm:text-sm text-muted-foreground">
      Data management coming soon for this data source type.
    </div>
  )
}
