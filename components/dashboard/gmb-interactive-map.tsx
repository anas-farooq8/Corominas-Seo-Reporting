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
    initGoogleMaps?: () => void
    google?: any
  }
}

/**
 * Load Google Maps script only once globally with proper async callback
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
          gestureHandling: 'greedy',
          mapId: 'DEMO_MAP_ID' // Required for AdvancedMarkerElement
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

        // Add markers using AdvancedMarkerElement (new API) or fallback to Marker
        const newMarkers: any[] = []

        // Check if AdvancedMarkerElement is available
        const useAdvancedMarkers = window.google?.maps?.marker?.AdvancedMarkerElement

        for (const marker of markers) {
          const colors = getHeatmapColor(marker.position)
          const label = marker.position <= 20 ? marker.position.toString() : '20+'
          
          if (useAdvancedMarkers) {
            // Create custom HTML content for the marker
            const markerContent = document.createElement('div')
            markerContent.style.cssText = `
              width: 40px;
              height: 50px;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            `
            
            // Create SVG pin
            const svgNS = "http://www.w3.org/2000/svg"
            const svg = document.createElementNS(svgNS, "svg")
            svg.setAttribute("width", "40")
            svg.setAttribute("height", "50")
            svg.setAttribute("viewBox", "0 0 40 50")
            svg.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
            `
            
            // Create pin shape path
            const path = document.createElementNS(svgNS, "path")
            path.setAttribute("d", "M 20,0 C -2,-12 -8,-15 -8,-20 A 8,8 0 1,1 8,-20 C 8,-15 2,-12 0,0 z")
            path.setAttribute("transform", "translate(20, 25) scale(2.0)")
            path.setAttribute("fill", colors.background)
            path.setAttribute("stroke", "none")
            
            svg.appendChild(path)
            markerContent.appendChild(svg)
            
            // Create label text
            const labelDiv = document.createElement('div')
            labelDiv.textContent = label
            labelDiv.style.cssText = `
              position: absolute;
              top: 5px;
              left: 50%;
              transform: translateX(-50%);
              color: ${colors.text};
              font-size: 13px;
              font-weight: bold;
              pointer-events: none;
              z-index: 1;
            `
            markerContent.appendChild(labelDiv)
            
            // Create AdvancedMarkerElement
            const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
              map,
              position: { lat: marker.lat, lng: marker.lng },
              content: markerContent,
              title: `Position: ${marker.position}`
            })

            newMarkers.push(advancedMarker)
          } else {
            // Fallback to old Marker API (suppresses deprecation warnings)
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
                strokeWeight: 0,
                scale: 2.0,
                anchor: new google.maps.Point(0, 0),
                labelOrigin: new google.maps.Point(0, -20)
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
      // Handle cleanup for both AdvancedMarkerElement and old Marker API
      markersRef.current.forEach(marker => {
        if (marker) {
          if (marker.map !== undefined) {
            // AdvancedMarkerElement
            marker.map = null
          } else if (marker.setMap) {
            // Old Marker API
            marker.setMap(null)
          }
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
