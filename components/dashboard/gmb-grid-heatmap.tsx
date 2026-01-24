"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GMBInteractiveMap } from "./gmb-interactive-map"
import type { GMBGridDashboardData } from "@/lib/actions/gmb-dashboard"

interface GMBGridHeatmapProps {
  data: GMBGridDashboardData
}

export function GMBGridHeatmap({ data }: GMBGridHeatmapProps) {
  const { keyword, address, gridSize, radius, centerLat, centerLng, heatmapData, monthLabels } = data
  
  // Prepare markers for previous and current month
  const previousMarkers = heatmapData
    .filter(c => c.previous !== null)
    .map(c => ({
      lat: c.lat,
      lng: c.lng,
      position: c.previous!
    }))
  
  const currentMarkers = heatmapData
    .filter(c => c.last !== null)
    .map(c => ({
      lat: c.lat,
      lng: c.lng,
      position: c.last!
    }))
  
  // Calculate grid bounds - rectangle passes through the center of edge markers
  // Top/bottom: through the outermost markers
  // Left/right: through the outermost markers
  const lats = heatmapData.map(c => c.lat)
  const lngs = heatmapData.map(c => c.lng)
  
  let gridBounds: { north: number; south: number; east: number; west: number } | undefined
  
  if (heatmapData.length > 0) {
    // Simply use the min/max coordinates - bounds pass through marker centers
    gridBounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    }
  }
  
  // Calculate averages for display
  const currentAvg = currentMarkers.length > 0
    ? currentMarkers.reduce((sum, m) => sum + m.position, 0) / currentMarkers.length
    : 0
  const previousAvg = previousMarkers.length > 0
    ? previousMarkers.reduce((sum, m) => sum + m.position, 0) / previousMarkers.length
    : 0
  
  return (
    <Card className="w-full border-2">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-base sm:text-lg">
            Local Grid Heatmaps for keyword <span className="text-primary">"{keyword}"</span>
          </CardTitle>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="font-normal">
              Grid: {gridSize}x{gridSize}
            </Badge>
            <Badge variant="outline" className="font-normal">
              Radius: {radius} km
            </Badge>
            {address && (
              <Badge variant="outline" className="font-normal truncate max-w-xs">
                Center: {address}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Interactive Maps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Previous Month Map */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center bg-muted/30 py-2 rounded-t-lg">
              {monthLabels.previous}
            </h3>
            <div className="h-[350px] sm:h-[500px] md:h-[600px]">
              {previousMarkers.length > 0 ? (
                <GMBInteractiveMap
                  centerLat={centerLat}
                  centerLng={centerLng}
                  markers={previousMarkers}
                  gridBounds={gridBounds}
                  gridSize={gridSize}
                  radius={radius}
                />
              ) : (
                <div className="w-full h-full bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed">
                  <p className="text-sm text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
            {previousMarkers.length > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                {previousMarkers.length} grid points • Avg: {previousAvg.toFixed(1)}
              </p>
            )}
          </div>

          {/* Current Month Map */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center bg-muted/30 py-2 rounded-t-lg">
              {monthLabels.last}
            </h3>
            <div className="h-[350px] sm:h-[500px] md:h-[600px]">
              {currentMarkers.length > 0 ? (
                <GMBInteractiveMap
                  centerLat={centerLat}
                  centerLng={centerLng}
                  markers={currentMarkers}
                  gridBounds={gridBounds}
                  gridSize={gridSize}
                  radius={radius}
                />
              ) : (
                <div className="w-full h-full bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed">
                  <p className="text-sm text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
            {currentMarkers.length > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                {currentMarkers.length} grid points • Avg: {currentAvg.toFixed(1)}
              </p>
            )}
          </div>
        </div>

        {/* Position Legend */}
        <div className="border-t pt-3">
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground text-center">Position Colors</h4>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <svg width="12" height="15" viewBox="0 0 40 50" className="inline-block">
                <path d="M20,2 C11.163,2 4,9.163 4,18 C4,23.5 7,29 20,48 C33,29 36,23.5 36,18 C36,9.163 28.837,2 20,2 Z" fill="rgb(34,197,94)" />
              </svg>
              <span>1-3</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="15" viewBox="0 0 40 50" className="inline-block">
                <path d="M20,2 C11.163,2 4,9.163 4,18 C4,23.5 7,29 20,48 C33,29 36,23.5 36,18 C36,9.163 28.837,2 20,2 Z" fill="rgb(234,179,8)" />
              </svg>
              <span>4-10</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="15" viewBox="0 0 40 50" className="inline-block">
                <path d="M20,2 C11.163,2 4,9.163 4,18 C4,23.5 7,29 20,48 C33,29 36,23.5 36,18 C36,9.163 28.837,2 20,2 Z" fill="rgb(249,115,22)" />
              </svg>
              <span>11-20</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="15" viewBox="0 0 40 50" className="inline-block">
                <path d="M20,2 C11.163,2 4,9.163 4,18 C4,23.5 7,29 20,48 C33,29 36,23.5 36,18 C36,9.163 28.837,2 20,2 Z" fill="rgb(239,68,68)" />
              </svg>
              <span>20+</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
