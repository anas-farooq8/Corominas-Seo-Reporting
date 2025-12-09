"use client"

import { useState } from "react"
import { detachDomain } from "@/lib/actions/domains"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"

interface DetachDomainButtonProps {
  domainId: string
  datasourceId: string
}

export function DetachDomainButton({ domainId, datasourceId }: DetachDomainButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleDetach() {
    setLoading(true)
    const result = await detachDomain(domainId, datasourceId)

    if (result.success) {
      toast({ title: "Domain detached", description: "The domain has been removed." })
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }

    setLoading(false)
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleDetach}
      disabled={loading}
      className="gap-1 text-destructive hover:text-destructive"
    >
      <X className="h-4 w-4" />
      {loading ? "Removing..." : "Remove"}
    </Button>
  )
}
