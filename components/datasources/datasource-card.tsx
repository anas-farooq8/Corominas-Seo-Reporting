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
  const typeLabel = datasource.type.charAt(0).toUpperCase() + datasource.type.slice(1)
  const hasDomains = (datasource.domain_count || 0) > 0

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{typeLabel}</CardTitle>
            <CardDescription className="mt-1">
              {datasource.type === "mangools" && "Track domain rankings and keywords"}
              {datasource.type === "semrush" && "SEO analytics and competitive research"}
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
