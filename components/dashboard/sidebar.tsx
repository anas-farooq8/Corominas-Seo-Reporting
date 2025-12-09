"use client"

import { getCustomers } from "@/lib/db/customers"
import Link from "next/link"
import { BarChart3, Menu, X, ChevronLeft, ChevronRight, Users, FileText } from "lucide-react"
import { LogoutButton } from "./logout-button"
import { useState, useEffect } from "react"
import type { Customer } from "@/lib/supabase/types"

interface SidebarProps {
  customers: Customer[]
}

type TabType = "customers" | "reports"

export function Sidebar({ customers }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("customers")

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
          border-r border-border bg-card
          transform transition-all duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-16" : "md:w-64"}
          w-64
          flex flex-col
        `}
      >
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 mt-12 md:mt-0">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2" 
              onClick={() => setIsOpen(false)}
              title={isCollapsed ? "SEO Dashboard" : ""}
            >
              <BarChart3 className="h-6 w-6 text-primary flex-shrink-0" />
              {!isCollapsed && <span className="text-lg font-bold text-foreground">SEO Dashboard</span>}
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex flex-col gap-2 mb-6">
            <button
              onClick={() => setActiveTab("customers")}
              className={`
                flex items-center gap-3 ${isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"}
                text-sm font-medium transition-colors rounded-md
                ${activeTab === "customers" 
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}
              `}
              title={isCollapsed ? "Customers" : ""}
            >
              <Users className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Customers</span>}
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`
                flex items-center gap-3 ${isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"}
                text-sm font-medium transition-colors rounded-md
                ${activeTab === "reports" 
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}
              `}
              title={isCollapsed ? "Reports" : ""}
            >
              <FileText className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Reports</span>}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "reports" && (
            <div className={`${isCollapsed ? "px-2" : "px-3"} py-4 text-center`}>
              <p className={`text-sm text-muted-foreground ${isCollapsed ? "text-xs" : ""}`}>
                {isCollapsed ? "Soon" : "Coming Soon"}
              </p>
            </div>
          )}
        </div>

        {/* Desktop collapse/expand button - centered vertically */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-50 h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-accent transition-colors cursor-pointer"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Logout button at bottom */}
        <div className={`p-6 border-t border-border ${isCollapsed ? "px-2" : ""}`}>
          <LogoutButton collapsed={isCollapsed} />
        </div>
      </aside>
    </>
  )
}
