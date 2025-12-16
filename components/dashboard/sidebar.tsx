"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { LogoutButton } from "./logout-button"
import { useState } from "react"

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
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="relative">
      <div className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16"
      )}>
        <div className="flex h-16 items-center justify-center border-b px-2">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <img 
              src="https://www.google.com/s2/favicons?domain=corominas-consulting.de&sz=64" 
              alt="Corominas Consulting Logo" 
              className="h-8 w-8"
            />
            {isOpen && <span className="whitespace-nowrap">SEO Reporting</span>}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !isOpen && "justify-center px-2"
                )}
                title={!isOpen ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {isOpen && (
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

        <div className="border-t p-2">
          <LogoutButton collapsed={!isOpen} />
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-1/2 -right-3 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition-colors hover:bg-accent cursor-pointer"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
