"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { createDatasource } from "@/lib/actions/datasources"
import { attachDomain } from "@/lib/actions/domains"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Loader2, Search, Check, AlertCircle } from "lucide-react"
import type { MangoolsApiDomain } from "@/lib/supabase/types"

interface CreateDatasourceDialogProps {
  customerId: string
}

type Step = "select-type" | "select-domains"

export function CreateDatasourceDialog({ customerId }: CreateDatasourceDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("select-type")
  const [type, setType] = useState<"mangools" | "semrush">("mangools")
  const [loading, setLoading] = useState(false)
  const [fetchingDomains, setFetchingDomains] = useState(false)
  const [domains, setDomains] = useState<MangoolsApiDomain[]>([])
  const [attachedDomains, setAttachedDomains] = useState<Set<string>>(new Set())
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("select-type")
      setType("mangools")
      setDomains([])
      setAttachedDomains(new Set())
      setSelectedDomains(new Set())
      setSearchQuery("")
      setError(null)
    }
  }, [open])

  // Fetch domains and check which are already attached
  async function fetchDomains() {
    if (type === "semrush") {
      toast({ title: "Coming Soon", description: "SEMrush integration is not yet available.", variant: "destructive" })
      return
    }

    setFetchingDomains(true)
    setError(null)

    try {
      // Fetch available domains from Mangools API
      const response = await fetch("/api/mangools/domains")
      if (!response.ok) throw new Error("Failed to fetch domains")
      const availableDomains = (await response.json()) as MangoolsApiDomain[]
      setDomains(availableDomains)

      // Fetch already attached domains for this customer
      const attachedResponse = await fetch(`/api/customers/${customerId}/attached-domains`)
      if (attachedResponse.ok) {
        const attached = (await attachedResponse.json()) as { domain: string }[]
        setAttachedDomains(new Set(attached.map((d) => d.domain)))
      }

      setStep("select-domains")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch domains")
      toast({ title: "Error", description: "Failed to fetch domains from Mangools", variant: "destructive" })
    } finally {
      setFetchingDomains(false)
    }
  }

  async function handleCreateDatasource() {
    if (selectedDomains.size === 0) {
      toast({ title: "No domains selected", description: "Please select at least one domain", variant: "destructive" })
      return
    }

    setLoading(true)

    try {
      // Create datasource with auto-generated name
      const datasourceName = `${type.charAt(0).toUpperCase() + type.slice(1)} - ${new Date().toLocaleDateString()}`
      const result = await createDatasource({ customer_id: customerId, name: datasourceName, type })

      if (!result.success) {
        throw new Error(result.error)
      }

      // Attach selected domains to the datasource
      const attachPromises = Array.from(selectedDomains).map((domainName) =>
        attachDomain({ datasource_id: result.data.id, domain: domainName })
      )

      const attachResults = await Promise.all(attachPromises)
      const failedAttachments = attachResults.filter((r) => !r.success)

      if (failedAttachments.length > 0) {
        toast({
          title: "Partial Success",
          description: `Datasource created but ${failedAttachments.length} domain(s) failed to attach`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: `Datasource created with ${selectedDomains.size} domain(s) attached`,
        })
      }

      setOpen(false)
      window.location.reload() // Refresh to show new datasource
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create datasource", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  function toggleDomain(domainName: string) {
    setSelectedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(domainName)) {
        next.delete(domainName)
      } else {
        next.add(domainName)
      }
      return next
    })
  }

  // Filter domains based on search
  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return domains
    const query = searchQuery.toLowerCase()
    return domains.filter((d) => d.domain.toLowerCase().includes(query))
  }, [domains, searchQuery])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Source
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "select-type" ? "Select Data Source Type" : "Select Domains to Attach"}
          </DialogTitle>
          <DialogDescription>
            {step === "select-type"
              ? "Choose the SEO platform you want to connect"
              : "Select one or more domains from your Mangools account"}
          </DialogDescription>
        </DialogHeader>

        {step === "select-type" && (
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Data Source Type
              </Label>
              <Select value={type} onValueChange={(value) => setType(value as "mangools" | "semrush")}>
                <SelectTrigger id="type" disabled={fetchingDomains} className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mangools">Mangools (SERPWatcher)</SelectItem>
                  <SelectItem value="semrush" disabled>
                    SEMrush (Coming Soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={fetchingDomains}>
                Cancel
              </Button>
              <Button onClick={fetchDomains} disabled={fetchingDomains || type === "semrush"}>
                {fetchingDomains ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Fetching...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "select-domains" && (
          <div className="space-y-4 pt-2">
            {error && (
              <div className="flex gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Selected count */}
            {selectedDomains.size > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedDomains.size} domain{selectedDomains.size !== 1 ? "s" : ""} selected
              </div>
            )}

            {/* Domains list */}
            <div className="border border-border rounded-md max-h-96 overflow-y-auto">
              {fetchingDomains ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading domains...</span>
                </div>
              ) : filteredDomains.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {domains.length === 0 ? "No domains available" : "No domains match your search"}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredDomains.map((domain) => {
                    const isAttached = attachedDomains.has(domain.domain)
                    const isSelected = selectedDomains.has(domain.domain)

                    return (
                      <div
                        key={domain._id}
                        className={`flex items-center justify-between p-4 hover:bg-accent/50 transition-colors ${
                          isAttached ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        }`}
                        onClick={() => !isAttached && toggleDomain(domain.domain)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{domain.domain}</p>
                            {isAttached && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                                Already Connected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {domain.location?.label || "Unknown location"} • {domain.count || 0} keywords
                          </p>
                        </div>
                        <div className="ml-4">
                          {isAttached ? (
                            <div className="h-5 w-5 rounded border-2 border-muted bg-muted" />
                          ) : (
                            <div
                              className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input bg-background"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep("select-type")
                  setSelectedDomains(new Set())
                }}
                disabled={loading}
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDatasource} disabled={loading || selectedDomains.size === 0}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    `Add ${selectedDomains.size > 0 ? `${selectedDomains.size} ` : ""}Domain${selectedDomains.size !== 1 ? "s" : ""}`
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
