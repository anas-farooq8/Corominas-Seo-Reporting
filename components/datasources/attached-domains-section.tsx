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
    <div className="space-y-3">
      <h3 className="text-xs sm:text-sm font-semibold text-foreground">Attached Domain{domains.length > 1 ? 's' : ''}</h3>
      <div className="space-y-3">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="group relative flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 border-2 rounded-xl bg-gradient-to-br from-background to-muted/30 hover:shadow-md hover:border-primary/20 transition-all duration-200"
          >
            <div className="relative p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors flex-shrink-0">
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain.domain}&sz=64`}
                alt={`${domain.domain} favicon`}
                className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary hidden" />
            </div>
            <div className="flex-1 min-w-0 w-full">
              <h4 className="font-semibold text-sm sm:text-base truncate mb-1.5 sm:mb-2">{domain.domain}</h4>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Key className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  <span className="font-medium truncate max-w-[200px] sm:max-w-none">Tracking ID: {domain.tracking_id}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] sm:text-xs text-muted-foreground mt-2">
        To change the domain, delete this data source and create a new one.
      </p>
    </div>
  )
}
