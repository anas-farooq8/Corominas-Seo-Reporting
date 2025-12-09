"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

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
      className={`w-full ${collapsed ? "justify-center px-2" : "justify-start"}`}
      onClick={handleLogout}
      disabled={loading}
      title={collapsed ? "Logout" : ""}
    >
      <LogOut className={`h-4 w-4 ${collapsed ? "" : "mr-2"}`} />
      {!collapsed && (loading ? "Logging out..." : "Logout")}
    </Button>
  )
}

