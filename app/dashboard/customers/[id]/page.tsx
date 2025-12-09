import { getCustomer } from "@/lib/db/customers"
import { getDatasources } from "@/lib/db/datasources"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatasourcesList } from "@/components/datasources/datasources-list"
import { CreateDatasourceDialog } from "@/components/datasources/create-datasource-dialog"

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CustomerDetailPageProps) {
  const { id } = await params
  const customer = await getCustomer(id)

  return {
    title: customer ? `${customer.name} - Dashboard` : "Customer - Dashboard",
  }
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  const datasources = await getDatasources(id)

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{customer.name}</h1>
        <p className="text-sm md:text-base text-muted-foreground">{customer.email}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>Manage SEO data sources for this customer</CardDescription>
          </div>
          <div className="w-full sm:w-auto">
            <CreateDatasourceDialog customerId={id} />
          </div>
        </CardHeader>
        <CardContent>
          <DatasourcesList datasources={datasources} customerId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
