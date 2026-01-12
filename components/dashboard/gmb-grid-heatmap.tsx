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
 * Get marker color based on position
 */
function getPositionColor(position: number): string {
  if (position <= 3) return 'green'
  if (position <= 10) return 'yellow'
  if (position <= 20) return 'orange'
  return 'red'
}

/**
 * Get marker color for change map
 */
function getChangeColor(change: number | null, prevPos: number | null): string {
  if (change === null) return prevPos === null ? 'blue' : 'gray'
  return change < 0 ? 'green' : change > 0 ? 'red' : 'gray'
}

/**
 * Generate Google Maps Static API URL
 */
function generateMapUrl(
  grid: AggregatedGrid | null,
  centerLat: number,
  centerLng: number,
  mapType: 'previous' | 'current' | 'change',
  comparison?: GridComparison[]
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return ''
  
  const markers: string[] = []
  
  // Build markers based on map type
  if (mapType === 'change' && comparison) {
    comparison.forEach(comp => {
      if (comp.currentPosition !== null) {
        const color = getChangeColor(comp.change, comp.previousPosition)
        const label = comp.currentPosition <= 9 ? comp.currentPosition : ''
        markers.push(`color:${color}|label:${label}|${comp.lat},${comp.lng}`)
      }
    })
  } else if (grid) {
    grid.cells.forEach(cell => {
      const color = getPositionColor(cell.position)
      const label = cell.position <= 9 ? cell.position : ''
      markers.push(`color:${color}|label:${label}|${cell.lat},${cell.lng}`)
    })
  }
  
  if (markers.length === 0) return ''
  
  // Build URL with markers (limit to 100 per Google Maps restriction)
  const params = new URLSearchParams({
    center: `${centerLat},${centerLng}`,
    zoom: '13',
    size: '600x450',
    maptype: 'roadmap',
    key: apiKey
  })
  
  return `https://maps.googleapis.com/maps/api/staticmap?${params}&markers=${markers.slice(0, 100).join('&markers=')}`
}

/**
 * Reusable Map Image Component
 */
function MapImage({ url, alt, onError }: { url: string; alt: string; onError?: () => void }) {
  return (
    <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden border">
      <img 
        src={url} 
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
          e.currentTarget.nextElementSibling?.classList.remove('hidden')
          onError?.()
        }}
      />
      <div className="hidden absolute inset-0 flex items-center justify-center bg-muted">
        <p className="text-sm text-red-500">Failed to load map</p>
      </div>
    </div>
  )
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
  const centerLat = currentMonthGrid?.centerLat ?? previousMonthGrid?.centerLat ?? 0
  const centerLng = currentMonthGrid?.centerLng ?? previousMonthGrid?.centerLng ?? 0
  
  const previousMapUrl = previousMonthGrid 
    ? generateMapUrl(previousMonthGrid, centerLat, centerLng, 'previous')
    : ''
  
  const currentMapUrl = currentMonthGrid
    ? generateMapUrl(currentMonthGrid, centerLat, centerLng, 'current')
    : ''
  
  const changeMapUrl = (currentMonthGrid || previousMonthGrid)
    ? generateMapUrl(currentMonthGrid ?? previousMonthGrid, centerLat, centerLng, 'change', gridComparison)
    : ''
  
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
              <MapImage url={previousMapUrl} alt={`${previousMonthLabel} Grid Heatmap`} />
            ) : (
              <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center border">
                <p className="text-sm text-muted-foreground">No data</p>
              </div>
            )}
            <div className="text-xs text-center text-muted-foreground">
              {previousMonthGrid ? `${previousMonthGrid.cells.length} cells` : 'No scans'}
            </div>
          </div>

          {/* Current Month Map */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">{currentMonthLabel}</h3>
            {currentMapUrl ? (
              <MapImage url={currentMapUrl} alt={`${currentMonthLabel} Grid Heatmap`} />
            ) : (
              <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center border">
                <p className="text-sm text-muted-foreground">No data</p>
              </div>
            )}
            <div className="text-xs text-center text-muted-foreground">
              {currentMonthGrid ? `${currentMonthGrid.cells.length} cells` : 'No scans'}
            </div>
          </div>

          {/* Change Map */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">Change</h3>
            {changeMapUrl ? (
              <MapImage url={changeMapUrl} alt="Grid Change Comparison" />
            ) : (
              <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center border">
                <p className="text-sm text-muted-foreground">No data</p>
              </div>
            )}
            <div className="text-xs text-center">
              <div className="flex justify-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-muted-foreground text-xs">Improved</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="text-muted-foreground text-xs">Worsened</span>
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
