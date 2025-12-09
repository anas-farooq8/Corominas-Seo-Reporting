"use client"

import { useState } from "react"
import { attachDomain } from "@/lib/actions/domains"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

interface AttachDomainButtonProps {
  datasourceId: string
  domain: string
}

export function AttachDomainButton({ datasourceId, domain }: AttachDomainButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleAttach() {
    setLoading(true)
    const result = await attachDomain({ datasource_id: datasourceId, domain })

    if (result.success) {
      toast({ title: "Domain attached", description: `${domain} has been added.` })
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }

    setLoading(false)
  }

  return (
    <Button size="sm" variant="outline" onClick={handleAttach} disabled={loading} className="gap-1 bg-transparent">
      <Plus className="h-4 w-4" />
      {loading ? "Attaching..." : "Attach"}
    </Button>
  )
}
