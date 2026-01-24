import { useState, useEffect, useCallback, useRef } from "react"
import { useSessionCache } from "./useSessionCache"

interface UseCachedFetchOptions {
  /**
   * Whether to clear cache on mount (page refresh)
   * Set to true for the active page to refresh its data
   * Default: false
   */
  clearOnMount?: boolean
  /**
   * Time to live in milliseconds
   * Default: no expiration
   */
  ttl?: number
  /**
   * Whether to fetch immediately on mount
   * Default: true
   */
  enabled?: boolean
}

interface UseCachedFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearCache: () => void
  isFromCache: boolean
}

/**
 * Hook for fetching data with session storage caching
 * 
 * @param url The API endpoint to fetch from (can be null to disable fetching)
 * @param cacheKey Unique cache key for this data
 * @param options Configuration options
 */
export function useCachedFetch<T = any>(
  url: string | null,
  cacheKey: string,
  options: UseCachedFetchOptions = {}
): UseCachedFetchResult<T> {
  const { clearOnMount = false, ttl, enabled = true } = options
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const hasInitialized = useRef(false)

  // Skip if URL is null or contains "undefined"
  const shouldSkip = !url || !enabled || url.includes('undefined')

  const {
    cachedData,
    isCacheValid,
    isInitialized,
    writeCache,
    clearCache: clearSessionCache
  } = useSessionCache<T>(cacheKey, { clearOnMount, ttl })

  const fetchData = useCallback(async () => {
    if (shouldSkip) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log(`[Cache] 🔄 Fetching: ${cacheKey}`)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Save to cache
      writeCache(result)
      console.log(`[Cache] ✅ Saved: ${cacheKey}`)
      setData(result)
      setIsFromCache(false)
    } catch (err) {
      console.error(`[Cache] ❌ Error: ${cacheKey}`, err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [shouldSkip, url, writeCache, cacheKey])

  // Initialize on mount - wait for cache check to complete
  useEffect(() => {
    if (hasInitialized.current) return

    if (shouldSkip) {
      setLoading(false)
      hasInitialized.current = true
      return
    }

    // Wait for useSessionCache to complete initialization
    if (!isInitialized) {
      return
    }

    // Now we can make a decision based on cache state
    if (isCacheValid && cachedData !== null) {
      console.log(`[Cache] ⚡ Using cache: ${cacheKey}`)
      setData(cachedData)
      setIsFromCache(true)
      setLoading(false)
      hasInitialized.current = true
    } else {
      // Cache miss or expired - fetch fresh data
      console.log(`[Cache] 🔍 Cache miss: ${cacheKey}`)
      fetchData()
      hasInitialized.current = true
    }
  }, [shouldSkip, isInitialized, isCacheValid, cachedData, cacheKey, fetchData])

  const clearCache = useCallback(() => {
    clearSessionCache()
    setData(null)
    setIsFromCache(false)
    hasInitialized.current = false // Reset init flag
  }, [clearSessionCache])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
    isFromCache
  }
}

/**
 * Hook for fetching multiple endpoints with caching
 * Returns combined loading and error states
 */
export function useCachedMultiFetch<T extends Record<string, any>>(
  endpoints: Array<{
    key: keyof T
    url: string | null
    cacheKey: string
    clearOnMount?: boolean
  }>,
  options: { enabled?: boolean } = {}
): {
  data: Partial<T>
  loading: boolean
  error: string | null
  refetchAll: () => Promise<void>
  clearAllCache: () => void
  isFromCache: Record<keyof T, boolean>
} {
  const { enabled = true } = options
  
  const [combinedData, setCombinedData] = useState<Partial<T>>({})
  const [combinedLoading, setCombinedLoading] = useState(true)
  const [combinedError, setCombinedError] = useState<string | null>(null)
  const [cacheFlags, setCacheFlags] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)

  // Create individual fetchers for each endpoint
  const fetchers = endpoints.map(endpoint => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCachedFetch(
      endpoint.url,
      endpoint.cacheKey,
      { 
        clearOnMount: endpoint.clearOnMount,
        enabled 
      }
    )
  })

  // Combine results
  useEffect(() => {
    const allLoaded = fetchers.every(f => !f.loading)
    const anyError = fetchers.find(f => f.error)
    
    setCombinedLoading(!allLoaded)
    setCombinedError(anyError?.error || null)

    if (allLoaded) {
      const newData: Partial<T> = {}
      const newCacheFlags: Record<keyof T, boolean> = {} as Record<keyof T, boolean>
      
      endpoints.forEach((endpoint, idx) => {
        newData[endpoint.key] = fetchers[idx].data
        newCacheFlags[endpoint.key] = fetchers[idx].isFromCache
      })
      
      setCombinedData(newData)
      setCacheFlags(newCacheFlags)
    }
  }, [fetchers, endpoints])

  const refetchAll = useCallback(async () => {
    await Promise.all(fetchers.map(f => f.refetch()))
  }, [fetchers])

  const clearAllCache = useCallback(() => {
    fetchers.forEach(f => f.clearCache())
  }, [fetchers])

  return {
    data: combinedData,
    loading: combinedLoading,
    error: combinedError,
    refetchAll,
    clearAllCache,
    isFromCache: cacheFlags
  }
}
