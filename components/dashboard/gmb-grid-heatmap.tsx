"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AggregatedGrid, GridComparison, GridStats } from "@/lib/gmb/grid-utils"

interface GMBGridHeatmapProps {
  keyword: string
  previousMonthGrid: AggregatedGrid | null
  currentMonthGrid: AggregatedGrid | null
  gridComparison: GridComparison[]
  gridStats: GridStats
  previousMonthLabel: string
  currentMonthLabel: string
}

/**
 * Generate Google Maps Static API URL with colored markers for heatmap
 * @param grid - The aggregated grid data
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @param mapType - Type of map (previous, current, or change)
 * @param comparison - Optional comparison data for change map
 */
function generateMapUrl(
  grid: AggregatedGrid | null,
  centerLat: number,
  centerLng: number,
  mapType: 'previous' | 'current' | 'change',
  comparison?: GridComparison[]
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  // Debug logging
  console.log(`[Map URL] Generating ${mapType} map...`)
  console.log(`[Map URL] API Key available: ${apiKey ? 'YES' : 'NO'}`)
  console.log(`[Map URL] Center: ${centerLat}, ${centerLng}`)
  console.log(`[Map URL] Grid cells: ${grid?.cells.length ?? 0}`)
  
  if (!apiKey) {
    console.error('[Map URL] ❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set!')
    return '' // Return empty string if no API key
  }
  
  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap'
  
  // Map dimensions
  const width = 600
  const height = 450
  const zoom = 13
  
  // Build marker strings
  const markers: string[] = []
  
  if (mapType === 'change' && comparison) {
    // For change map, color code based on improvement/worsening
    for (const comp of comparison) {
      if (comp.currentPosition === null) continue // Skip lost positions
      
      let color = 'gray' // unchanged
      if (comp.change !== null) {
        if (comp.change < 0) {
          // Improved (negative change) - Green
          color = 'green'
        } else if (comp.change > 0) {
          // Worsened (positive change) - Red
          color = 'red'
        }
      } else if (comp.previousPosition === null) {
        // New position - Blue
        color = 'blue'
      }
      
      const label = comp.currentPosition <= 9 ? comp.currentPosition.toString() : ''
      markers.push(`color:${color}|label:${label}|${comp.lat},${comp.lng}`)
    }
  } else if (grid) {
    // For previous/current maps, color code based on position quality
    for (const cell of grid.cells) {
      let color = 'red' // default for poor positions
      
      if (cell.position <= 3) {
        color = 'green' // Top 3 - excellent
      } else if (cell.position <= 10) {
        color = 'yellow' // Top 10 - good
      } else if (cell.position <= 20) {
        color = 'orange' // Top 20 - moderate
      }
      
      const label = cell.position <= 9 ? cell.position.toString() : ''
      markers.push(`color:${color}|label:${label}|${cell.lat},${cell.lng}`)
    }
  }
  
  // Build URL
  const params = new URLSearchParams({
    center: `${centerLat},${centerLng}`,
    zoom: zoom.toString(),
    size: `${width}x${height}`,
    maptype: 'roadmap',
    key: apiKey,
  })
  
  // Add markers (max ~100 markers per request for Google Static Maps)
  const markerString = markers.slice(0, 100).join('&markers=')
  
  let finalUrl = ''
  if (markerString) {
    finalUrl = `${baseUrl}?${params.toString()}&markers=${markerString}`
  } else {
    finalUrl = `${baseUrl}?${params.toString()}`
  }
  
  // Debug: Show generated URL (without API key for security)
  const debugUrl = finalUrl.replace(/key=[^&]+/, 'key=***')
  console.log(`[Map URL] Generated ${mapType} URL (${markers.length} markers):`)
  console.log(`[Map URL] ${debugUrl.substring(0, 150)}...`)
  
  return finalUrl
}

