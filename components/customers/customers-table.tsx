"use client"

import type { Customer } from "@/lib/supabase/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditCustomerDialog } from "./edit-customer-dialog"
import { DeleteCustomerButton } from "./delete-customer-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface CustomersTableProps {
  customers: Customer[]
}

export function CustomersTable({ customers }: CustomersTableProps) {
  if (customers.length === 0) {
    return <p className="text-sm text-muted-foreground">No customers found. Create one to get started.</p>
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {customers.map((customer) => (
          <Card key={customer.id}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-base font-medium">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{customer.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">{new Date(customer.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/dashboard/customers/${customer.id}`}>View Details</Link>
                  </Button>
                  <div className="flex gap-2">
                    <EditCustomerDialog customer={customer} />
                    <DeleteCustomerButton customerId={customer.id} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(customer.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/customers/${customer.id}`}>View</Link>
                    </Button>
                    <EditCustomerDialog customer={customer} />
                    <DeleteCustomerButton customerId={customer.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
