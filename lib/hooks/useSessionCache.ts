import { useState, useEffect, useCallback, useRef } from "react"

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface UseSessionCacheOptions {
  /**
   * Time to live in milliseconds. If provided, cache will expire after this duration.
   * Default: no expiration (cache lives until tab is closed or manually cleared)
   */
  ttl?: number
  /**
   * Whether to clear the cache for this key on mount (e.g., when page refreshes)
   * Default: false
   */
  clearOnMount?: boolean
}

/**
 * Custom hook for caching data in session storage
 * 
 * Features:
 * - Tab-specific caching (session storage)
 * - Automatic cache invalidation on page refresh (optional)
 * - TTL support for cache expiration
 * - Type-safe cache operations
 * 
 * @param cacheKey Unique key to identify this cache entry
 * @param options Configuration options
 */
export function useSessionCache<T = any>(
  cacheKey: string,
  options: UseSessionCacheOptions = {}
) {
  const { ttl, clearOnMount = false } = options
  const [cachedData, setCachedData] = useState<T | null>(null)
  const [isCacheValid, setIsCacheValid] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const hasMounted = useRef(false)

  // Get full storage key with prefix to avoid collisions
  const getStorageKey = useCallback(() => {
    return `seo_cache:${cacheKey}`
  }, [cacheKey])

  // Read from cache
  const readCache = useCallback((): T | null => {
    if (typeof window === 'undefined') return null

    try {
      const storageKey = getStorageKey()
      const cached = sessionStorage.getItem(storageKey)
      
      if (!cached) return null

      const entry: CacheEntry<T> = JSON.parse(cached)
      
      // Check if TTL has expired
      if (ttl && Date.now() - entry.timestamp > ttl) {
        sessionStorage.removeItem(storageKey)
        return null
      }

      return entry.data
    } catch (error) {
      console.error('Error reading from session cache:', error)
      return null
    }
  }, [getStorageKey, ttl])

  // Write to cache
  const writeCache = useCallback((data: T) => {
    if (typeof window === 'undefined') return

    try {
      const storageKey = getStorageKey()
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now()
      }
      sessionStorage.setItem(storageKey, JSON.stringify(entry))
      console.log(`[Storage] 💾 ${storageKey.replace('seo_cache:', '')}`)
      setCachedData(data)
      setIsCacheValid(true)
    } catch (error) {
      console.error('[Storage] ❌ Write error:', error)
    }
  }, [getStorageKey])

  // Clear cache for this key
  const clearCache = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const storageKey = getStorageKey()
      sessionStorage.removeItem(storageKey)
      console.log(`[Storage] 🗑️ ${storageKey.replace('seo_cache:', '')}`)
      setCachedData(null)
      setIsCacheValid(false)
    } catch (error) {
      console.error('[Storage] ❌ Clear error:', error)
    }
  }, [getStorageKey])

  // Initialize cache on mount
  useEffect(() => {
    if (hasMounted.current) return
    hasMounted.current = true

    // Clear cache on mount if requested (for page refresh behavior)
    if (clearOnMount) {
      console.log(`[Storage] 🔄 Clear on mount`)
      clearCache()
      setIsInitialized(true)
      return
    }

    // Try to read existing cache
    const data = readCache()
    if (data !== null) {
      console.log(`[Storage] ✅ Found cache`)
      setCachedData(data)
      setIsCacheValid(true)
    }
    setIsInitialized(true)
  }, [clearOnMount, clearCache, readCache])

  return {
    /**
     * The cached data if available
     */
    cachedData,
    /**
     * Whether valid cache exists for this key
     */
    isCacheValid,
    /**
     * Whether the cache initialization is complete
     */
    isInitialized,
    /**
     * Write data to cache
     */
    writeCache,
    /**
     * Clear cache for this key
     */
    clearCache,
    /**
     * Read fresh data from cache (useful for manual checks)
     */
    readCache
  }
}

/**
 * Utility function to clear all caches matching a pattern
 * Useful for clearing all dashboard caches or all report caches
 * 
 * @param pattern RegExp or string to match against cache keys
 */
export function clearCachePattern(pattern: string | RegExp) {
  if (typeof window === 'undefined') return

  try {
    const keys = Object.keys(sessionStorage)
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    
    keys.forEach(key => {
      if (regex.test(key)) {
        sessionStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Error clearing cache pattern:', error)
  }
}

/**
 * Utility function to get cache statistics
 * Useful for debugging
 */
export function getCacheStats() {
  if (typeof window === 'undefined') return { count: 0, size: 0 }

  try {
    const keys = Object.keys(sessionStorage).filter(key => key.startsWith('seo_cache:'))
    let totalSize = 0
    
    keys.forEach(key => {
      const value = sessionStorage.getItem(key)
      if (value) {
        totalSize += value.length
      }
    })

    return {
      count: keys.length,
      size: totalSize,
      sizeKB: (totalSize / 1024).toFixed(2)
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return { count: 0, size: 0, sizeKB: '0.00' }
  }
}