export function GMBGridHeatmap({
  keyword,
  previousMonthGrid,
  currentMonthGrid,
  gridComparison,
  gridStats,
  previousMonthLabel,
  currentMonthLabel
}: GMBGridHeatmapProps) {
  // Determine center point (use current month if available, otherwise previous)
  const centerLat = currentMonthGrid?.centerLat ?? previousMonthGrid?.centerLat ?? 0
  const centerLng = currentMonthGrid?.centerLng ?? previousMonthGrid?.centerLng ?? 0
  
  const previousMapUrl = previousMonthGrid 
    ? generateMapUrl(previousMonthGrid, centerLat, centerLng, 'previous')
    : null
  
  const currentMapUrl = currentMonthGrid
    ? generateMapUrl(currentMonthGrid, centerLat, centerLng, 'current')
    : null
  
  const changeMapUrl = (currentMonthGrid || previousMonthGrid)
    ? generateMapUrl(currentMonthGrid ?? previousMonthGrid, centerLat, centerLng, 'change', gridComparison)
    : null
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Keyword: <span className="text-primary">{keyword}</span>
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">Grid Size: {currentMonthGrid?.gridSize ?? previousMonthGrid?.gridSize ?? 'N/A'}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{gridStats.totalCells}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Cells</div>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{gridStats.improved}</div>
            <div className="text-xs text-muted-foreground mt-1">Improved</div>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{gridStats.worsened}</div>
            <div className="text-xs text-muted-foreground mt-1">Worsened</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{gridStats.averagePosition?.toFixed(1) ?? 'N/A'}</div>
            <div className="text-xs text-muted-foreground mt-1">Avg Position</div>
          </div>
          <div className="text-center p-3 bg-blue-500/10 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{gridStats.bestPosition ?? 'N/A'}</div>
            <div className="text-xs text-muted-foreground mt-1">Best Position</div>
          </div>
        </div>

        {/* Maps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Previous Month Map */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">{previousMonthLabel}</h3>
            {previousMapUrl ? (
              <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden border">
                <img 
                  src={previousMapUrl} 
                  alt={`${previousMonthLabel} Grid Heatmap`}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log('[Map Image] ✅ Previous month map loaded successfully!')
                  }}
                  onError={(e) => {
                    console.error('[Map Image] ❌ Failed to load previous month map')
                    console.error('[Map Image] URL:', previousMapUrl)
                    
                    // Fetch to see error
                    fetch(previousMapUrl)
                      .then(res => res.text())
                      .then(text => {
                        console.error('[Map Image] Google Maps Error Response:', text)
                      })
                      .catch(err => console.error('[Map Image] Fetch failed:', err))
                    
                    e.currentTarget.style.display = 'none'
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.classList.remove('hidden')
                    }
                  }}
                />
                <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-muted p-4">
                  <p className="text-sm text-red-500 font-semibold">Failed to load map</p>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Check console for error details</p>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/3] bg-muted rounded-lg flex flex-col items-center justify-center border">
                <p className="text-sm text-muted-foreground">No data</p>
                {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                  <p className="text-xs text-red-500 mt-2">API key not configured</p>
                )}
              </div>
            )}
            <div className="text-xs text-center text-muted-foreground">
              {previousMonthGrid ? `${previousMonthGrid.cells.length} grid cells` : 'No scans'}
            </div>
          </div>

          {/* Current Month Map */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">{currentMonthLabel}</h3>
            {currentMapUrl ? (
              <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden border">
                <img 
                  src={currentMapUrl} 
                  alt={`${currentMonthLabel} Grid Heatmap`}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log('[Map Image] ✅ Current month map loaded successfully!')
                  }}
                  onError={(e) => {
                    console.error('[Map Image] ❌ Failed to load current month map')
                    console.error('[Map Image] URL:', currentMapUrl)
                    console.error('[Map Image] Error event:', e)
                    
                    // Try to fetch the URL to see the actual error
                    fetch(currentMapUrl)
                      .then(res => res.text())
                      .then(text => {
                        console.error('[Map Image] Google Maps Error Response:', text)
                        // Try to parse as JSON if possible
                        try {
                          const json = JSON.parse(text)
                          console.error('[Map Image] Error details:', json)
                        } catch (parseError) {
                          // Not JSON, log as text
                          console.error('[Map Image] Error is not JSON, raw response above')
                        }
                      })
                      .catch(err => console.error('[Map Image] Failed to fetch error details:', err))
                    
                    e.currentTarget.style.display = 'none'
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.classList.remove('hidden')
                    }
                  }}
                />
                <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-muted p-4">
                  <p className="text-sm text-red-500 font-semibold">Failed to load map</p>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Check console for error details</p>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/3] bg-muted rounded-lg flex flex-col items-center justify-center border">
                <p className="text-sm text-muted-foreground">No data</p>
                {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                  <p className="text-xs text-red-500 mt-2">API key not configured</p>
                )}
              </div>
            )}
            <div className="text-xs text-center text-muted-foreground">
              {currentMonthGrid ? `${currentMonthGrid.cells.length} grid cells` : 'No scans'}
            </div>
          </div>

          {/* Change Map */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">Change</h3>
            {changeMapUrl ? (
              <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden border">
                <img 
                  src={changeMapUrl} 
                  alt="Grid Change Comparison"
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log('[Map Image] ✅ Change map loaded successfully!')
                  }}
                  onError={(e) => {
                    console.error('[Map Image] ❌ Failed to load change map')
                    console.error('[Map Image] URL:', changeMapUrl)
                    
                    // Fetch to see error
                    fetch(changeMapUrl)
                      .then(res => res.text())
                      .then(text => {
                        console.error('[Map Image] Google Maps Error Response:', text)
                      })
                      .catch(err => console.error('[Map Image] Fetch failed:', err))
                    
                    e.currentTarget.style.display = 'none'
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.classList.remove('hidden')
                    }
                  }}
                />
                <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-muted p-4">
                  <p className="text-sm text-red-500 font-semibold">Failed to load map</p>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Check console for error details</p>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/3] bg-muted rounded-lg flex flex-col items-center justify-center border">
                <p className="text-sm text-muted-foreground">No data</p>
                {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                  <p className="text-xs text-red-500 mt-2">API key not configured</p>
                )}
              </div>
            )}
            <div className="text-xs text-center space-y-1">
              <div className="flex justify-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-muted-foreground">Improved</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="text-muted-foreground">Worsened</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Position Legend */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Color Legend</h4>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>Positions 1-3 (Excellent)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span>Positions 4-10 (Good)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              <span>Positions 11-20 (Moderate)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span>Positions 20+ (Poor)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
