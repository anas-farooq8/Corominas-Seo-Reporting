"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GMBInteractiveMap } from "./gmb-interactive-map"
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
 * Prepare markers for interactive map
 */
function prepareMarkers(
  grid: AggregatedGrid | null,
  mapType: 'previous' | 'current' | 'change',
  comparison?: GridComparison[]
): Array<{ lat: number; lng: number; position: number; color: string }> {
  const markers: Array<{ lat: number; lng: number; position: number; color: string }> = []
  
  if (mapType === 'change' && comparison) {
    // Change map: Show current positions with change colors
    comparison.forEach(comp => {
      if (comp.currentPosition !== null) {
        let color = 'gray'
        if (comp.change !== null) {
          color = comp.change < 0 ? 'green' : comp.change > 0 ? 'red' : 'gray'
        } else if (comp.previousPosition === null) {
          color = 'blue' // New position
        }
        markers.push({ 
          lat: comp.lat, 
          lng: comp.lng, 
          position: comp.currentPosition, 
          color 
        })
      }
    })
  } else if (grid) {
    // Regular map: Color by position quality
    grid.cells.forEach(cell => {
      let color = 'red'
      if (cell.position <= 3) color = 'green'
      else if (cell.position <= 10) color = 'yellow'
      else if (cell.position <= 20) color = 'orange'
      
      markers.push({ 
        lat: cell.lat, 
        lng: cell.lng, 
        position: cell.position, 
        color 
      })
    })
  }
  
  return markers
}

/**
 * Calculate grid bounds for outline rectangle
 */
function calculateGridBounds(cells: Array<{ lat: number; lng: number }>): {
  north: number
  south: number
  east: number
  west: number
} | null {
  if (cells.length === 0) return null
  
  const lats = cells.map(c => c.lat)
  const lngs = cells.map(c => c.lng)
  
  return {
    north: Math.max(...lats) + 0.001, // Add small padding
    south: Math.min(...lats) - 0.001,
    east: Math.max(...lngs) + 0.001,
    west: Math.min(...lngs) - 0.001
  }
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
  
  // Prepare markers for each map
  const previousMarkers = prepareMarkers(previousMonthGrid, 'previous')
  const currentMarkers = prepareMarkers(currentMonthGrid, 'current')
  const changeMarkers = prepareMarkers(currentMonthGrid ?? previousMonthGrid, 'change', gridComparison)
  
  // Calculate grid bounds for outline
  const gridBounds = currentMonthGrid 
    ? calculateGridBounds(currentMonthGrid.cells)
    : previousMonthGrid
      ? calculateGridBounds(previousMonthGrid.cells)
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

        {/* Interactive Maps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Previous Month Map */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">{previousMonthLabel}</h3>
            <div className="h-[450px]">
              {previousMonthGrid ? (
                <GMBInteractiveMap
                  centerLat={centerLat}
                  centerLng={centerLng}
                  markers={previousMarkers}
                  mapType="previous"
                  gridBounds={gridBounds ?? undefined}
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center border">
                  <p className="text-sm text-muted-foreground">No data</p>
                </div>
              )}
            </div>
            <div className="text-xs text-center text-muted-foreground">
              {previousMonthGrid ? `${previousMonthGrid.cells.length} cells` : 'No scans'}
            </div>
          </div>

          {/* Current Month Map */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">{currentMonthLabel}</h3>
            <div className="h-[450px]">
              {currentMonthGrid ? (
                <GMBInteractiveMap
                  centerLat={centerLat}
                  centerLng={centerLng}
                  markers={currentMarkers}
                  mapType="current"
                  gridBounds={gridBounds ?? undefined}
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center border">
                  <p className="text-sm text-muted-foreground">No data</p>
                </div>
              )}
            </div>
            <div className="text-xs text-center text-muted-foreground">
              {currentMonthGrid ? `${currentMonthGrid.cells.length} cells` : 'No scans'}
            </div>
          </div>

          {/* Change Map */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">Change ({currentMonthLabel} vs {previousMonthLabel})</h3>
            <div className="h-[450px]">
              {(currentMonthGrid || previousMonthGrid) ? (
                <GMBInteractiveMap
                  centerLat={centerLat}
                  centerLng={centerLng}
                  markers={changeMarkers}
                  mapType="change"
                  gridBounds={gridBounds ?? undefined}
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center border">
                  <p className="text-sm text-muted-foreground">No data</p>
                </div>
              )}
            </div>
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
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-muted-foreground text-xs">New</span>
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
