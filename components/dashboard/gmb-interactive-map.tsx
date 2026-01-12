"use client"

import { useEffect, useRef, useState } from "react"

interface GMBInteractiveMapProps {
  centerLat: number
  centerLng: number
  markers: Array<{
    lat: number
    lng: number
    position: number
    color: string
  }>
  mapType: 'previous' | 'current' | 'change'
  gridBounds?: {
    north: number
    south: number
    east: number
    west: number
  }
}

/**
 * Get heatmap color based on position (better visual gradient)
 */
function getHeatmapColor(position: number): { background: string; text: string } {
  if (position <= 3) return { background: '#22c55e', text: '#ffffff' } // Green
  if (position <= 10) return { background: '#eab308', text: '#ffffff' } // Yellow
  if (position <= 20) return { background: '#f97316', text: '#ffffff' } // Orange
  return { background: '#ef4444', text: '#ffffff' } // Red (20+)
}

// Global flag to track if script is loaded
let isGoogleMapsLoaded = false
let googleMapsLoadPromise: Promise<void> | null = null

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (isGoogleMapsLoaded) {
    return Promise.resolve()
  }

  if (googleMapsLoadPromise) {
    return googleMapsLoadPromise
  }

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => {
      isGoogleMapsLoaded = true
      resolve()
    }
    script.onerror = () => {
      googleMapsLoadPromise = null
      reject(new Error('Failed to load Google Maps script'))
    }
    document.head.appendChild(script)
  })

  return googleMapsLoadPromise
}

export function GMBInteractiveMap({
  centerLat,
  centerLng,
  markers,
  mapType,
  gridBounds
}: GMBInteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const rectangleRef = useRef<google.maps.Rectangle | null>(null)
  
  const [brightness, setBrightness] = useState(100)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      setError('Google Maps API key not configured')
      setIsLoading(false)
      return
    }

    async function initMap() {
      try {
        // Load Google Maps script
        await loadGoogleMapsScript(apiKey!)
        
        if (!mapRef.current) return

        // Create map
        const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary
        
        const map = new Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 13,
          mapTypeId: 'roadmap',
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy', // Allow dragging
          styles: [
            {
              featureType: 'all',
              elementType: 'all',
              stylers: [{ lightness: (brightness - 100) / 5 }]
            }
          ]
        })

        mapInstanceRef.current = map

        // Draw grid outline if bounds provided
        if (gridBounds) {
          const rectangle = new google.maps.Rectangle({
            strokeColor: '#60a5fa', // Light blue
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#60a5fa',
            fillOpacity: 0.1,
            map,
            bounds: gridBounds
          })
          rectangleRef.current = rectangle
        }

        // Add markers
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary
        
        const newMarkers: google.maps.marker.AdvancedMarkerElement[] = []

        for (const marker of markers) {
          const colors = getHeatmapColor(marker.position)
          
          // Create custom pin with number
          const pinElement = new PinElement({
            background: colors.background,
            borderColor: '#ffffff',
            glyphColor: colors.text,
            glyph: marker.position <= 20 ? marker.position.toString() : '20+',
            scale: 1.2
          })

          const advancedMarker = new AdvancedMarkerElement({
            map,
            position: { lat: marker.lat, lng: marker.lng },
            content: pinElement.element,
            title: `Position: ${marker.position}`
          })

          newMarkers.push(advancedMarker)
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
      // Cleanup
      markersRef.current.forEach(marker => marker.map = null)
      rectangleRef.current?.setMap(null)
      mapInstanceRef.current = null
    }
  }, [centerLat, centerLng, markers, gridBounds, brightness])

  // Update brightness
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        styles: [
          {
            featureType: 'all',
            elementType: 'all',
            stylers: [{ lightness: (brightness - 100) / 5 }]
          }
        ]
      })
    }
  }, [brightness])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg border">
        <div className="text-center">
          <p className="text-sm text-red-500">{error}</p>
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
      
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg border overflow-hidden"
        style={{ minHeight: '450px' }}
      />

      {/* Brightness Control */}
      <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10">
        <label className="text-xs font-medium block mb-2">Brightness</label>
        <input
          type="range"
          min="50"
          max="150"
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  )
}
