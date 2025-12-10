"use client"

import type { MangoolsDomain } from "@/lib/supabase/types"
import { Globe, Key, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface AttachedDomainsSectionProps {
  domains: MangoolsDomain[]
  datasourceId?: string
}

export function AttachedDomainsSection({ domains, datasourceId }: AttachedDomainsSectionProps) {
  const router = useRouter()
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
            <div className="relative p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain.domain}&sz=64`}
                alt={`${domain.domain} favicon`}
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Globe className="h-5 w-5 text-primary hidden" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base truncate mb-2">{domain.domain}</h4>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  <span className="font-medium">Tracking ID: {domain.tracking_id}</span>
                </div>
              </div>
            </div>
            {datasourceId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/mangools/${datasourceId}`)}
                className="ml-auto"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Dashboard
              </Button>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        To change the domain, delete this data source and create a new one.
      </p>
    </div>
  )
}
