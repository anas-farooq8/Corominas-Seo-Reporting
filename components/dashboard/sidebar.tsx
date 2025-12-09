import { getCustomers } from "@/lib/db/customers"
import Link from "next/link"
import { BarChart3 } from "lucide-react"

export async function Sidebar() {
  const customers = await getCustomers()

  return (
    <aside className="w-64 border-r border-border bg-card p-6">
      <div className="mb-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">SEO Dashboard</span>
        </Link>
      </div>

      <nav className="space-y-1">
        <p className="px-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Customers</p>
        <ul className="space-y-1">
          {customers.map((customer) => (
            <li key={customer.id}>
              <Link
                href={`/dashboard/customers/${customer.id}`}
                className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {customer.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
