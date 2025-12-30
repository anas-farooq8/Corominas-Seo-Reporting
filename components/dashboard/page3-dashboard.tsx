"use client"

import { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Page3DashboardProps {
  // No props needed for now, but keeping the interface for consistency
}

export function Page3Dashboard({}: Page3DashboardProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading for consistency with other pages
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner message="Loading SEO dashboard data..." />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-muted-foreground">
          Coming Soon
        </h2>
      </div>
    </div>
  )
}

