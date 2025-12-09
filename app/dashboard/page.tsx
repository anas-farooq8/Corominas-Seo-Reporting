import { getCustomers } from "@/lib/db/customers"
import { CreateCustomerDialog } from "@/components/customers/create-customer-dialog"
import { CustomersTable } from "@/components/customers/customers-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const customers = await getCustomers()

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage customers and their SEO data sources</p>
        </div>
        <CreateCustomerDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>List of all customers and their associated data</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomersTable customers={customers} />
        </CardContent>
      </Card>
    </div>
  )
}
