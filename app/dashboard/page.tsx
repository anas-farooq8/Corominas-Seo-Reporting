import { getCustomers } from "@/lib/db/customers"
import { CreateCustomerDialog } from "@/components/customers/create-customer-dialog"
import { CustomersTable } from "@/components/customers/customers-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const customers = await getCustomers()

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Manage customers and their SEO data sources</p>
        </div>
        <div className="w-full sm:w-auto">
          <CreateCustomerDialog />
        </div>
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
