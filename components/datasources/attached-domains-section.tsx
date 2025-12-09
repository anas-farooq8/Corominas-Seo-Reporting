"use client"

import { Badge } from "@/components/ui/badge"
import type { MangoolsDomain } from "@/lib/supabase/types"
import { Globe, MapPin, Key } from "lucide-react"

interface AttachedDomainsSectionProps {
  domains: MangoolsDomain[]
  onDomainDetached?: () => void
}

export function AttachedDomainsSection({ domains }: AttachedDomainsSectionProps) {
  if (domains.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Attached Domain{domains.length > 1 ? 's' : ''}</h3>
      <div className="space-y-3">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="group relative flex items-center gap-4 p-4 border-2 rounded-xl bg-gradient-to-br from-background to-muted/30 hover:shadow-md hover:border-primary/20 transition-all duration-200"
          >
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-base truncate">{domain.domain}</h4>
                {domain.is_active && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {domain.location_label && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{domain.location_label}</span>
                  </div>
                )}
                {domain.keywords_count > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" />
                    <span className="font-medium">{domain.keywords_count} keywords</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        To change the domain, delete this data source and create a new one.
      </p>
    </div>
  )
}
