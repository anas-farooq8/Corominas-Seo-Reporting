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
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{customer.name}</h1>
        <p className="text-muted-foreground">{customer.email}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>Manage SEO data sources for this customer</CardDescription>
          </div>
          <CreateDatasourceDialog customerId={id} />
        </CardHeader>
        <CardContent>
          <DatasourcesList datasources={datasources} customerId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
