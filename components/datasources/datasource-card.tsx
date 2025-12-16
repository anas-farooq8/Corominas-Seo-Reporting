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
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{typeLabel}</CardTitle>
            <CardDescription className="mt-1">
              {typeDescriptions[datasource.type] || "Data analytics"}
            </CardDescription>
          </div>
          <DeleteDatasourceButton
            datasourceId={datasource.id}
            datasourceType={typeLabel}
            onDatasourceDeleted={onDatasourceDeleted}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <DomainsSection
          datasource={datasource}
          hasDomains={hasDomains}
          onDomainAttached={onDomainAttached}
        />
      </CardContent>
    </Card>
  )
}
