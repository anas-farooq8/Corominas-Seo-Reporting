"use client"

import { useEffect, useRef, useState } from "react"

interface GMBInteractiveMapProps {
  centerLat: number
  centerLng: number
  markers: Array<{
    lat: number
    lng: number
    position: number
  }>
  gridBounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  gridSize?: number
  radius?: number
}

/**
 * Get heatmap color based on position
 */
function getHeatmapColor(position: number): { background: string; text: string } {
  if (position <= 3) return { background: '#22c55e', text: '#ffffff' } // Green
  if (position <= 10) return { background: '#eab308', text: '#ffffff' } // Yellow
  if (position <= 20) return { background: '#f97316', text: '#ffffff' } // Orange
  return { background: '#ef4444', text: '#ffffff' } // Red (20+)
}

// Global state for Google Maps script loading
declare global {
  interface Window {
    googleMapsLoadPromise?: Promise<void>
    google?: any
  }
}

/**
 * Load Google Maps script only once globally
 */
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window.google !== 'undefined' && window.google.maps) {
    return Promise.resolve()
  }

  if (window.googleMapsLoadPromise) {
    return window.googleMapsLoadPromise
  }

  const existingScript = document.querySelector(
    'script[src*="maps.googleapis.com/maps/api/js"]'
  )
  
  if (existingScript) {
    window.googleMapsLoadPromise = new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (typeof window.google !== 'undefined' && window.google.maps) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
      
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error('Timeout waiting for Google Maps to load'))
      }, 10000)
    })
    return window.googleMapsLoadPromise
  }

  window.googleMapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`
    script.async = true
    script.defer = true
    
    script.onload = () => resolve()
    script.onerror = () => {
      window.googleMapsLoadPromise = undefined
      reject(new Error('Failed to load Google Maps script'))
    }
    document.head.appendChild(script)
  })

  return window.googleMapsLoadPromise
}

export function GMBInteractiveMap({
  centerLat,
  centerLng,
  markers,
  gridBounds,
  gridSize = 3,
  radius = 1
}: GMBInteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const rectangleRef = useRef<google.maps.Rectangle | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Debug logging
  useEffect(() => {
    console.log('[GMBInteractiveMap] Props:', {
      centerLat,
      centerLng,
      markersCount: markers.length,
      gridSize,
      hasGridBounds: !!gridBounds
    })
  }, [centerLat, centerLng, markers.length, gridSize, gridBounds])
  
  // Calculate zoom level based on grid size, radius, and screen size
  const getZoomLevel = (size: number, radiusKm: number = 1): number => {
    // Check if mobile (adjust zoom for smaller screens)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const mobileOffset = isMobile ? -1 : 0 // Zoom out more on mobile for better view
    
    // Base zoom on radius (adjusted for better view)
    if (radiusKm <= 1) return 14 + mobileOffset
    if (radiusKm <= 2) return 13 + mobileOffset
    if (radiusKm <= 5) return 12 + mobileOffset
    if (radiusKm <= 10) return 11 + mobileOffset
    return 10 + mobileOffset
  }

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      setError('Google Maps API key not configured')
      setIsLoading(false)
      return
    }

    async function initMap() {
      try {
        await loadGoogleMapsScript(apiKey!)
        
        if (!mapRef.current) return

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: getZoomLevel(gridSize, radius),
          mapTypeId: 'roadmap',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false, // Remove zoom controls (user can scroll to zoom)
          gestureHandling: 'greedy'
        })

        mapInstanceRef.current = map

        // Draw grid outline with light blue background (passes through center of pins)
        if (gridBounds) {
          const rectangle = new google.maps.Rectangle({
            strokeColor: '#bfdbfe', // Match the fill color (no red outline)
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: '#bfdbfe', // Light blue fill
            fillOpacity: 0.35, // More visible
            map,
            bounds: gridBounds,
            clickable: false, // Don't interfere with map interactions
            zIndex: 1 // Behind markers
          })
          rectangleRef.current = rectangle
        }

        // Add markers as rounded location pins (shorter, rounder style)
        const newMarkers: google.maps.Marker[] = []

        for (const marker of markers) {
          const colors = getHeatmapColor(marker.position)
          const label = marker.position <= 20 ? marker.position.toString() : '20+'
          
          // Shorter, rounder pin path (not too elongated)
          const pinPath = "M 0,0 C -2,-12 -8,-15 -8,-20 A 8,8 0 1,1 8,-20 C 8,-15 2,-12 0,0 z"
          
          const googleMarker = new google.maps.Marker({
            map,
            position: { lat: marker.lat, lng: marker.lng },
            title: `Position: ${marker.position}`,
            label: {
              text: label,
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 'bold'
            },
            icon: {
              path: pinPath,
              fillColor: colors.background,
              fillOpacity: 1,
              strokeWeight: 0, // No outline
              scale: 2.0,
              anchor: new google.maps.Point(0, 0), // Anchor at bottom point
              labelOrigin: new google.maps.Point(0, -20) // Center label in circle
            }
          })

          newMarkers.push(googleMarker)
        }

        markersRef.current = newMarkers
        setIsLoading(false)
      } catch (err: unknown) {
        console.error('Error loading Google Maps:', err)
        setError('Failed to load map')
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null))
      rectangleRef.current?.setMap(null)
      mapInstanceRef.current = null
    }
  }, [centerLat, centerLng, markers, gridBounds, gridSize])

  if (error) {
    console.error('[GMBInteractiveMap] Error:', error)
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg border">
        <div className="text-center max-w-md p-6">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">{error}</p>
          <p className="text-xs text-muted-foreground">
            Check your Google Maps API configuration.
          </p>
        </div>
      </div>
    )
  }
  
  // Check for invalid coordinates
  if (!centerLat || !centerLng || isNaN(centerLat) || isNaN(centerLng)) {
    console.error('[GMBInteractiveMap] Invalid center coordinates:', { centerLat, centerLng })
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg border">
        <div className="text-center max-w-md p-6">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Invalid Map Coordinates</p>
          <p className="text-xs text-muted-foreground">
            Center: {centerLat}, {centerLng}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg border z-10">
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg border overflow-hidden"
        style={{ minHeight: '350px' }}
      />
    </div>
  )
}
