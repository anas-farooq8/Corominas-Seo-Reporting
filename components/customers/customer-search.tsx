"use client"

import { useState, useMemo } from "react"
import type { Customer } from "@/lib/supabase/types"
import { CustomersTable } from "./customers-table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface CustomerSearchProps {
  customers: Customer[]
}

export function CustomerSearch({ customers }: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      return customers
    }

    const query = searchQuery.toLowerCase()
    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() || ""
      const email = customer.email?.toLowerCase() || ""
      return name.includes(query) || email.includes(query)
    })
  }, [customers, searchQuery])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Found {filteredCustomers.length} {filteredCustomers.length === 1 ? "customer" : "customers"}
        </p>
      )}
      
      <CustomersTable customers={filteredCustomers} />
    </div>
  )
}

