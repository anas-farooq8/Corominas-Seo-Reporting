"use client"

import { DatasourceCard } from "./datasource-card"
import type { getDataSourcesWithRespectiveData } from "@/lib/supabase/types"
import { Database } from "lucide-react"

interface DatasourcesListProps {
  datasources: getDataSourcesWithRespectiveData[]
  onDatasourcesChange?: () => void
}

export function DatasourcesList({ datasources, onDatasourcesChange }: DatasourcesListProps) {
  return (
    <div>
      {datasources.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No data sources yet</p>
          <p className="text-sm mt-1">Add a data source to start tracking domains</p>
        </div>
      ) : (
        <div className="space-y-4">
          {datasources.map((datasource) => (
            <DatasourceCard
              key={datasource.id}
              datasource={datasource}
              onDatasourceDeleted={onDatasourcesChange}
              onDomainAttached={onDatasourcesChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
