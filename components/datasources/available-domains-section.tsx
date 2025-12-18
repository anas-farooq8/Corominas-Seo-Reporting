"use client"

import { Globe } from "lucide-react"

interface AvailabledomainsSectionProps {
  datasourceId: string
  onDomainAttached?: () => void
}

export function AvailableDomainsSection({ datasourceId, onDomainAttached }: AvailabledomainsSectionProps) {
  return (
    <div className="text-center py-4 border-2 border-dashed rounded-md bg-muted/20">
      <Globe className="h-6 w-6 mx-auto mb-1 text-muted-foreground opacity-50" />
      <p className="text-[11px] font-medium text-muted-foreground px-3">No domain attached yet</p>
      <p className="text-[10px] text-muted-foreground mt-0.5 px-3">
        Domain should have been attached during datasource creation
      </p>
    </div>
  )
}
