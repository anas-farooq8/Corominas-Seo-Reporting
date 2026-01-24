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
 * Get heatmap color based on position with gradient
 * Uses smooth color transition from green (1) to red (20+)
 */
function getHeatmapColor(position: number): { background: string; text: string } {
  // Clamp position to max 21 for color calculation
  const pos = Math.min(position, 21)
  
  // Use gradient from green (1) through yellow (7-8) to orange (12-14) to red (20+)
  let r: number, g: number, b: number
  
  if (pos <= 3) {
    // Green range (1-3)
    const t = (pos - 1) / 2 // 0 to 1
    r = Math.round(34 + t * 100)  // 34 to 134
    g = Math.round(197 - t * 10)  // 197 to 187
    b = Math.round(94 - t * 20)   // 94 to 74
  } else if (pos <= 10) {
    // Green to Yellow range (4-10)
    const t = (pos - 3) / 7 // 0 to 1
    r = Math.round(134 + t * 100) // 134 to 234
    g = Math.round(187 - t * 8)   // 187 to 179
    b = Math.round(74 - t * 66)   // 74 to 8
  } else if (pos <= 20) {
    // Yellow/Orange to Red range (11-20)
    const t = (pos - 10) / 10 // 0 to 1
    r = Math.round(234 + t * 5)   // 234 to 239
    g = Math.round(179 - t * 95)  // 179 to 84
    b = Math.round(8)             // Stay at 8
  } else {
    // Deep red for 20+
    r = 239
    g = 68
    b = 68
  }
  
  const background = `rgb(${r}, ${g}, ${b})`
  return { background, text: '#ffffff' }
}

// Global state for Google Maps script loading
declare global {
  interface Window {
    googleMapsLoadPromise?: Promise<void>
    initGoogleMaps?: () => void
    google?: any
  }
}

/**
 * Load Google Maps script only once globally with callback support for loading=async
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
    // Set up callback before loading script
    window.initGoogleMaps = () => {
      resolve()
      delete window.initGoogleMaps
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=marker&v=weekly&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    
    script.onerror = () => {
      window.googleMapsLoadPromise = undefined
      delete window.initGoogleMaps
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
  const markersRef = useRef<any[]>([])
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
          zoomControl: false,
          gestureHandling: 'greedy',
          mapId: 'DEMO_MAP_ID' // Required for AdvancedMarkerElement
        })

        mapInstanceRef.current = map

        // Draw grid outline with light blue background
        if (gridBounds) {
          const rectangle = new google.maps.Rectangle({
            strokeColor: '#bfdbfe',
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: '#bfdbfe',
            fillOpacity: 0.35,
            map,
            bounds: gridBounds,
            clickable: false,
            zIndex: 1
          })
          rectangleRef.current = rectangle
        }

        // Add markers using AdvancedMarkerElement
        const newMarkers: any[] = []
        const useAdvancedMarkers = window.google?.maps?.marker?.AdvancedMarkerElement

        for (const marker of markers) {
          const colors = getHeatmapColor(marker.position)
          const label = marker.position <= 20 ? marker.position.toString() : '20+'
          
          if (useAdvancedMarkers) {
            // Create simple circular marker
            const markerContent = document.createElement('div')
            markerContent.style.cssText = `
              width: 36px;
              height: 36px;
              background-color: ${colors.background};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              cursor: pointer;
            `
            
            // Add label text
            const labelDiv = document.createElement('div')
            labelDiv.textContent = label
            labelDiv.style.cssText = `
              color: ${colors.text};
              font-size: 13px;
              font-weight: bold;
              line-height: 1;
            `
            markerContent.appendChild(labelDiv)
            
            const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
              map,
              position: { lat: marker.lat, lng: marker.lng },
              content: markerContent,
              title: `Position: ${marker.position}`
            })

            newMarkers.push(advancedMarker)
          } else {
            // Fallback to old Marker API - use circle
            const googleMarker = new google.maps.Marker({
              map,
              position: { lat: marker.lat, lng: marker.lng },
              title: `Position: ${marker.position}`,
              label: {
                text: label,
                color: colors.text,
                fontSize: '13px',
                fontWeight: 'bold'
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: colors.background,
                fillOpacity: 1,
                strokeColor: colors.background,
                strokeWeight: 0,
                scale: 18,
                anchor: new google.maps.Point(0, 0),
                labelOrigin: new google.maps.Point(0, 0)
              }
            })

            newMarkers.push(googleMarker)
          }
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
      markersRef.current.forEach(marker => {
        if (marker.map !== undefined) {
          // AdvancedMarkerElement
          marker.map = null
        } else if (marker.setMap) {
          // Old Marker API
          marker.setMap(null)
        }
      })
      rectangleRef.current?.setMap(null)
      mapInstanceRef.current = null
    }
  }, [centerLat, centerLng, markers, gridBounds, gridSize, radius])

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
