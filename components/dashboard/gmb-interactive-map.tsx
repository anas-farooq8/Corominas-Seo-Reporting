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
  gridSize?: number // 3x3, 7x7, etc.
}

type BrightnessLevel = 'low' | 'medium' | 'high'

const BRIGHTNESS_VALUES: Record<BrightnessLevel, number> = {
  low: 75,
  medium: 100,
  high: 125
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

// Global state for Google Maps script loading
declare global {
  interface Window {
    googleMapsLoadPromise?: Promise<void>
    google?: any
  }
}

/**
 * Load Google Maps script only once globally
 * Uses window object to ensure single instance across all components
 */
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  // If already loaded, return immediately
  if (typeof window.google !== 'undefined' && window.google.maps) {
    return Promise.resolve()
  }

  // If currently loading, return existing promise
  if (window.googleMapsLoadPromise) {
    return window.googleMapsLoadPromise
  }

  // Check if script tag already exists
  const existingScript = document.querySelector(
    'script[src*="maps.googleapis.com/maps/api/js"]'
  )
  
  if (existingScript) {
    // Script exists, wait for it to load
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

  // Create new script tag
  window.googleMapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => {
      resolve()
    }
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
  mapType,
  gridBounds,
  gridSize = 3
}: GMBInteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const rectangleRef = useRef<google.maps.Rectangle | null>(null)
  
  const [brightness, setBrightness] = useState<BrightnessLevel>('medium')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Calculate zoom level based on grid size
  const getZoomLevel = (size: number): number => {
    if (size <= 3) return 14  // 3x3 grid - closer zoom
    if (size <= 5) return 13  // 5x5 grid - medium zoom
    return 12                  // 7x7 or larger - wider zoom
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
        // Load Google Maps script
        await loadGoogleMapsScript(apiKey!)
        
        if (!mapRef.current) return

        // Create map
        const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary
        
        const brightnessValue = BRIGHTNESS_VALUES[brightness]
        
        const map = new Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: getZoomLevel(gridSize),
          mapTypeId: 'roadmap',
          mapTypeControl: false, // Hide default map type control
          streetViewControl: false,
          fullscreenControl: false, // Custom controls will be added
          zoomControl: false, // Custom zoom control at bottom right
          gestureHandling: 'greedy', // Allow dragging
          styles: [
            {
              featureType: 'all',
              elementType: 'all',
              stylers: [{ lightness: (brightnessValue - 100) / 5 }]
            }
          ],
          // Position default controls at bottom right
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          }
        })

        mapInstanceRef.current = map
        
        // Add custom zoom controls at bottom right
        const zoomInButton = document.createElement('button')
        zoomInButton.textContent = '+'
        zoomInButton.className = 'bg-white hover:bg-gray-100 border border-gray-300 shadow-md text-gray-700 font-bold text-xl w-10 h-10 rounded cursor-pointer mb-2'
        zoomInButton.style.display = 'block'
        zoomInButton.onclick = () => {
          const currentZoom = map.getZoom()
          if (currentZoom !== undefined) map.setZoom(currentZoom + 1)
        }
        
        const zoomOutButton = document.createElement('button')
        zoomOutButton.textContent = '−'
        zoomOutButton.className = 'bg-white hover:bg-gray-100 border border-gray-300 shadow-md text-gray-700 font-bold text-xl w-10 h-10 rounded cursor-pointer mb-2'
        zoomOutButton.style.display = 'block'
        zoomOutButton.onclick = () => {
          const currentZoom = map.getZoom()
          if (currentZoom !== undefined) map.setZoom(currentZoom - 1)
        }
        
        const myLocationButton = document.createElement('button')
        myLocationButton.innerHTML = '⌖'
        myLocationButton.className = 'bg-white hover:bg-gray-100 border border-gray-300 shadow-md text-gray-700 font-bold text-xl w-10 h-10 rounded cursor-pointer'
        myLocationButton.onclick = () => {
          map.setCenter({ lat: centerLat, lng: centerLng })
          map.setZoom(getZoomLevel(gridSize))
        }
        
        const zoomControlDiv = document.createElement('div')
        zoomControlDiv.style.margin = '10px'
        zoomControlDiv.appendChild(zoomInButton)
        zoomControlDiv.appendChild(zoomOutButton)
        zoomControlDiv.appendChild(myLocationButton)
        
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(zoomControlDiv)

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

        // Add markers using standard Marker with custom icons
        const newMarkers: google.maps.Marker[] = []

        for (const marker of markers) {
          const colors = getHeatmapColor(marker.position)
          const label = marker.position <= 20 ? marker.position.toString() : '20+'
          
          // Create custom marker with colored background and number
          const googleMarker = new google.maps.Marker({
            map,
            position: { lat: marker.lat, lng: marker.lng },
            title: `Position: ${marker.position}`,
            label: {
              text: label,
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold'
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: colors.background,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 18
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
      // Cleanup
      markersRef.current.forEach(marker => marker.setMap(null))
      rectangleRef.current?.setMap(null)
      mapInstanceRef.current = null
    }
  }, [centerLat, centerLng, markers, gridBounds, brightness])

  // Update brightness when changed
  useEffect(() => {
    if (mapInstanceRef.current) {
      const brightnessValue = BRIGHTNESS_VALUES[brightness]
      mapInstanceRef.current.setOptions({
        styles: [
          {
            featureType: 'all',
            elementType: 'all',
            stylers: [{ lightness: (brightnessValue - 100) / 5 }]
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

      {/* Brightness Dropdown - Top Left */}
      <div className="absolute top-3 left-3 bg-white dark:bg-gray-800 rounded shadow-md z-10">
        <select
          value={brightness}
          onChange={(e) => setBrightness(e.target.value as BrightnessLevel)}
          className="px-3 py-2 text-sm font-medium border-0 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
        >
          <option value="low">Low Brightness</option>
          <option value="medium">Medium Brightness</option>
          <option value="high">High Brightness</option>
        </select>
      </div>
    </div>
  )
}
