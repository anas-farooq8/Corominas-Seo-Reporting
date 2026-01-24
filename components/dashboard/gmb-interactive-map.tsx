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
function getHeatmapColor(
  position: number
): { background: string; text: string } {
  const pos = Math.max(1, position)

  let r: number, g: number, b: number

  if (pos <= 6) {
    // COOL green → emerald → light green
    const t = (pos - 1) / 5
    r = Math.round(26 + t * (106 - 26))
    g = Math.round(188 + t * (223 - 188))
    b = Math.round(156 + t * (138 - 156))

  } else if (pos <= 9) {
    // Yellow
    const t = (pos - 6) / 3
    r = 241
    g = Math.round(210 - t * 20)
    b = Math.round(40 - t * 25)

  } else if (pos <= 12) {
    // Orange
    const t = (pos - 9) / 3
    r = 243
    g = Math.round(175 - t * 30)
    b = Math.round(40 - t * 25)

  } else if (pos <= 16) {
    // Dark orange → red
    const t = (pos - 12) / 4
    r = Math.round(240 - t * 10)
    g = Math.round(145 - t * 75)
    b = Math.round(40 - t * 20)

  } else if (pos <= 19) {
    // Strong red (17–19)
    const t = (pos - 16) / 3
    r = 231
    g = Math.round(76 - t * 16)
    b = Math.round(60 - t * 16)

  } else {
    // Deep red (20+)
    r = 192
    g = 57
    b = 43
  }

  return {
    background: `rgb(${r}, ${g}, ${b})`,
    text: '#ffffff'
  }
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
            // Create map pin marker with SVG
            const markerContent = document.createElement('div')
            markerContent.style.cssText = `
              width: 40px;
              height: 50px;
              position: relative;
              cursor: pointer;
            `
            
            // Create SVG map pin
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            svg.setAttribute('width', '40')
            svg.setAttribute('height', '50')
            svg.setAttribute('viewBox', '0 0 40 50')
            svg.style.cssText = 'filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));'
            
            // Map pin path: circular top tapering to soft point at bottom
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            path.setAttribute('d', 'M20,2 C11.163,2 4,9.163 4,18 C4,23.5 7,29 20,48 C33,29 36,23.5 36,18 C36,9.163 28.837,2 20,2 Z')
            path.setAttribute('fill', colors.background)
            path.setAttribute('stroke', 'none')
            svg.appendChild(path)
            
            markerContent.appendChild(svg)
            
            // Add label text centered in the circular top
            const labelDiv = document.createElement('div')
            labelDiv.textContent = label
            labelDiv.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              margin-top: -8px;
              color: ${colors.text};
              font-size: 13px;
              font-weight: bold;
              line-height: 1;
              pointer-events: none;
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
            // Fallback to old Marker API - use custom SVG path for map pin
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
                path: 'M 20,2 C 11.163,2 4,9.163 4,18 C 4,23.5 7,29 20,48 C 33,29 36,23.5 36,18 C 36,9.163 28.837,2 20,2 Z',
                fillColor: colors.background,
                fillOpacity: 1,
                strokeColor: 'none',
                strokeWeight: 0,
                scale: 0.8,
                anchor: new google.maps.Point(20, 48),
                labelOrigin: new google.maps.Point(20, 16)
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
