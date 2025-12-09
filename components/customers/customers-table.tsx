"use client"

import type { Customer } from "@/lib/supabase/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditCustomerDialog } from "./edit-customer-dialog"
import { DeleteCustomerButton } from "./delete-customer-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface CustomersTableProps {
  customers: Customer[]
}

export function CustomersTable({ customers }: CustomersTableProps) {
  if (customers.length === 0) {
    return <p className="text-sm text-muted-foreground">No customers found. Create one to get started.</p>
  }

  return (
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
            <TableCell className="text-right space-x-2 flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/customers/${customer.id}`}>View</Link>
              </Button>
              <EditCustomerDialog customer={customer} />
              <DeleteCustomerButton customerId={customer.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
