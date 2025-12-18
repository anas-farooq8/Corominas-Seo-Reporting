"use client"

import type { MangoolsDomain } from "@/lib/supabase/types"
import { Globe, Key } from "lucide-react"

interface AttachedDomainsSectionProps {
  domains: MangoolsDomain[]
}

export function AttachedDomainsSection({ domains }: AttachedDomainsSectionProps) {
  if (domains.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-1.5">Attached Domain{domains.length > 1 ? 's' : ''}</h3>
      <div className="space-y-2">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="group relative flex flex-col sm:flex-row items-start gap-3 p-3 border rounded-lg bg-gradient-to-br from-background to-muted/30 hover:shadow-sm hover:border-primary/20 transition-all duration-200"
          >
            <div className="relative p-2 rounded bg-primary/10 group-hover:bg-primary/15 transition-colors flex-shrink-0">
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain.domain}&sz=64`}
                alt={`${domain.domain} favicon`}
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Globe className="h-6 w-6 text-primary hidden" />
            </div>
            <div className="flex-1 min-w-0 w-full">
              <h4 className="font-semibold text-sm sm:text-base truncate mb-1">{domain.domain}</h4>
              <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Key className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium truncate max-w-[180px] sm:max-w-none">Tracking ID: {domain.tracking_id}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        To change the domain, delete this data source and create a new one.
      </p>
    </div>
  )
}
