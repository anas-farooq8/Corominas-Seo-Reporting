"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createDatasource, attachDomain } from "@/lib/actions/datasources"
import { Plus, Loader2, Search, AlertCircle, CheckCircle2 } from "lucide-react"
import type { Datasource, MangoolsApiDomain } from "@/lib/supabase/types"

interface CreateDatasourceDialogProps {
  projectId: string
  existingTypes: string[]
  onDatasourceAdded?: (datasource: Datasource) => void
}

interface DomainOption extends MangoolsApiDomain {
  isAttached: boolean
  attachedInfo?: string
}

export function CreateDatasourceDialog({ projectId, existingTypes, onDatasourceAdded }: CreateDatasourceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<"mangools" | "semrush" | "">("")
  
  // Mangools-specific state
  const [fetchingDomains, setFetchingDomains] = useState(false)
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedType("")
      setDomains([])
      setSearchQuery("")
      setSelectedDomain("")
      setError(null)
    }
  }, [open])

  // Fetch Mangools domains when Mangools is selected
  useEffect(() => {
    async function fetchDomains() {
      if (selectedType !== "mangools") return
      
      setFetchingDomains(true)
      setError(null)
      
      try {
        // Fetch available domains from Mangools
        const domainsResponse = await fetch("/api/mangools/domains")
        if (!domainsResponse.ok) {
          throw new Error("Failed to fetch domains from Mangools")
        }
        const mangoolsDomains: MangoolsApiDomain[] = await domainsResponse.json()
        
        // Fetch all attached domains to check which ones are already used
        const attachedResponse = await fetch("/api/domains/attached")
        if (!attachedResponse.ok) {
          throw new Error("Failed to fetch attached domains")
        }
        const attachedDomains: { domain: string }[] = await attachedResponse.json()
        const attachedDomainSet = new Set(attachedDomains.map(d => d.domain))
        
        // Mark domains as attached or available
        const domainOptions: DomainOption[] = mangoolsDomains.map(domain => ({
          ...domain,
          isAttached: attachedDomainSet.has(domain.domain),
          attachedInfo: attachedDomainSet.has(domain.domain) ? "Already attached to another project" : undefined
        }))
        
        setDomains(domainOptions)
        
        if (domainOptions.length === 0) {
          setError("No domains found in your Mangools account")
        }
      } catch (err) {
        console.error("Error fetching domains:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch domains")
      } finally {
        setFetchingDomains(false)
      }
    }
    
    fetchDomains()
  }, [selectedType])

  // Filter domains based on search query
  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return domains
    
    const query = searchQuery.toLowerCase()
    return domains.filter(domain => 
      domain.domain.toLowerCase().includes(query) ||
      domain.location?.label.toLowerCase().includes(query)
    )
  }, [domains, searchQuery])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedType) {
      setError("Please select a data source type")
      return
    }

    // For Mangools, require domain selection
    if (selectedType === "mangools" && !selectedDomain) {
      setError("Please select a domain to attach")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create the datasource
      const datasource = await createDatasource({
        project_id: projectId,
        type: selectedType,
      })

      // If Mangools, attach the selected domain
      if (selectedType === "mangools" && selectedDomain) {
        const domain = domains.find(d => d._id === selectedDomain)
        if (domain) {
          await attachDomain(
            datasource.id,
            domain._id,  // tracking_id
            domain.domain
          )
        }
      }

      setOpen(false)
      onDatasourceAdded?.(datasource)
    } catch (error) {
      console.error("Error creating datasource:", error)
      setError(error instanceof Error ? error.message : "Failed to create datasource. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const availableTypes = [
    { value: "mangools", label: "Mangools", disabled: existingTypes.includes("mangools") },
    { value: "semrush", label: "Semrush (Coming Soon)", disabled: true },
  ]

  const canSubmit = selectedType && (selectedType !== "mangools" || selectedDomain)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Data Source
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Data Source</DialogTitle>
            <DialogDescription>
              {selectedType === "mangools" 
                ? "Select a domain from your Mangools account. Note: Each domain can only be attached once, and each project can have only one Mangools data source."
                : "Add a new data source to this project. Each type can only be added once per project."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Data Source Type Selection */}
            <div className="grid gap-2">
              <Label htmlFor="type">Data Source Type *</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as "mangools" | "semrush")}
                disabled={loading || fetchingDomains}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select a data source type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      disabled={type.disabled}
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mangools Domain Selection */}
            {selectedType === "mangools" && (
              <>
                {fetchingDomains ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-sm text-muted-foreground">
                      Loading domains from Mangools...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="grid gap-2">
                      <Label htmlFor="search">Search Domains</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="search"
                          type="text"
                          placeholder="Search by domain or location..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Domain List */}
                    <div className="grid gap-2">
                      <Label>Available Domains ({filteredDomains.length})</Label>
                      <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                        {filteredDomains.length === 0 ? (
                          <div className="p-8 text-center text-sm text-muted-foreground">
                            {searchQuery ? "No domains match your search" : "No domains available"}
                          </div>
                        ) : (
                          <div className="divide-y">
                            {filteredDomains.map((domain) => (
                              <label
                                key={domain._id}
                                className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                                  domain.isAttached ? "opacity-50 cursor-not-allowed" : ""
                                } ${selectedDomain === domain._id ? "bg-muted" : ""}`}
                              >
                                <input
                                  type="radio"
                                  name="domain"
                                  value={domain._id}
                                  checked={selectedDomain === domain._id}
                                  onChange={(e) => setSelectedDomain(e.target.value)}
                                  disabled={domain.isAttached || loading}
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate">
                                      {domain.domain}
                                    </p>
                                    {domain.isAttached && (
                                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                                    )}
                                    {selectedDomain === domain._id && !domain.isAttached && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {domain.location && (
                                      <span className="text-xs text-muted-foreground">
                                        📍 {domain.location.label}
                                      </span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      🔑 {domain.count} keywords
                                    </span>
                                  </div>
                                  {domain.isAttached && (
                                    <p className="text-xs text-yellow-600 mt-1">
                                      {domain.attachedInfo}
                                    </p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetchingDomains || !canSubmit}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Data Source"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
