"use client"

import { DatasourceCard } from "./datasource-card"
import { CreateDatasourceDialog } from "./create-datasource-dialog"
import type { DatasourceWithDomains } from "@/lib/supabase/types"
import { Database } from "lucide-react"

interface DatasourcesListProps {
  projectId: string
  datasources: DatasourceWithDomains[]
  onDatasourcesChange?: () => void
}

export function DatasourcesList({ projectId, datasources, onDatasourcesChange }: DatasourcesListProps) {
  const existingTypes = datasources.map((ds) => ds.type)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Sources</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage data sources and their connected domains
          </p>
        </div>
        <CreateDatasourceDialog
          projectId={projectId}
          existingTypes={existingTypes}
          onDatasourceAdded={onDatasourcesChange}
        />
      </div>

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
              onDomainDetached={onDatasourcesChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
