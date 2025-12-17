"use client"

import { Globe } from "lucide-react"

interface AvailabledomainsSectionProps {
  datasourceId: string
  onDomainAttached?: () => void
}

export function AvailableDomainsSection({ datasourceId, onDomainAttached }: AvailabledomainsSectionProps) {
  return (
    <div className="text-center py-6 sm:py-8 border-2 border-dashed rounded-lg bg-muted/20">
      <Globe className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-muted-foreground opacity-50" />
      <p className="text-xs sm:text-sm font-medium text-muted-foreground px-4">No domain attached yet</p>
      <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 px-4">
        Domain should have been attached during datasource creation
      </p>
    </div>
  )
}
