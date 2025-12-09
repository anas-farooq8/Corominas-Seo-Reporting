import type { Datasource } from "@/lib/supabase/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeleteDatasourceButton } from "./delete-datasource-button"
import { DomainsSection } from "./domains-section"

interface DatasourceCardProps {
  datasource: Datasource
  customerId: string
}

export async function DatasourceCard({ datasource, customerId }: DatasourceCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div>
            <CardTitle className="text-lg">
              {datasource.type === "mangools" ? "Mangools" : "SEMrush"}
            </CardTitle>
          </div>
        </div>
        <DeleteDatasourceButton datasourceId={datasource.id} customerId={customerId} />
      </CardHeader>
      <CardContent>
        {datasource.type === "mangools" ? (
          <DomainsSection datasourceId={datasource.id} />
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            SEMrush integration coming soon...
          </p>
        )}
      </CardContent>
    </Card>
  )
}
