import type React from "react"
import { Sidebar } from "@/components/dashboard/sidebar"

export const metadata = {
  title: "SEO Reporting Dashboard",
  description: "Admin dashboard for SEO reporting and domain management",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
