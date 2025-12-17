"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, FileText, Menu, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { LogoutButton } from "./logout-button"
import { useState, useEffect } from "react"

const navigation = [
  {
    name: "Clients",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
    comingSoon: true,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileOpen])

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <img 
            src="https://www.google.com/s2/favicons?domain=corominas-consulting.de&sz=64" 
            alt="Corominas Consulting Logo" 
            className="h-8 w-8"
          />
          <span className="text-base font-bold">SEO Reporting</span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted transition-colors touch-manipulation"
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
        >
          {isMobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className="relative">
        <div className={cn(
          "fixed md:relative z-40 flex h-full flex-col border-r bg-card transition-all duration-300 ease-in-out md:translate-x-0",
          "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isDesktopCollapsed ? "md:w-16" : "md:w-64"
        )}>
          <div className="hidden md:flex h-16 items-center justify-center border-b px-3">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <img 
                src="https://www.google.com/s2/favicons?domain=corominas-consulting.de&sz=64" 
                alt="Corominas Consulting Logo" 
                className="h-8 w-8"
              />
              {!isDesktopCollapsed && <span className="text-base whitespace-nowrap">SEO Reporting</span>}
            </Link>
          </div>

          {/* Mobile padding to account for header */}
          <div className="md:hidden h-16" />

          <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium transition-colors touch-manipulation",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isDesktopCollapsed && "md:justify-center md:px-2"
                  )}
                  title={isDesktopCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isDesktopCollapsed && (
                    <div className="flex items-center justify-between flex-1 whitespace-nowrap">
                      <span>{item.name}</span>
                      {item.comingSoon && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          Soon
                        </Badge>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="border-t p-3">
            <LogoutButton collapsed={isDesktopCollapsed} />
          </div>
        </div>

        {/* Desktop Toggle Button - only visible on md and up */}
        <button
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          className="hidden md:flex absolute top-1/2 -right-3 z-50 h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition-colors hover:bg-accent cursor-pointer"
          aria-label={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isDesktopCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </>
  )
}
