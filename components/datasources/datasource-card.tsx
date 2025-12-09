"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeleteDatasourceButton } from "./delete-datasource-button"
import { DomainsSection } from "./domains-section"
import type { DatasourceWithDomains } from "@/lib/supabase/types"

interface DatasourceCardProps {
  datasource: DatasourceWithDomains
  onDatasourceDeleted?: () => void
  onDomainAttached?: () => void
  onDomainDetached?: () => void
}

export function DatasourceCard({
  datasource,
  onDatasourceDeleted,
  onDomainAttached,
  onDomainDetached,
}: DatasourceCardProps) {
  const typeLabel = datasource.type.charAt(0).toUpperCase() + datasource.type.slice(1)
  const hasDomains = (datasource.domain_count || 0) > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{typeLabel}</CardTitle>
              <Badge variant={datasource.is_active ? "default" : "secondary"}>
                {datasource.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
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
      <CardContent>
        <DomainsSection
          datasource={datasource}
          hasDomains={hasDomains}
          onDomainAttached={onDomainAttached}
          onDomainDetached={onDomainDetached}
        />
      </CardContent>
    </Card>
  )
}
