"use client"

import { getCustomers } from "@/lib/db/customers"
import Link from "next/link"
import { BarChart3, Menu, X } from "lucide-react"
import { LogoutButton } from "./logout-button"
import { useState, useEffect } from "react"
import type { Customer } from "@/lib/supabase/types"

interface SidebarProps {
  customers: Customer[]
}

export function Sidebar({ customers }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-card border border-border hover:bg-accent"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 border-r border-border bg-card
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          flex flex-col
        `}
      >
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8 mt-12 md:mt-0">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
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
                    onClick={() => setIsOpen(false)}
                  >
                    {customer.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Logout button at bottom */}
        <div className="p-6 border-t border-border">
          <LogoutButton />
        </div>
      </aside>
    </>
  )
}
