"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteDatasourceButton } from "./delete-datasource-button"
import { DomainsSection } from "./domains-section"
import type { getDataSourcesWithRespectiveData } from "@/lib/supabase/types"

interface DatasourceCardProps {
  datasource: getDataSourcesWithRespectiveData
  onDatasourceDeleted?: () => void
  onDomainAttached?: () => void
}

export function DatasourceCard({
  datasource,
  onDatasourceDeleted,
  onDomainAttached,
}: DatasourceCardProps) {
  const typeLabels: Record<string, string> = {
    mangools: "Mangools",
    semrush: "Semrush",
    google_analytics: "Google Analytics"
  }
  
  const typeDescriptions: Record<string, string> = {
    mangools: "Track domain rankings and keywords",
    semrush: "SEO analytics and competitive research",
    google_analytics: "Website traffic and user behavior analytics"
  }
  
  const typeLabel = typeLabels[datasource.type] || datasource.type
  const hasDomains = (datasource.domain_count || 0) > 0

  return (
    <Card>
      <CardHeader className="pb-3 px-4 pt-1.5 sm:px-5 sm:pt-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg leading-tight">{typeLabel}</CardTitle>
            <CardDescription className="mt-1 text-sm">
              {typeDescriptions[datasource.type] || "Data analytics"}
            </CardDescription>
          </div>
          <div className="flex-shrink-0">
            <DeleteDatasourceButton
              datasourceId={datasource.id}
              datasourceType={typeLabel}
              onDatasourceDeleted={onDatasourceDeleted}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4 sm:px-5 sm:pb-5">
        <DomainsSection
          datasource={datasource}
          hasDomains={hasDomains}
          onDomainAttached={onDomainAttached}
        />
      </CardContent>
    </Card>
  )
}
