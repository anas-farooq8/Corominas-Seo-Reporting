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
import { createDatasource, attachDomain, attachGoogleAnalyticsProperty, attachSemrushDomain } from "@/lib/actions/datasources"
import { Plus, Loader2, Search, AlertCircle, CheckCircle2 } from "lucide-react"
import type { Datasource, MangoolsApiDomain, GoogleAnalyticsApiProperty } from "@/lib/supabase/types"

interface CreateDatasourceDialogProps {
  projectId: string
  existingTypes: string[]
  onDatasourceAdded?: (datasource: Datasource) => void
}

interface DomainOption extends MangoolsApiDomain {
  isAttached: boolean
  attachedInfo?: string
}

interface PropertyOption extends GoogleAnalyticsApiProperty {
  isAttached: boolean
  attachedInfo?: string
}

export function CreateDatasourceDialog({ projectId, existingTypes, onDatasourceAdded }: CreateDatasourceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<"mangools" | "semrush" | "google_analytics" | "">("")
  
  // Mangools-specific state
  const [fetchingDomains, setFetchingDomains] = useState(false)
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<string>("")
  
  // Google Analytics-specific state
  const [fetchingProperties, setFetchingProperties] = useState(false)
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [propertySearchQuery, setPropertySearchQuery] = useState("")
  const [selectedProperty, setSelectedProperty] = useState<string>("")
  
  // Semrush-specific state
  const [semrushDomain, setSemrushDomain] = useState("")
  const [verifyingDomain, setVerifyingDomain] = useState(false)
  const [domainVerified, setDomainVerified] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  
  const [error, setError] = useState<string | null>(null)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedType("")
      setDomains([])
      setSearchQuery("")
      setSelectedDomain("")
      setProperties([])
      setPropertySearchQuery("")
      setSelectedProperty("")
      setSemrushDomain("")
      setVerifyingDomain(false)
      setDomainVerified(false)
      setVerificationResult(null)
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

  // Fetch Google Analytics properties when Google Analytics is selected
  useEffect(() => {
    async function fetchProperties() {
      if (selectedType !== "google_analytics") return
      
      setFetchingProperties(true)
      setError(null)
      
      try {
        // Fetch available properties from Google Analytics
        const propertiesResponse = await fetch("/api/google-analytics/properties")
        if (!propertiesResponse.ok) {
          throw new Error("Failed to fetch properties from Google Analytics")
        }
        const gaProperties: GoogleAnalyticsApiProperty[] = await propertiesResponse.json()
        
        // Fetch all attached properties to check which ones are already used
        const attachedResponse = await fetch("/api/google-analytics/attached")
        if (!attachedResponse.ok) {
          throw new Error("Failed to fetch attached properties")
        }
        const attachedProperties: { name: string }[] = await attachedResponse.json()
        const attachedPropertySet = new Set(attachedProperties.map(p => p.name))
        
        // Mark properties as attached or available
        const propertyOptions: PropertyOption[] = gaProperties.map(property => ({
          ...property,
          isAttached: attachedPropertySet.has(property.name),
          attachedInfo: attachedPropertySet.has(property.name) ? "Already attached to another project" : undefined
        }))
        
        setProperties(propertyOptions)
        
        if (propertyOptions.length === 0) {
          setError("No properties found in your Google Analytics account")
        }
      } catch (err) {
        console.error("Error fetching properties:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch properties")
      } finally {
        setFetchingProperties(false)
      }
    }
    
    fetchProperties()
  }, [selectedType])

  // Handle Semrush domain verification
  async function handleVerifyDomain() {
    if (!semrushDomain.trim()) {
      setError("Please enter a domain")
      return
    }

    setVerifyingDomain(true)
    setError(null)
    setDomainVerified(false)
    setVerificationResult(null)

    try {
      const response = await fetch("/api/semrush/verify-domain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: semrushDomain.trim().toLowerCase() }),
      })

      if (!response.ok) {
        throw new Error("Failed to verify domain")
      }

      const result = await response.json()
      setVerificationResult(result)

      if (result.is_valid) {
        // Check if domain is already attached
        const attachedResponse = await fetch("/api/semrush/attached")
        if (attachedResponse.ok) {
          const attachedDomains: { domain: string }[] = await attachedResponse.json()
          const isAttached = attachedDomains.some(d => d.domain === result.domain)
          
          if (isAttached) {
            setError("This domain is already attached to another project")
            setDomainVerified(false)
          } else {
            setDomainVerified(true)
          }
        } else {
          setDomainVerified(true)
        }
      } else {
        if (!result.syntax_valid) {
          setError("Invalid domain format. Please enter a valid domain (e.g., example.com)")
        } else if (!result.dns_resolves) {
          setError("Domain does not resolve via DNS. Please check the domain name.")
        } else {
          setError("Domain verification failed. Please try again.")
        }
      }
    } catch (err) {
      console.error("Error verifying domain:", err)
      setError(err instanceof Error ? err.message : "Failed to verify domain")
    } finally {
      setVerifyingDomain(false)
    }
  }

  // Filter domains based on search query
  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return domains
    
    const query = searchQuery.toLowerCase()
    return domains.filter(domain => 
      domain.domain.toLowerCase().includes(query) ||
      domain.location?.label.toLowerCase().includes(query)
    )
  }, [domains, searchQuery])

  // Filter properties based on search query
  const filteredProperties = useMemo(() => {
    if (!propertySearchQuery.trim()) return properties
    
    const query = propertySearchQuery.toLowerCase()
    return properties.filter(property => 
      property.display_name.toLowerCase().includes(query) ||
      property.name.toLowerCase().includes(query)
    )
  }, [properties, propertySearchQuery])

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

    // For Google Analytics, require property selection
    if (selectedType === "google_analytics" && !selectedProperty) {
      setError("Please select a property to attach")
      return
    }

    // For Semrush, require verified domain
    if (selectedType === "semrush" && (!semrushDomain || !domainVerified)) {
      setError("Please verify a domain before creating the datasource")
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
            domain.domain,
            projectId  // Add projectId parameter
          )
        }
      }

      // If Google Analytics, attach the selected property
      if (selectedType === "google_analytics" && selectedProperty) {
        const property = properties.find(p => p.name === selectedProperty)
        if (property) {
          await attachGoogleAnalyticsProperty(
            datasource.id,
            property.name,
            property.parent,
            property.display_name,
            property.time_zone,
            property.currency_code,
            projectId
          )
        }
      }

      // If Semrush, attach the verified domain
      if (selectedType === "semrush" && semrushDomain && domainVerified) {
        await attachSemrushDomain(
          datasource.id,
          semrushDomain.trim().toLowerCase(),
          projectId
        )
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
    { value: "google_analytics", label: "Google Analytics", disabled: existingTypes.includes("google_analytics") },
    { value: "semrush", label: "Semrush", disabled: existingTypes.includes("semrush") },
  ]

  const canSubmit = selectedType && 
    (selectedType !== "mangools" || selectedDomain) &&
    (selectedType !== "google_analytics" || selectedProperty) &&
    (selectedType !== "semrush" || (semrushDomain && domainVerified))

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && setOpen(open)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm touch-manipulation">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Data Source
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[600px] max-h-[90vh] overflow-y-auto" showCloseButton={!loading} onInteractOutside={(e) => loading && e.preventDefault()} onEscapeKeyDown={(e) => loading && e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base sm:text-lg">Add Data Source</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm leading-relaxed">
              {selectedType === "mangools" 
                ? "Select a domain from your Mangools account. Note: Each domain can only be attached once, and each project can have only one Mangools data source."
                : selectedType === "google_analytics"
                ? "Select a property from your Google Analytics account. Note: Each property can only be attached once, and each project can have only one Google Analytics data source."
                : selectedType === "semrush"
                ? "Enter a domain to track with Semrush. We'll verify the domain before adding it. Note: Each domain can only be attached once, and each project can have only one Semrush data source."
                : "Add a new data source to this project. Each type can only be added once per project."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Data Source Type Selection */}
            <div className="grid gap-1.5">
              <Label htmlFor="type" className="text-xs sm:text-sm">Data Source Type *</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as "mangools" | "semrush" | "google_analytics")}
                disabled={loading || fetchingDomains || fetchingProperties}
              >
                <SelectTrigger id="type" className="cursor-pointer h-9 text-sm">
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
                  <div className="flex flex-col sm:flex-row items-center justify-center py-6 sm:py-8 gap-2 sm:gap-3">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground text-center">
                      Loading domains from Mangools...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="grid gap-1.5">
                      <Label htmlFor="search" className="text-xs sm:text-sm">Search Domains</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                          id="search"
                          type="text"
                          placeholder="Search by domain..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-9 text-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Domain List */}
                    <div className="grid gap-1.5">
                      <Label className="text-xs sm:text-sm">Available Domains ({filteredDomains.length})</Label>
                      <div className="border rounded-lg max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                        {filteredDomains.length === 0 ? (
                          <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
                            {searchQuery ? "No domains match your search" : "No domains available"}
                          </div>
                        ) : (
                          <div className="divide-y">
                            {filteredDomains.map((domain) => (
                              <label
                                key={domain._id}
                                className={`flex items-start gap-2 sm:gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
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
                                  className="mt-1 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-xs sm:text-sm truncate">
                                      {domain.domain}
                                    </p>
                                    {domain.isAttached && (
                                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                                    )}
                                    {selectedDomain === domain._id && !domain.isAttached && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                                    {domain.location && (
                                      <span className="text-[11px] sm:text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                                        📍 {domain.location.label}
                                      </span>
                                    )}
                                    <span className="text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                      🔑 {domain.count} keywords
                                    </span>
                                  </div>
                                  {domain.isAttached && (
                                    <p className="text-[11px] sm:text-xs text-yellow-600 mt-1">
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

            {/* Google Analytics Property Selection */}
            {selectedType === "google_analytics" && (
              <>
                {fetchingProperties ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center py-6 sm:py-8 gap-2 sm:gap-3">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground text-center">
                      Loading properties from Google Analytics...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="grid gap-1.5">
                      <Label htmlFor="property-search" className="text-xs sm:text-sm">Search Properties</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                          id="property-search"
                          type="text"
                          placeholder="Search by property name..."
                          value={propertySearchQuery}
                          onChange={(e) => setPropertySearchQuery(e.target.value)}
                          className="pl-8 h-9 text-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Property List */}
                    <div className="grid gap-1.5">
                      <Label className="text-xs sm:text-sm">Available Properties ({filteredProperties.length})</Label>
                      <div className="border rounded-lg max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                        {filteredProperties.length === 0 ? (
                          <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
                            {propertySearchQuery ? "No properties match your search" : "No properties available"}
                          </div>
                        ) : (
                          <div className="divide-y">
                            {filteredProperties.map((property) => (
                              <label
                                key={property.name}
                                className={`flex items-start gap-2 sm:gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                                  property.isAttached ? "opacity-50 cursor-not-allowed" : ""
                                } ${selectedProperty === property.name ? "bg-muted" : ""}`}
                              >
                                <input
                                  type="radio"
                                  name="property"
                                  value={property.name}
                                  checked={selectedProperty === property.name}
                                  onChange={(e) => setSelectedProperty(e.target.value)}
                                  disabled={property.isAttached || loading}
                                  className="mt-1 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-xs sm:text-sm truncate">
                                      {property.display_name}
                                    </p>
                                    {property.isAttached && (
                                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                                    )}
                                    {selectedProperty === property.name && !property.isAttached && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                                    <span className="text-[11px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                                      🕐 {property.time_zone}
                                    </span>
                                    <span className="text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                      💰 {property.currency_code}
                                    </span>
                                  </div>
                                  {property.isAttached && (
                                    <p className="text-[11px] sm:text-xs text-yellow-600 mt-1">
                                      {property.attachedInfo}
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

            {/* Semrush Domain Input and Verification */}
            {selectedType === "semrush" && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="semrush-domain" className="text-xs sm:text-sm">Domain *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="semrush-domain"
                      type="text"
                      placeholder="example.com"
                      value={semrushDomain}
                      onChange={(e) => {
                        setSemrushDomain(e.target.value)
                        setDomainVerified(false)
                        setVerificationResult(null)
                        setError(null)
                      }}
                      className="h-9 text-sm"
                      disabled={loading || verifyingDomain}
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyDomain}
                      disabled={!semrushDomain.trim() || loading || verifyingDomain}
                      className="h-9 text-xs sm:text-sm whitespace-nowrap"
                      variant="secondary"
                    >
                      {verifyingDomain ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Enter the domain without protocol (e.g., example.com)
                  </p>
                </div>

                {/* Verification Result */}
                {verificationResult && (
                  <div className={`flex items-start gap-2 p-3 text-xs sm:text-sm rounded-lg border ${
                    domainVerified 
                      ? "text-green-700 bg-green-50 border-green-200" 
                      : "text-red-700 bg-red-50 border-red-200"
                  }`}>
                    {domainVerified ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="space-y-1">
                      <p className="font-medium">
                        {domainVerified ? "Domain verified successfully!" : "Domain verification failed"}
                      </p>
                      <div className="text-[11px] space-y-0.5">
                        <p>✓ Syntax: {verificationResult.syntax_valid ? "Valid" : "Invalid"}</p>
                        <p>✓ DNS: {verificationResult.dns_resolves ? "Resolves" : "Does not resolve"}</p>
                        <p>✓ HTTP: {verificationResult.http_reachable ? "Reachable" : "Not reachable"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none touch-manipulation">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetchingDomains || fetchingProperties || verifyingDomain || !canSubmit} className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none touch-manipulation">
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
