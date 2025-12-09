"use client"

import type { Datasource } from "@/lib/supabase/types"
import { DatasourceCard } from "./datasource-card"

interface DatasourcesListProps {
  datasources: Datasource[]
  customerId: string
}

export function DatasourcesList({ datasources, customerId }: DatasourcesListProps) {
  if (datasources.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No data sources configured yet. Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {datasources.map((datasource) => (
        <DatasourceCard key={datasource.id} datasource={datasource} customerId={customerId} />
      ))}
    </div>
  )
}
