"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoutButtonProps {
  collapsed?: boolean
}

export function LogoutButton({ collapsed = false }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className={cn(
        "w-full h-10 sm:h-11 text-[15px] touch-manipulation",
        collapsed ? "md:justify-center md:px-2" : "justify-start"
      )}
      onClick={handleLogout}
      disabled={loading}
      title={collapsed ? "Logout" : undefined}
    >
      <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
      {!collapsed && (loading ? "Logging out..." : "Logout")}
    </Button>
  )
}

