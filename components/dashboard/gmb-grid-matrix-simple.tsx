"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AggregatedGrid, GridComparison, GridStats } from "@/lib/gmb/grid-utils"

interface GMBGridMatrixSimpleProps {
  keyword: string
  previousMonthGrid: AggregatedGrid | null
  currentMonthGrid: AggregatedGrid | null
  gridComparison: GridComparison[]
  gridStats: GridStats
  previousMonthLabel: string
  currentMonthLabel: string
}

/**
 * Convert grid cells to a 2D matrix for display
 */
function gridToMatrix(grid: AggregatedGrid | null): number[][] {
  if (!grid || grid.cells.length === 0) return []
  
  // Sort cells by latitude (desc) and longitude (asc)
  const sortedCells = [...grid.cells].sort((a, b) => {
    if (Math.abs(a.lat - b.lat) > 0.0001) {
      return b.lat - a.lat // Higher lat first (top to bottom)
    }
    return a.lng - b.lng // Lower lng first (left to right)
  })
  
  // Group by latitude (rows)
  const rows = new Map<string, typeof sortedCells>()
  for (const cell of sortedCells) {
    const latKey = cell.lat.toFixed(5)
    if (!rows.has(latKey)) {
      rows.set(latKey, [])
    }
    rows.get(latKey)!.push(cell)
  }
  
  // Convert to 2D array
  const matrix: number[][] = []
  const rowKeys = Array.from(rows.keys()).sort((a, b) => parseFloat(b) - parseFloat(a))
  
  for (const latKey of rowKeys) {
    const rowCells = rows.get(latKey)!.sort((a, b) => a.lng - b.lng)
    matrix.push(rowCells.map(c => c.position))
  }
  
  return matrix
}

/**
 * Get color class based on position
 */
function getPositionColor(position: number): string {
  if (position <= 3) return 'bg-green-500 text-white' // Excellent
  if (position <= 10) return 'bg-yellow-500 text-white' // Good
  if (position <= 20) return 'bg-orange-500 text-white' // Moderate
  return 'bg-red-500 text-white' // Poor (20+)
}

/**
 * Format position for display (21 = "20+")
 */
function formatPosition(position: number): string {
  return position >= 21 ? '20+' : position.toString()
}

/**
 * Get change color
 */
function getChangeColor(change: number | null): string {
  if (change === null) return 'bg-gray-500 text-white'
  if (change < 0) return 'bg-green-500 text-white' // Improved
  if (change > 0) return 'bg-red-500 text-white' // Worsened
  return 'bg-gray-400 text-white' // Unchanged
}

/**
 * Convert comparison to matrix
 */
function comparisonToMatrix(comparison: GridComparison[], gridSize: number): Array<{change: number | null, current: number | null}> {
  // Sort by coordinates
  const sorted = [...comparison].sort((a, b) => {
    if (Math.abs(a.lat - b.lat) > 0.0001) {
      return b.lat - a.lat
    }
    return a.lng - b.lng
  })
  
  return sorted.map(c => ({
    change: c.change,
    current: c.currentPosition
  }))
}

export function GMBGridMatrixSimple({
  keyword,
  previousMonthGrid,
  currentMonthGrid,
  gridComparison,
  gridStats,
  previousMonthLabel,
  currentMonthLabel
}: GMBGridMatrixSimpleProps) {
  const prevMatrix = gridToMatrix(previousMonthGrid)
  const currMatrix = gridToMatrix(currentMonthGrid)
  const changeData = comparisonToMatrix(gridComparison, currentMonthGrid?.gridSize || previousMonthGrid?.gridSize || 3)
  
  // Convert change data to matrix format
  const changeMatrix: Array<{change: number | null, current: number | null}>[] = []
  if (changeData.length > 0) {
    const gridSize = currentMonthGrid?.gridSize || previousMonthGrid?.gridSize || 3
    for (let i = 0; i < changeData.length; i += gridSize) {
      changeMatrix.push(changeData.slice(i, i + gridSize))
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">
            Keyword: <span className="text-primary">{keyword}</span>
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              Grid Size: {currentMonthGrid?.gridSize ?? previousMonthGrid?.gridSize ?? 'N/A'}
            </Badge>
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

        {/* Matrix Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Previous Month Matrix */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">{previousMonthLabel}</h3>
            {prevMatrix.length > 0 ? (
              <div className="flex flex-col gap-1 p-4 bg-muted/30 rounded-lg">
                {prevMatrix.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex gap-1 justify-center">
                    {row.map((position, colIdx) => (
                      <div
                        key={colIdx}
                        className={`w-12 h-12 flex items-center justify-center rounded font-bold text-xs ${getPositionColor(position)}`}
                      >
                        {formatPosition(position)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No data</p>
              </div>
            )}
            <div className="text-xs text-center text-muted-foreground">
              {previousMonthGrid ? `${previousMonthGrid.cells.length} grid cells` : 'No scans'}
            </div>
          </div>

          {/* Current Month Matrix */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">{currentMonthLabel}</h3>
            {currMatrix.length > 0 ? (
              <div className="flex flex-col gap-1 p-4 bg-muted/30 rounded-lg">
                {currMatrix.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex gap-1 justify-center">
                    {row.map((position, colIdx) => (
                      <div
                        key={colIdx}
                        className={`w-12 h-12 flex items-center justify-center rounded font-bold text-xs ${getPositionColor(position)}`}
                      >
                        {formatPosition(position)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No data</p>
              </div>
            )}
            <div className="text-xs text-center text-muted-foreground">
              {currentMonthGrid ? `${currentMonthGrid.cells.length} grid cells` : 'No scans'}
            </div>
          </div>

          {/* Change Matrix */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">Change</h3>
            {changeMatrix.length > 0 ? (
              <div className="flex flex-col gap-1 p-4 bg-muted/30 rounded-lg">
                {changeMatrix.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex gap-1 justify-center">
                    {row.map((cell, colIdx) => (
                      <div
                        key={colIdx}
                        className={`w-12 h-12 flex items-center justify-center rounded font-bold text-sm ${getChangeColor(cell.change)}`}
                        title={`Position: ${cell.current ?? 'N/A'}, Change: ${cell.change ?? 'N/A'}`}
                      >
                        {cell.change !== null ? (cell.change > 0 ? `+${cell.change}` : cell.change) : '-'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No data</p>
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
