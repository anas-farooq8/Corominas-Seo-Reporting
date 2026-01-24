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
import { createDatasource, attachDomain, attachGoogleAnalyticsProperty, attachSemrushDomain, attachGoogleSearchConsoleSite, attachGoogleBusinessProfileLocation, attachGMBProfile } from "@/lib/actions/datasources"
import { Plus, Loader2, Search, AlertCircle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react"
import type { Datasource, MangoolsApiDomain, GoogleAnalyticsApiProperty, GAAccountWithProperties, GBPAccountWithLocations, GBPLocation, GMBApiProfile } from "@/lib/supabase/types"

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

interface GAAccountWithPropertiesOption extends GAAccountWithProperties {
  expanded?: boolean
  properties: PropertyOption[]
}

interface SiteOption {
  siteUrl: string
  isAttached: boolean
  attachedInfo?: string
}

interface LocationOption extends GBPLocation {
  isAttached: boolean
  attachedInfo?: string
}

interface AccountWithLocations extends GBPAccountWithLocations {
  expanded?: boolean
}

interface GMBProfileOption {
  _id: string
  businessName: string
  address: string | null
  rating?: number | null
  totalReviews?: number | null
  gmbScore?: number | null
  active: boolean
  isAttached: boolean
  attachedInfo?: string
}

// Helper function to format address properly
function formatAddress(address?: GBPLocation['address']): string {
  if (!address) return ""
  
  const parts: string[] = []
  
  // Street address
  if (address.addressLines && address.addressLines.length > 0) {
    parts.push(address.addressLines.join(", "))
  }
  
  // Postal code and city (e.g., "82031 Grünwald")
  const cityParts: string[] = []
  if (address.postalCode) cityParts.push(address.postalCode)
  if (address.locality) cityParts.push(address.locality)
  if (cityParts.length > 0) {
    parts.push(cityParts.join(" "))
  }
  
  // Country (convert code to name)
  if (address.regionCode) {
    const countryNames: Record<string, string> = {
      'DE': 'Germany',
      'US': 'United States',
      'GB': 'United Kingdom',
      'FR': 'France',
      'ES': 'Spain',
      'IT': 'Italy',
      'AT': 'Austria',
      'CH': 'Switzerland',
      // Add more as needed
    }
    const countryName = countryNames[address.regionCode] || address.regionCode
    parts.push(countryName)
  }
  
  return parts.filter(p => p).join(", ")
}

// Helper to flatten all GBP locations from accounts
function flattenLocations(accounts: AccountWithLocations[]): LocationOption[] {
  return accounts.flatMap(account =>
    account.locations.map(location => location as LocationOption)
  )
}

export function CreateDatasourceDialog({ projectId, existingTypes, onDatasourceAdded }: CreateDatasourceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<"mangools" | "semrush" | "google_analytics" | "google_search_console" | "gbp" | "gmb" | "">("")
  
  // Mangools-specific state
  const [fetchingDomains, setFetchingDomains] = useState(false)
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<string>("")
  
  // Google Analytics-specific state
  const [fetchingProperties, setFetchingProperties] = useState(false)
  const [gaAccounts, setGaAccounts] = useState<GAAccountWithPropertiesOption[]>([])
  const [propertySearchQuery, setPropertySearchQuery] = useState("")
  const [selectedProperty, setSelectedProperty] = useState<string>("")
  
  // Google Search Console-specific state
  const [fetchingSites, setFetchingSites] = useState(false)
  const [sites, setSites] = useState<SiteOption[]>([])
  const [siteSearchQuery, setSiteSearchQuery] = useState("")
  const [selectedSite, setSelectedSite] = useState<string>("")
  
  // Semrush-specific state
  const [semrushDomain, setSemrushDomain] = useState("")
  const [verifyingDomain, setVerifyingDomain] = useState(false)
  const [domainVerificationState, setDomainVerificationState] = useState<{
    verified: boolean
    result: any | null
    showResult: boolean
  }>({ verified: false, result: null, showResult: false })
  
  // GBP-specific state
  const [fetchingGBPLocations, setFetchingGBPLocations] = useState(false)
  const [gbpAccounts, setGbpAccounts] = useState<AccountWithLocations[]>([])
  const [gbpLocationSearchQuery, setGbpLocationSearchQuery] = useState("")
  const [selectedGBPLocation, setSelectedGBPLocation] = useState<string>("")
  const [gbpAuthStatus, setGbpAuthStatus] = useState<"checking" | "authenticated" | "not_authenticated">("checking")
  const [initiatingOAuth, setInitiatingOAuth] = useState(false)
  
  // GMB-specific state
  const [fetchingGMBProfiles, setFetchingGMBProfiles] = useState(false)
  const [gmbProfiles, setGmbProfiles] = useState<GMBProfileOption[]>([])
  const [gmbProfileSearchQuery, setGmbProfileSearchQuery] = useState("")
  const [selectedGMBProfile, setSelectedGMBProfile] = useState<string>("")
  const [gmbAuthStatus, setGmbAuthStatus] = useState<"checking" | "authenticated" | "not_authenticated">("checking")
  const [initiatingGMBAuth, setInitiatingGMBAuth] = useState(false)
  
  const [error, setError] = useState<string | null>(null)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedType("")
      setDomains([])
      setSearchQuery("")
      setSelectedDomain("")
      setGaAccounts([])
      setPropertySearchQuery("")
      setSelectedProperty("")
      setSites([])
      setSiteSearchQuery("")
      setSelectedSite("")
      setSemrushDomain("")
      setVerifyingDomain(false)
      setDomainVerificationState({ verified: false, result: null, showResult: false })
      setGbpAccounts([])
      setGbpLocationSearchQuery("")
      setSelectedGBPLocation("")
      setGbpAuthStatus("checking")
      setInitiatingOAuth(false)
      setGmbProfiles([])
      setGmbProfileSearchQuery("")
      setSelectedGMBProfile("")
      setGmbAuthStatus("checking")
      setInitiatingGMBAuth(false)
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

  // Fetch Google Analytics accounts and properties when Google Analytics is selected
  useEffect(() => {
    async function fetchAccountsAndProperties() {
      if (selectedType !== "google_analytics") return
      
      setFetchingProperties(true)
      setError(null)
      
      try {
        // Fetch available accounts with properties from Google Analytics
        const accountsResponse = await fetch("/api/google-analytics/properties")
        if (!accountsResponse.ok) {
          throw new Error("Failed to fetch accounts from Google Analytics")
        }
        const gaAccountsWithProperties: GAAccountWithProperties[] = await accountsResponse.json()
        
        // Fetch all attached properties to check which ones are already used
        const attachedResponse = await fetch("/api/google-analytics/attached")
        if (!attachedResponse.ok) {
          throw new Error("Failed to fetch attached properties")
        }
        const attachedProperties: { name: string }[] = await attachedResponse.json()
        const attachedPropertySet = new Set(attachedProperties.map(p => p.name))
        
        // Mark properties as attached or available and set accounts to expanded by default
        const accountsWithMarkedProperties: GAAccountWithPropertiesOption[] = gaAccountsWithProperties.map(account => ({
          ...account,
          expanded: true, // Expand all accounts by default
          properties: account.properties.map(property => ({
            ...property,
            isAttached: attachedPropertySet.has(property.name),
            attachedInfo: attachedPropertySet.has(property.name) ? "Already attached to another project" : undefined
          }))
        }))
        
        setGaAccounts(accountsWithMarkedProperties)
        
        const totalProperties = accountsWithMarkedProperties.reduce((sum, acc) => sum + acc.properties.length, 0)
        
        if (totalProperties === 0) {
          setError("No properties found in your Google Analytics accounts")
        }
      } catch (err) {
        console.error("Error fetching accounts and properties:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch accounts and properties")
      } finally {
        setFetchingProperties(false)
      }
    }
    
    fetchAccountsAndProperties()
  }, [selectedType])

  // Fetch Google Search Console sites when Google Search Console is selected
  useEffect(() => {
    async function fetchSites() {
      if (selectedType !== "google_search_console") return
      
      setFetchingSites(true)
      setError(null)
      
      try {
        // Fetch available sites from Google Search Console
        const sitesResponse = await fetch("/api/google-search-console/sites")
        if (!sitesResponse.ok) {
          throw new Error("Failed to fetch sites from Google Search Console")
        }
        const gscSites: { siteUrl: string }[] = await sitesResponse.json()
        
        // Fetch all attached sites to check which ones are already used
        const attachedResponse = await fetch("/api/google-search-console/attached")
        if (!attachedResponse.ok) {
          throw new Error("Failed to fetch attached sites")
        }
        const attachedSites: { site_url: string }[] = await attachedResponse.json()
        const attachedSiteSet = new Set(attachedSites.map(s => s.site_url))
        
        // Mark sites as attached or available
        const siteOptions: SiteOption[] = gscSites.map(site => ({
          ...site,
          isAttached: attachedSiteSet.has(site.siteUrl),
          attachedInfo: attachedSiteSet.has(site.siteUrl) ? "Already attached to another project" : undefined
        }))
        
        setSites(siteOptions)
        
        if (siteOptions.length === 0) {
          setError("No sites found in your Google Search Console account")
        }
      } catch (err) {
        console.error("Error fetching sites:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch sites")
      } finally {
        setFetchingSites(false)
      }
    }
    
    fetchSites()
  }, [selectedType])

  // Check GBP auth status and fetch locations when GBP is selected
  useEffect(() => {
    async function checkAuthAndFetchLocations() {
      if (selectedType !== "gbp") return
      
      setGbpAuthStatus("checking")
      setError(null)
      
      try {
        console.log("[GBP UI] Checking authentication status")
        
        // Check if we have a refresh token
        const authStatusResponse = await fetch("/api/gbp/auth-status")
        if (!authStatusResponse.ok) {
          throw new Error("Failed to check GBP authentication status")
        }
        const { authenticated } = await authStatusResponse.json()
        
        console.log(`[GBP UI] Authentication status: ${authenticated}`)
        
        if (!authenticated) {
          setGbpAuthStatus("not_authenticated")
          return
        }
        
        setGbpAuthStatus("authenticated")
        
        // Fetch locations
        console.log("[GBP UI] Fetching locations")
        setFetchingGBPLocations(true)
        
        const locationsResponse = await fetch("/api/gbp/locations")
        if (!locationsResponse.ok) {
          throw new Error("Failed to fetch GBP locations")
        }
        const accountsWithLocations: GBPAccountWithLocations[] = await locationsResponse.json()
        
        // Fetch attached locations to check which ones are already used
        const attachedResponse = await fetch("/api/gbp/attached")
        if (!attachedResponse.ok) {
          throw new Error("Failed to fetch attached GBP locations")
        }
        const attachedLocations: { location_id: string }[] = await attachedResponse.json()
        const attachedLocationSet = new Set(attachedLocations.map(l => l.location_id))
        
        // Mark locations as attached or available and set accounts to expanded by default
        const accountsWithMarkedLocations: AccountWithLocations[] = accountsWithLocations.map(account => ({
          ...account,
          expanded: true, // Expand all accounts by default
          locations: account.locations.map(location => ({
            ...location,
            isAttached: attachedLocationSet.has(location.name),
            attachedInfo: attachedLocationSet.has(location.name) ? "Already attached to another project" : undefined
          }))
        }))
        
        setGbpAccounts(accountsWithMarkedLocations)
        
        const totalLocations = accountsWithMarkedLocations.reduce((sum, acc) => sum + acc.locations.length, 0)
        console.log(`[GBP UI] Found ${totalLocations} location(s)`)
        
        if (totalLocations === 0) {
          setError("No locations found in your Google Business Profile account")
        }
      } catch (err) {
        console.error("[GBP UI] Error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch GBP locations")
        setGbpAuthStatus("not_authenticated")
      } finally {
        setFetchingGBPLocations(false)
      }
    }
    
    checkAuthAndFetchLocations()
  }, [selectedType])

  // Check GMB auth status and fetch profiles when GMB is selected
  useEffect(() => {
    async function checkAuthAndFetchProfiles() {
      if (selectedType !== "gmb") return
      
      setGmbAuthStatus("checking")
      setError(null)
      
      try {
        console.log("[GMB UI] Checking authentication status")
        
        // Check if we have a refresh token
        const authStatusResponse = await fetch("/api/gmb/auth-status")
        if (!authStatusResponse.ok) {
          throw new Error("Failed to check GMB authentication status")
        }
        const { authenticated } = await authStatusResponse.json()
        
        console.log(`[GMB UI] Authentication status: ${authenticated}`)
        
        if (!authenticated) {
          // Automatically authenticate instead of asking user
          console.log("[GMB UI] Not authenticated, auto-authenticating...")
          setFetchingGMBProfiles(true) // Show loading state during auth
          
          // Auto-authenticate
          try {
            const authResponse = await fetch("/api/gmb/auth", {
              method: "POST"
            })
            
            if (!authResponse.ok) {
              const errorData = await authResponse.json()
              throw new Error(errorData.error || "Authentication failed")
            }
            
            console.log("[GMB UI] Auto-authentication successful")
            // Continue to fetch profiles after successful auth
          } catch (authError) {
            console.error("[GMB UI] Auto-authentication failed:", authError)
            setFetchingGMBProfiles(false) // Stop loading
            throw authError
          }
        }
        
        setGmbAuthStatus("authenticated")
        
        // Fetch profiles
        console.log("[GMB UI] Fetching profiles")
        setFetchingGMBProfiles(true)
        
        const profilesResponse = await fetch("/api/gmb/profiles")
        if (!profilesResponse.ok) {
          throw new Error("Failed to fetch GMB profiles")
        }
        const { profiles } = await profilesResponse.json()
        
        // Fetch attached profiles to check which ones are already used
        const attachedResponse = await fetch("/api/gmb/attached")
        if (!attachedResponse.ok) {
          throw new Error("Failed to fetch attached GMB profiles")
        }
        const { attachedProfileIds } = await attachedResponse.json()
        const attachedProfileSet = new Set(attachedProfileIds)
        
        // Mark profiles as attached or available
        const profileOptions: GMBProfileOption[] = profiles.map((profile: any) => ({
          _id: profile._id,
          businessName: profile.businessName,
          address: profile.address,
          rating: profile.rating,
          totalReviews: profile.totalReviews,
          gmbScore: profile.gmbScore,
          active: profile.active,
          isAttached: attachedProfileSet.has(profile._id),
          attachedInfo: attachedProfileSet.has(profile._id) ? "Already attached to another project" : undefined
        }))
        
        setGmbProfiles(profileOptions)
        
        console.log(`[GMB UI] Found ${profileOptions.length} profile(s)`)
        
        if (profileOptions.length === 0) {
          setError("No profiles found in your Grid My Business account")
        }
      } catch (err) {
        console.error("[GMB UI] Error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch GMB profiles")
        setGmbAuthStatus("not_authenticated")
      } finally {
        setFetchingGMBProfiles(false)
      }
    }
    
    checkAuthAndFetchProfiles()
  }, [selectedType])

  // Listen for OAuth success message from popup window
  useEffect(() => {
    function handleOAuthMessage(event: MessageEvent) {
      // Only handle messages from our OAuth callback
      if (event.data.type === 'GBP_AUTH_SUCCESS') {
        console.log("[GBP UI] OAuth successful, refetching locations")
        setInitiatingOAuth(false)
        setError(null)
        // Trigger refetch by changing selectedType temporarily
        setSelectedType("")
        setTimeout(() => setSelectedType("gbp"), 100)
      } else if (event.data.type === 'GBP_AUTH_ERROR') {
        console.error("[GBP UI] OAuth failed:", event.data.error)
        setInitiatingOAuth(false)
        setError(`Authorization failed: ${event.data.error}`)
      }
    }

    window.addEventListener('message', handleOAuthMessage)
    return () => window.removeEventListener('message', handleOAuthMessage)
  }, [])

  // Handle GBP OAuth
  async function handleGBPOAuth() {
    console.log("[GBP UI] Initiating OAuth flow")
    setInitiatingOAuth(true)
    setError(null)
    
    try {
      const response = await fetch("/api/gbp/auth-url")
      if (!response.ok) {
        throw new Error("Failed to generate authorization URL")
      }
      
      const { authUrl } = await response.json()
      console.log("[GBP UI] Opening authorization URL")
      
      // Open in new window
      window.open(authUrl, "_blank", "width=600,height=700")
      
      // Show message to user
      setError("Please complete the authorization in the new window. The window will close automatically when done.")
    } catch (err) {
      console.error("[GBP UI] OAuth error:", err)
      setError(err instanceof Error ? err.message : "Failed to start OAuth flow")
      setInitiatingOAuth(false)
    }
  }

  // Handle GMB Authentication
  async function handleGMBAuth() {
    console.log("[GMB UI] Initiating authentication")
    setInitiatingGMBAuth(true)
    setError(null)
    
    try {
      const response = await fetch("/api/gmb/auth", {
        method: "POST"
      })
      
      if (!response.ok) {
        throw new Error("Failed to authenticate with Grid My Business")
      }
      
      const result = await response.json()
      console.log("[GMB UI] Authentication successful")
      
      setError("Authentication successful! Refreshing profiles...")
      
      // Trigger refetch by changing selectedType temporarily
      setSelectedType("")
      setTimeout(() => setSelectedType("gmb"), 100)
    } catch (err) {
      console.error("[GMB UI] Authentication error:", err)
      setError(err instanceof Error ? err.message : "Failed to authenticate")
      setInitiatingGMBAuth(false)
    }
  }

  // Handle Semrush domain verification
  async function handleVerifyDomain() {
    if (!semrushDomain.trim()) {
      setError("Please enter a domain")
      return
    }

    setVerifyingDomain(true)
    setError(null)
    setDomainVerificationState({ verified: false, result: null, showResult: false })

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

      if (result.is_valid) {
        // Check if domain is already attached
        const attachedResponse = await fetch("/api/semrush/attached")
        let isAttached = false
        if (attachedResponse.ok) {
          const attachedDomains: { domain: string }[] = await attachedResponse.json()
          isAttached = attachedDomains.some(d => d.domain === result.domain)
        }
        
        if (isAttached) {
          setError("This domain is already attached to another project")
          setDomainVerificationState({ verified: false, result, showResult: true })
        } else {
          setDomainVerificationState({ verified: true, result, showResult: true })
        }
      } else {
        // Set error message based on what failed
        if (!result.syntax_valid) {
          setError("Invalid domain format. Please enter a valid domain (e.g., example.com)")
        } else if (!result.dns_resolves) {
          setError("Domain does not resolve via DNS. Please check the domain name.")
        } else {
          setError("Domain verification failed. Please try again.")
        }
        
        setDomainVerificationState({ verified: false, result, showResult: true })
      }
      
      setVerifyingDomain(false)
    } catch (err) {
      console.error("Error verifying domain:", err)
      setError(err instanceof Error ? err.message : "Failed to verify domain")
      setVerifyingDomain(false)
    }
  }

  // Filter domains based on search query
  const filteredDomains = useMemo(() => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) return domains
    
    const query = trimmedQuery.toLowerCase()
    return domains.filter(domain => 
      domain.domain.toLowerCase().includes(query) ||
      domain.location?.label.toLowerCase().includes(query)
    )
  }, [domains, searchQuery])

  // Filter sites based on search query
  const filteredSites = useMemo(() => {
    const trimmedQuery = siteSearchQuery.trim()
    if (!trimmedQuery) return sites
    
    const query = trimmedQuery.toLowerCase()
    return sites.filter(site => 
      site.siteUrl.toLowerCase().includes(query)
    )
  }, [sites, siteSearchQuery])

  // Filter GBP accounts and locations based on search query
  const filteredGBPAccounts = useMemo(() => {
    const trimmedQuery = gbpLocationSearchQuery.trim()
    if (!trimmedQuery) return gbpAccounts
    
    const query = trimmedQuery.toLowerCase()
    return gbpAccounts.map(account => ({
      ...account,
      locations: account.locations.filter(location => 
        location.locationName.toLowerCase().includes(query) ||
        location.name.toLowerCase().includes(query) ||
        location.address?.locality?.toLowerCase().includes(query) ||
        location.primaryCategory?.displayName?.toLowerCase().includes(query) ||
        account.accountName.toLowerCase().includes(query)
      )
    })).filter(account => account.locations.length > 0)
  }, [gbpAccounts, gbpLocationSearchQuery])
  
  const allGBPLocations = useMemo(() => flattenLocations(gbpAccounts), [gbpAccounts])
  
  // Toggle account expand/collapse
  function toggleAccountExpanded(accountName: string) {
    setGbpAccounts(prev => prev.map(acc => 
      acc.name === accountName ? { ...acc, expanded: !acc.expanded } : acc
    ))
  }
  
  // Count total locations
  const totalGBPLocations = useMemo(() => {
    return filteredGBPAccounts.reduce((sum, acc) => sum + acc.locations.length, 0)
  }, [filteredGBPAccounts])

  // Filter GMB profiles based on search query
  const filteredGMBProfiles = useMemo(() => {
    const trimmedQuery = gmbProfileSearchQuery.trim()
    if (!trimmedQuery) return gmbProfiles
    
    const query = trimmedQuery.toLowerCase()
    return gmbProfiles.filter(profile => 
      profile.businessName.toLowerCase().includes(query) ||
      profile.address?.toLowerCase().includes(query)
    )
  }, [gmbProfiles, gmbProfileSearchQuery])

  // Filter GA accounts and properties based on search query
  const filteredGAAccounts = useMemo(() => {
    const trimmedQuery = propertySearchQuery.trim()
    if (!trimmedQuery) return gaAccounts
    
    const query = trimmedQuery.toLowerCase()
    return gaAccounts.map(account => ({
      ...account,
      properties: account.properties.filter(property => 
        property.display_name.toLowerCase().includes(query) ||
        property.name.toLowerCase().includes(query) ||
        property.time_zone.toLowerCase().includes(query) ||
        account.accountName.toLowerCase().includes(query)
      )
    })).filter(account => account.properties.length > 0)
  }, [gaAccounts, propertySearchQuery])
  
  // Toggle GA account expand/collapse
  function toggleGAAccountExpanded(accountName: string) {
    setGaAccounts(prev => prev.map(acc => 
      acc.name === accountName ? { ...acc, expanded: !acc.expanded } : acc
    ))
  }
  
  // Count total properties
  const totalGAProperties = useMemo(() => {
    return filteredGAAccounts.reduce((sum, acc) => sum + acc.properties.length, 0)
  }, [filteredGAAccounts])

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
    if (selectedType === "semrush" && (!semrushDomain || !domainVerificationState.verified)) {
      setError("Please verify a domain before creating the datasource")
      return
    }

    // For GBP, require location selection
    if (selectedType === "gbp" && !selectedGBPLocation) {
      setError("Please select a location to attach")
      return
    }

    // For GMB, require profile selection
    if (selectedType === "gmb" && !selectedGMBProfile) {
      setError("Please select a profile to attach")
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
        // Find the property in all accounts
        let property: PropertyOption | undefined
        for (const account of gaAccounts) {
          property = account.properties.find((p: PropertyOption) => p.name === selectedProperty)
          if (property) break
        }
        
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
      if (selectedType === "semrush" && semrushDomain && domainVerificationState.verified) {
        await attachSemrushDomain(
          datasource.id,
          semrushDomain.trim().toLowerCase(),
          projectId
        )
      }

      // If Google Search Console, attach the selected site
      if (selectedType === "google_search_console" && selectedSite) {
        await attachGoogleSearchConsoleSite(
          datasource.id,
          selectedSite,
          projectId
        )
      }

      // If GBP, attach the selected location
      if (selectedType === "gbp" && selectedGBPLocation) {
        const location = allGBPLocations.find(l => l.name === selectedGBPLocation)
        if (location) {
          // Format address using the same function as display
          const formattedAddress = formatAddress(location.address) || null

          await attachGoogleBusinessProfileLocation(
            datasource.id,
            location.name,
            location.locationName,
            projectId,
            formattedAddress
          )
        }
      }

      // If GMB, attach the selected profile
      if (selectedType === "gmb" && selectedGMBProfile) {
        const profile = gmbProfiles.find(p => p._id === selectedGMBProfile)
        if (profile) {
          await attachGMBProfile(
            datasource.id,
            profile._id,
            profile.businessName,
            profile.address,
            projectId
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
    { value: "google_analytics", label: "Google Analytics", disabled: existingTypes.includes("google_analytics") },
    { value: "google_search_console", label: "Google Search Console", disabled: existingTypes.includes("google_search_console") },
    { value: "semrush", label: "Semrush", disabled: existingTypes.includes("semrush") },
    { value: "gbp", label: "Google Business Profile", disabled: existingTypes.includes("gbp") },
    { value: "gmb", label: "Grid My Business", disabled: existingTypes.includes("gmb") },
  ]

  const canSubmit = selectedType && 
    (selectedType !== "mangools" || selectedDomain) &&
    (selectedType !== "google_analytics" || selectedProperty) &&
    (selectedType !== "google_search_console" || selectedSite) &&
    (selectedType !== "semrush" || (semrushDomain && domainVerificationState.verified)) &&
    (selectedType !== "gbp" || selectedGBPLocation) &&
    (selectedType !== "gmb" || selectedGMBProfile)

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
                : selectedType === "google_search_console"
                ? "Select a site from your Google Search Console account. Note: Each site can only be attached once, and each project can have only one Google Search Console data source."
                : selectedType === "semrush"
                ? "Enter a domain to track with Semrush. We'll verify the domain before adding it. Note: Each domain can only be attached once, and each project can have only one Semrush data source."
                : selectedType === "gbp"
                ? "Select a location from your Google Business Profile account. Note: Each location can only be attached once, and each project can have only one Google Business Profile data source."
                : selectedType === "gmb"
                ? "Select a profile from your Grid My Business account. Note: Each profile can only be attached once, and each project can have only one Grid My Business data source."
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
                onValueChange={(value) => setSelectedType(value as "mangools" | "semrush" | "google_analytics" | "google_search_console" | "gbp" | "gmb")}
                disabled={loading || fetchingDomains || fetchingProperties || fetchingSites || fetchingGBPLocations || fetchingGMBProfiles}
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
                          placeholder="Search by property name, account..."
                          value={propertySearchQuery}
                          onChange={(e) => setPropertySearchQuery(e.target.value)}
                          className="pl-8 h-9 text-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Accounts and Properties List */}
                    <div className="grid gap-1.5">
                      <Label className="text-xs sm:text-sm">Available Properties ({totalGAProperties})</Label>
                      <div className="border rounded-lg max-h-[400px] sm:max-h-[450px] overflow-y-auto">
                        {filteredGAAccounts.length === 0 ? (
                          <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
                            {propertySearchQuery ? "No properties match your search" : "No properties available"}
                          </div>
                        ) : (
                          <div className="divide-y">
                            {filteredGAAccounts.map((account) => (
                              <div key={account.name} className="bg-background">
                                {/* Account Header */}
                                <button
                                  type="button"
                                  onClick={() => toggleGAAccountExpanded(account.name)}
                                  className="w-full flex items-center gap-2 p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                                >
                                  {account.expanded ? (
                                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                  )}
                                  <div className="flex-1 text-left">
                                    <p className="font-semibold text-xs sm:text-sm">
                                      {account.accountName}
                                    </p>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {account.properties.length} propert{account.properties.length !== 1 ? 'ies' : 'y'}
                                  </span>
                                </button>
                                
                                {/* Properties under this account */}
                                {account.expanded && (
                                  <div className="bg-muted/20 divide-y divide-muted">
                                    {account.properties.map((property) => (
                                      <label
                                        key={property.name}
                                        className={`flex items-start gap-2 sm:gap-3 p-3 pl-10 cursor-pointer hover:bg-muted/50 transition-colors ${
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
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Google Search Console Site Selection */}
            {selectedType === "google_search_console" && (
              <>
                {fetchingSites ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center py-6 sm:py-8 gap-2 sm:gap-3">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground text-center">
                      Loading sites from Google Search Console...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="grid gap-1.5">
                      <Label htmlFor="site-search" className="text-xs sm:text-sm">Search Sites</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                          id="site-search"
                          type="text"
                          placeholder="Search by site URL..."
                          value={siteSearchQuery}
                          onChange={(e) => setSiteSearchQuery(e.target.value)}
                          className="pl-8 h-9 text-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Site List */}
                    <div className="grid gap-1.5">
                      <Label className="text-xs sm:text-sm">Available Sites ({filteredSites.length})</Label>
                      <div className="border rounded-lg max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                        {filteredSites.length === 0 ? (
                          <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
                            {siteSearchQuery ? "No sites match your search" : "No sites available"}
                          </div>
                        ) : (
                          <div className="divide-y">
                            {filteredSites.map((site) => (
                              <label
                                key={site.siteUrl}
                                className={`flex items-start gap-2 sm:gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                                  site.isAttached ? "opacity-50 cursor-not-allowed" : ""
                                } ${selectedSite === site.siteUrl ? "bg-muted" : ""}`}
                              >
                                <input
                                  type="radio"
                                  name="site"
                                  value={site.siteUrl}
                                  checked={selectedSite === site.siteUrl}
                                  onChange={(e) => setSelectedSite(e.target.value)}
                                  disabled={site.isAttached || loading}
                                  className="mt-1 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-xs sm:text-sm truncate">
                                      {site.siteUrl}
                                    </p>
                                    {site.isAttached && (
                                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                                    )}
                                    {selectedSite === site.siteUrl && !site.isAttached && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  {site.isAttached && (
                                    <p className="text-[11px] sm:text-xs text-yellow-600 mt-1">
                                      {site.attachedInfo}
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

            {/* GBP Location Selection */}
            {selectedType === "gbp" && (
              <>
                {gbpAuthStatus === "checking" ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center py-6 sm:py-8 gap-2 sm:gap-3">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground text-center">
                      Checking authentication status...
                    </span>
                  </div>
                ) : gbpAuthStatus === "not_authenticated" ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 text-xs sm:text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Authorization Required</p>
                        <p className="mt-1">Please authorize this application to access your Google Business Profile. Click the button below to sign in with the Google account that has access to your business profiles.</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleGBPOAuth}
                      disabled={initiatingOAuth}
                      className="w-full"
                      variant="default"
                    >
                      {initiatingOAuth ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Opening authorization...
                        </>
                      ) : (
                        "Authorize Google Business Profile"
                      )}
                    </Button>
                  </div>
                ) : fetchingGBPLocations ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center py-6 sm:py-8 gap-2 sm:gap-3">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground text-center">
                      Loading locations from Google Business Profile...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="grid gap-1.5">
                      <Label htmlFor="gbp-location-search" className="text-xs sm:text-sm">Search Locations</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                          id="gbp-location-search"
                          type="text"
                          placeholder="Search by business name, location..."
                          value={gbpLocationSearchQuery}
                          onChange={(e) => setGbpLocationSearchQuery(e.target.value)}
                          className="pl-8 h-9 text-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Accounts and Locations List */}
                    <div className="grid gap-1.5">
                      <Label className="text-xs sm:text-sm">Available Locations ({totalGBPLocations})</Label>
                      <div className="border rounded-lg max-h-[400px] sm:max-h-[450px] overflow-y-auto">
                        {filteredGBPAccounts.length === 0 ? (
                          <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
                            {gbpLocationSearchQuery ? "No locations match your search" : "No locations available"}
                          </div>
                        ) : (
                          <div className="divide-y">
                            {filteredGBPAccounts.map((account) => (
                              <div key={account.name} className="bg-background">
                                {/* Account Header */}
                                <button
                                  type="button"
                                  onClick={() => toggleAccountExpanded(account.name)}
                                  className="w-full flex items-center gap-2 p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                                >
                                  {account.expanded ? (
                                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                  )}
                                  <div className="flex-1 text-left">
                                    <p className="font-semibold text-xs sm:text-sm">
                                      {account.accountName}
                                    </p>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {account.locations.length} location{account.locations.length !== 1 ? 's' : ''}
                                  </span>
                                </button>
                                
                                {/* Locations under this account */}
                                {account.expanded && (
                                  <div className="bg-muted/20 divide-y divide-muted">
                                    {account.locations.map((loc) => {
                                      const location = loc as LocationOption
                                      const formattedAddress = formatAddress(location.address)
                                      return (
                                        <label
                                          key={location.name}
                                          className={`flex items-start gap-2 sm:gap-3 p-3 pl-10 cursor-pointer hover:bg-muted/50 transition-colors ${
                                            location.isAttached ? "opacity-50 cursor-not-allowed" : ""
                                          } ${selectedGBPLocation === location.name ? "bg-muted" : ""}`}
                                        >
                                          <input
                                            type="radio"
                                            name="gbp-location"
                                            value={location.name}
                                            checked={selectedGBPLocation === location.name}
                                            onChange={(e) => setSelectedGBPLocation(e.target.value)}
                                            disabled={location.isAttached || loading}
                                            className="mt-1 flex-shrink-0"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <p className="font-medium text-xs sm:text-sm">
                                                {location.locationName || "(No Name)"}
                                              </p>
                                              {location.isAttached && (
                                                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                                              )}
                                              {selectedGBPLocation === location.name && !location.isAttached && (
                                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                              )}
                                            </div>
                                            
                                            {/* Location Details */}
                                            <div className="space-y-1 text-[11px] text-muted-foreground">
                                              {location.primaryCategory && (
                                                <div>🏷️ {location.primaryCategory.displayName}</div>
                                              )}
                                              {formattedAddress && (
                                                <div>📍 {formattedAddress}</div>
                                              )}
                                              {location.websiteUrl && (
                                                <div className="truncate">🌐 {location.websiteUrl}</div>
                                              )}
                                            </div>
                                            
                                            {location.isAttached && (
                                              <p className="text-[11px] sm:text-xs text-yellow-600 mt-2">
                                                {location.attachedInfo}
                                              </p>
                                            )}
                                          </div>
                                        </label>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* GMB Profile Selection */}
            {selectedType === "gmb" && (
              <>
                {(gmbAuthStatus === "checking" || gmbAuthStatus === "not_authenticated") && !error ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center py-6 sm:py-8 gap-2 sm:gap-3">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground text-center">
                      Authenticating and loading profiles...
                    </span>
                  </div>
                ) : error && (gmbAuthStatus === "checking" || gmbAuthStatus === "not_authenticated") ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">Authentication Failed</p>
                        <p className="mt-1">{error}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setError(null)
                        setGmbAuthStatus("checking")
                        // Trigger refetch by temporarily changing type
                        const currentType = selectedType
                        setSelectedType("")
                        setTimeout(() => setSelectedType(currentType as any), 100)
                      }}
                      className="w-full"
                      variant="default"
                    >
                      Retry Authentication
                    </Button>
                  </div>
                ) : fetchingGMBProfiles ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center py-6 sm:py-8 gap-2 sm:gap-3">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground text-center">
                      Loading profiles from Grid My Business...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="grid gap-1.5">
                      <Label htmlFor="gmb-profile-search" className="text-xs sm:text-sm">Search Profiles</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                          id="gmb-profile-search"
                          type="text"
                          placeholder="Search by business name, address..."
                          value={gmbProfileSearchQuery}
                          onChange={(e) => setGmbProfileSearchQuery(e.target.value)}
                          className="pl-8 h-9 text-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Profile List */}
                    <div className="grid gap-1.5">
                      <Label className="text-xs sm:text-sm">Available Profiles ({filteredGMBProfiles.length})</Label>
                      <div className="border rounded-lg max-h-[400px] sm:max-h-[450px] overflow-y-auto">
                        {filteredGMBProfiles.length === 0 ? (
                          <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
                            {gmbProfileSearchQuery ? "No profiles match your search" : "No profiles available"}
                          </div>
                        ) : (
                          <div className="divide-y">
                            {filteredGMBProfiles.map((profile) => (
                              <label
                                key={profile._id}
                                className={`flex items-start gap-2 sm:gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                                  profile.isAttached ? "opacity-50 cursor-not-allowed" : ""
                                } ${selectedGMBProfile === profile._id ? "bg-muted" : ""}`}
                              >
                                <input
                                  type="radio"
                                  name="gmb-profile"
                                  value={profile._id}
                                  checked={selectedGMBProfile === profile._id}
                                  onChange={(e) => setSelectedGMBProfile(e.target.value)}
                                  disabled={profile.isAttached || loading}
                                  className="mt-1 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-xs sm:text-sm">
                                      {profile.businessName}
                                    </p>
                                    {profile.isAttached && (
                                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                                    )}
                                    {selectedGMBProfile === profile._id && !profile.isAttached && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  
                                  {/* Profile Details */}
                                  <div className="space-y-1 text-[11px] text-muted-foreground">
                                    {profile.address && (
                                      <div>📍 {profile.address}</div>
                                    )}
                                    {profile.rating !== null && profile.rating !== undefined && (
                                      <div>⭐ Rating: {profile.rating} ({profile.totalReviews || 0} reviews)</div>
                                    )}
                                    {profile.gmbScore !== null && profile.gmbScore !== undefined && (
                                      <div>📊 GMB Score: {profile.gmbScore.toFixed(1)}</div>
                                    )}
                                    {!profile.active && (
                                      <div className="text-orange-600">⚠️ Profile is inactive</div>
                                    )}
                                  </div>
                                  
                                  {profile.isAttached && (
                                    <p className="text-[11px] sm:text-xs text-yellow-600 mt-2">
                                      {profile.attachedInfo}
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
                        setDomainVerificationState({ verified: false, result: null, showResult: false })
                        setError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && semrushDomain.trim() && !verifyingDomain) {
                          e.preventDefault()
                          handleVerifyDomain()
                        }
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
                {domainVerificationState.showResult && domainVerificationState.result && (
                  <div className={`flex items-start gap-2 p-3 text-xs sm:text-sm rounded-lg border transition-colors ${
                    domainVerificationState.verified 
                      ? "text-green-700 bg-green-50 border-green-200" 
                      : "text-red-700 bg-red-50 border-red-200"
                  }`}>
                    {domainVerificationState.verified ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="space-y-1">
                      <p className="font-medium">
                        {domainVerificationState.verified ? "Domain verified successfully!" : "Domain verification failed"}
                      </p>
                      <div className="text-[11px] space-y-0.5">
                        <p>✓ Syntax: {domainVerificationState.result.syntax_valid ? "Valid" : "Invalid"}</p>
                        <p>✓ DNS: {domainVerificationState.result.dns_resolves ? "Resolves" : "Does not resolve"}</p>
                        <p>✓ HTTP: {domainVerificationState.result.http_reachable ? "Reachable" : "Not reachable"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Error Message - Only show if not GMB auth error (which shows inline) */}
            {error && !(selectedType === "gmb" && (gmbAuthStatus === "checking" || gmbAuthStatus === "not_authenticated")) && (
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
            <Button type="submit" disabled={loading || fetchingDomains || fetchingProperties || fetchingSites || fetchingGBPLocations || verifyingDomain || initiatingOAuth || !canSubmit} className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none touch-manipulation">
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
