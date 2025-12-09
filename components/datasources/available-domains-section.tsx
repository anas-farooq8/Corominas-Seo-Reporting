"use client"

import { Globe } from "lucide-react"

interface AvailabledomainsSectionProps {
  datasourceId: string
  onDomainAttached?: () => void
}

export function AvailableDomainsSection({ datasourceId, onDomainAttached }: AvailabledomainsSectionProps) {
  return (
    <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
      <Globe className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
      <p className="text-sm font-medium text-muted-foreground">No domain attached yet</p>
      <p className="text-xs text-muted-foreground mt-1">
        Domain should have been attached during datasource creation
      </p>
    </div>
  )
}
