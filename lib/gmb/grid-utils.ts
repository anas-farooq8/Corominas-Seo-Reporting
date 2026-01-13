/**
 * Grid My Business - Grid Aggregation Utilities
 * Handles grid data processing, aggregation, and comparison logic
 */

import type { GMBGridReportResponse, GMBGridCoord } from "./api"

// ============================================
// Type Definitions
// ============================================

export interface GridCell {
  lat: number
  lng: number
  position: number
}

// Constant for handling null/missing positions
// GMB shows these as "20+" so we treat them as 21 for calculations
const NULL_POSITION_VALUE = 21

export interface AggregatedGrid {
  keyword: string
  gridSize: number
  distance: number
  distanceUnit: string
  cells: GridCell[]
  centerLat: number
  centerLng: number
}

export interface GridComparison {
  lat: number
  lng: number
  previousPosition: number | null
  currentPosition: number | null
  change: number | null // negative = improved, positive = worsened, null = new or lost
}

export interface MonthlyGridData {
  aggregated: AggregatedGrid
  comparison: GridComparison[]
}

// ============================================
// Grid Debugging Functions
// ============================================

/**
 * Debug: Visualize a single scan's grid as a matrix
 */
function debugVisualizeGridMatrix(report: GMBGridReportResponse): void {
  const { keyword, gridSize, coords, _id } = report
  
  console.log(`\n🔍 DEBUG: Grid Matrix for scan ${_id.substring(0, 8)}... (keyword: "${keyword}")`)
  console.log(`   Grid Size: ${gridSize}x${gridSize}`)
  
  // Find min/max coordinates to determine grid layout
  const lats = coords.map(c => c.coord.lat)
  const lngs = coords.map(c => c.coord.lng)
  
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  
  // Create a map of coordinate to position
  const posMap = new Map<string, number>()
  for (const coord of coords) {
    const key = `${coord.coord.lat.toFixed(6)},${coord.coord.lng.toFixed(6)}`
    posMap.set(key, coord.position)
  }
  
  // Build matrix visualization
  console.log(`   Coordinates: lat [${minLat.toFixed(4)} to ${maxLat.toFixed(4)}], lng [${minLng.toFixed(4)} to ${maxLng.toFixed(4)}]`)
  console.log(`   Matrix (${coords.length} cells):`)
  
  // Sort coords by lat (desc) and lng (asc) for proper grid layout
  const sortedCoords = [...coords].sort((a, b) => {
    if (Math.abs(a.coord.lat - b.coord.lat) > 0.0001) {
      return b.coord.lat - a.coord.lat // Higher lat first (top to bottom)
    }
    return a.coord.lng - b.coord.lng // Lower lng first (left to right)
  })
  
  // Display as proper grid based on gridSize
  const reportGridSize = report.gridSize
  
  if (sortedCoords.length === reportGridSize * reportGridSize) {
    // Perfect square grid - display as gridSize × gridSize
    console.log(`   Displaying as ${reportGridSize}×${reportGridSize} grid:\n`)
    
    for (let row = 0; row < reportGridSize; row++) {
      const rowStart = row * reportGridSize
      const rowEnd = rowStart + reportGridSize
      const rowCoords = sortedCoords.slice(rowStart, rowEnd)
      
      const positions = rowCoords.map(c => {
        const pos = c.position !== null && c.position !== undefined 
          ? c.position.toString().padStart(2, ' ') 
          : 'XX'
        return `[${pos}]`
      }).join(' ')
      console.log(`     ${positions}`)
    }
  } else {
    // Not a perfect square - group by latitude as before
    const rows = new Map<string, typeof coords>()
    for (const coord of sortedCoords) {
      const latKey = coord.coord.lat.toFixed(5)
      if (!rows.has(latKey)) {
        rows.set(latKey, [])
      }
      rows.get(latKey)!.push(coord)
    }
    
    // Print each row
    const rowKeys = Array.from(rows.keys()).sort((a, b) => parseFloat(b) - parseFloat(a))
    for (const latKey of rowKeys) {
      const rowCoords = rows.get(latKey)!.sort((a, b) => a.coord.lng - b.coord.lng)
      const positions = rowCoords.map(c => {
        const pos = c.position !== null && c.position !== undefined 
          ? c.position.toString().padStart(2, ' ') 
          : 'XX'
        return `[${pos}]`
      }).join(' ')
      console.log(`     ${positions}`)
    }
  }
  console.log('')
}

// ============================================
// Grid Aggregation Functions
// ============================================

/**
 * Aggregate multiple weekly scans into a single monthly grid
 * Uses MIN (best) position for each grid cell
 */
export function aggregateGridScans(reports: GMBGridReportResponse[]): AggregatedGrid | null {
  if (reports.length === 0) return null

  // Debug: Visualize each scan's grid
  console.log(`\n🔬 [Grid Aggregation] Processing ${reports.length} scans...`)
  for (let i = 0; i < reports.length; i++) {
    console.log(`\n   --- Scan ${i + 1}/${reports.length} ---`)
    debugVisualizeGridMatrix(reports[i])
  }

  // Use the first report as template for metadata
  const template = reports[0]
  
  // Group all coordinates by their lat/lng (rounded to avoid floating point issues)
  const coordMap = new Map<string, number[]>()
  
  for (const report of reports) {
    for (const coord of report.coords) {
      // Create a key from lat/lng (round to 6 decimal places)
      const key = `${coord.coord.lat.toFixed(6)},${coord.coord.lng.toFixed(6)}`
      
      if (!coordMap.has(key)) {
        coordMap.set(key, [])
      }
      
      // Handle null positions as 21 (20+)
      const position = coord.position !== null && coord.position !== undefined 
        ? coord.position 
        : NULL_POSITION_VALUE
      
      coordMap.get(key)!.push(position)
    }
  }
  
  // Calculate MIN (best) position for each cell
  const cells: GridCell[] = []
  let sumLat = 0
  let sumLng = 0
  
  for (const [key, positions] of coordMap.entries()) {
    const [latStr, lngStr] = key.split(',')
    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    
    // Get the best (minimum) position across all scans
    // Filter out any NaN values just in case
    const validPositions = positions.filter(p => !isNaN(p) && p !== null && p !== undefined)
    const bestPosition = validPositions.length > 0 ? Math.min(...validPositions) : NULL_POSITION_VALUE
    
    cells.push({ lat, lng, position: bestPosition })
    sumLat += lat
    sumLng += lng
  }
  
  // Calculate center point
  const centerLat = cells.length > 0 ? sumLat / cells.length : 0
  const centerLng = cells.length > 0 ? sumLng / cells.length : 0
  
  console.log(`\n✅ [Grid Aggregation] Aggregated ${reports.length} scans into ${cells.length} grid cells`)
  console.log(`   Center: ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`)
  
  // Debug: Show final aggregated grid
  const aggregatedGrid = {
    keyword: template.keyword,
    gridSize: template.gridSize,
    distance: template.distance,
    distanceUnit: template.distanceUnit,
    cells,
    centerLat,
    centerLng
  }
  
  console.log(`\n🎯 FINAL AGGREGATED GRID (keyword: "${template.keyword}"):`)
  
  // Sort cells for visualization
  const sortedCells = [...cells].sort((a, b) => {
    if (Math.abs(a.lat - b.lat) > 0.0001) {
      return b.lat - a.lat
    }
    return a.lng - b.lng
  })
  
  const templateGridSize = template.gridSize
  
  if (sortedCells.length === templateGridSize * templateGridSize) {
    // Perfect square grid - display as gridSize × gridSize
    console.log(`   (${templateGridSize}×${templateGridSize} grid)\n`)
    
    for (let row = 0; row < templateGridSize; row++) {
      const rowStart = row * templateGridSize
      const rowEnd = rowStart + templateGridSize
      const rowCells = sortedCells.slice(rowStart, rowEnd)
      
      const positions = rowCells.map(c => {
        const pos = c.position !== null && c.position !== undefined
          ? c.position.toString().padStart(2, ' ')
          : 'XX'
        return `[${pos}]`
      }).join(' ')
      console.log(`   ${positions}`)
    }
  } else {
    // Not a perfect square - group by latitude
    const aggRows = new Map<string, typeof cells>()
    for (const cell of sortedCells) {
      const latKey = cell.lat.toFixed(5)
      if (!aggRows.has(latKey)) {
        aggRows.set(latKey, [])
      }
      aggRows.get(latKey)!.push(cell)
    }
    
    // Print each row
    const aggRowKeys = Array.from(aggRows.keys()).sort((a, b) => parseFloat(b) - parseFloat(a))
    for (const latKey of aggRowKeys) {
      const rowCells = aggRows.get(latKey)!.sort((a, b) => a.lng - b.lng)
      const positions = rowCells.map(c => {
        const pos = c.position !== null && c.position !== undefined
          ? c.position.toString().padStart(2, ' ')
          : 'XX'
        return `[${pos}]`
      }).join(' ')
      console.log(`   ${positions}`)
    }
  }
  
  // Calculate statistics
  const positions = cells.map(c => c.position)
  const avgPos = positions.reduce((a, b) => a + b, 0) / positions.length
  const bestPos = Math.min(...positions)
  const worstPos = Math.max(...positions)
  
  console.log(`\n   Stats: Best=${bestPos}, Worst=${worstPos}, Avg=${avgPos.toFixed(1)}`)
  console.log(`   ════════════════════════════════════════\n`)
  
  return aggregatedGrid
}

/**
 * Compare two monthly grids to calculate position changes
 */
export function compareGrids(
  previousGrid: AggregatedGrid | null,
  currentGrid: AggregatedGrid | null
): GridComparison[] {
  if (!currentGrid && !previousGrid) return []
  
  // Create maps for quick lookup
  const previousMap = new Map<string, number>()
  const currentMap = new Map<string, number>()
  
  if (previousGrid) {
    for (const cell of previousGrid.cells) {
      const key = `${cell.lat.toFixed(6)},${cell.lng.toFixed(6)}`
      previousMap.set(key, cell.position)
    }
  }
  
  if (currentGrid) {
    for (const cell of currentGrid.cells) {
      const key = `${cell.lat.toFixed(6)},${cell.lng.toFixed(6)}`
      currentMap.set(key, cell.position)
    }
  }
  
  // Get all unique coordinates from both grids
  const allKeys = new Set([...previousMap.keys(), ...currentMap.keys()])
  
  const comparisons: GridComparison[] = []
  
  for (const key of allKeys) {
    const [latStr, lngStr] = key.split(',')
    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    
    const previousPosition = previousMap.get(key) ?? null
    const currentPosition = currentMap.get(key) ?? null
    
    // Calculate change
    // Negative change = improvement (lower position number)
    // Positive change = worsened (higher position number)
    let change: number | null = null
    if (previousPosition !== null && currentPosition !== null) {
      change = currentPosition - previousPosition
    }
    
    comparisons.push({
      lat,
      lng,
      previousPosition,
      currentPosition,
      change
    })
  }
  
  console.log(`[Grid Comparison] Compared ${comparisons.length} grid cells`)
  
  return comparisons
}

/**
 * Calculate grid statistics for display
 */
export interface GridStats {
  totalCells: number
  improved: number
  worsened: number
  unchanged: number
  newCells: number
  lostCells: number
  averagePosition: number | null
  bestPosition: number | null
  worstPosition: number | null
}

/**
 * Keyword data with grid information (for best keyword selection)
 */
export interface KeywordWithGrid {
  keyword: string
  keywordId: string
  previousMonthGrid: AggregatedGrid | null
  lastMonthGrid: AggregatedGrid | null
  gridStats: GridStats
}

export function calculateGridStats(
  grid: AggregatedGrid | null,
  comparison: GridComparison[]
): GridStats {
  if (!grid) {
    return {
      totalCells: 0,
      improved: 0,
      worsened: 0,
      unchanged: 0,
      newCells: 0,
      lostCells: 0,
      averagePosition: null,
      bestPosition: null,
      worstPosition: null
    }
  }
  
  let improved = 0
  let worsened = 0
  let unchanged = 0
  let newCells = 0
  let lostCells = 0
  
  for (const comp of comparison) {
    if (comp.change === null) {
      if (comp.currentPosition !== null && comp.previousPosition === null) {
        newCells++
      } else if (comp.previousPosition !== null && comp.currentPosition === null) {
        lostCells++
      }
    } else if (comp.change < 0) {
      improved++
    } else if (comp.change > 0) {
      worsened++
    } else {
      unchanged++
    }
  }
  
  // Handle positions - treat NULL_POSITION_VALUE (21) as valid data
  const positions = grid.cells.map(c => c.position)
  const averagePosition = positions.length > 0 
    ? positions.reduce((a, b) => a + b, 0) / positions.length 
    : null
  const bestPosition = positions.length > 0 ? Math.min(...positions) : null
  const worstPosition = positions.length > 0 ? Math.max(...positions) : null
  
  return {
    totalCells: grid.cells.length,
    improved,
    worsened,
    unchanged,
    newCells,
    lostCells,
    averagePosition,
    bestPosition,
    worstPosition
  }
}

/**
 * Select the best keyword to display based on performance metrics
 * Criteria (in priority order):
 * 1. Has grid data in current month
 * 2. Best (lowest) average position
 * 3. Most improved cells
 * 4. Most total cells
 */
export function selectBestKeyword(keywords: KeywordWithGrid[]): KeywordWithGrid | null {
  if (keywords.length === 0) return null
  
  // Filter keywords that have current month grid data
  const keywordsWithData = keywords.filter(kw => kw.lastMonthGrid !== null)
  
  if (keywordsWithData.length === 0) {
    // If no current data, try previous month
    const keywordsWithPrevData = keywords.filter(kw => kw.previousMonthGrid !== null)
    if (keywordsWithPrevData.length === 0) return null
    return keywordsWithPrevData[0] // Return first with any data
  }
  
  // Score each keyword
  console.log(`\n📊 [Keyword Scoring] Analyzing ${keywordsWithData.length} keywords...\n`)
  
  const scored = keywordsWithData.map((kw, index) => {
    const stats = kw.gridStats
    
    // Calculate score (lower is better)
    const avgPositionScore = stats.averagePosition ?? 100 // Lower position is better
    const improvementScore = -stats.improved * 2 // More improvements is better (negative to subtract)
    const cellScore = -stats.totalCells * 0.1 // More cells is slightly better
    
    const totalScore = avgPositionScore + improvementScore + cellScore
    
    // Debug output for this keyword
    console.log(`   ${index + 1}. "${kw.keyword}"`)
    console.log(`      Avg Position: ${stats.averagePosition?.toFixed(1) ?? 'N/A'} (score: +${avgPositionScore})`)
    console.log(`      Improved: ${stats.improved} cells (score: ${improvementScore})`)
    console.log(`      Worsened: ${stats.worsened} cells`)
    console.log(`      Total Cells: ${stats.totalCells} (score: ${cellScore.toFixed(1)})`)
    console.log(`      🎯 Total Score: ${totalScore.toFixed(2)} (lower is better)`)
    console.log('')
    
    return {
      keyword: kw,
      score: totalScore,
      avgPos: stats.averagePosition,
      improved: stats.improved,
      worsened: stats.worsened,
      totalCells: stats.totalCells
    }
  })
  
  // Sort by score (lowest is best)
  scored.sort((a, b) => a.score - b.score)
  
  // Show ranking
  console.log(`📈 [Keyword Ranking] Results (best to worst):\n`)
  scored.forEach((item, index) => {
    const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
    console.log(`   ${medal} "${item.keyword.keyword}" - Score: ${item.score.toFixed(2)}`)
  })
  
  const best = scored[0]
  console.log(`\n✅ [Best Keyword Selected] "${best.keyword.keyword}"`)
  console.log(`   Final Stats: Avg=${best.avgPos?.toFixed(1)}, Improved=${best.improved}, Cells=${best.totalCells}`)
  console.log(`   ════════════════════════════════════════\n`)
  
  return best.keyword
}

/**
 * Fetch multiple grid reports in parallel with controlled concurrency
 * OPTIMIZED: Uses ONE cached access token for ALL batches
 * Only fetches a new token if an auth error occurs
 * Implements retry logic with automatic re-authentication if token expires
 */
export async function fetchGridReportsParallel(
  scanIds: string[],
  getFreshTokenFn: () => Promise<string>,
  getGridReportWithTokenFn: (scanId: string, token: string) => Promise<GMBGridReportResponse>,
  concurrency: number = 5
): Promise<GMBGridReportResponse[]> {
  if (scanIds.length === 0) return []
  
  console.log(`[Grid Parallel Fetch] Fetching ${scanIds.length} grid reports with concurrency ${concurrency}`)
  
  const results: GMBGridReportResponse[] = []
  const errors: Array<{ scanId: string, error: any }> = []
  
  const maxRetries = 3
  const retryDelay = 1000 // 1 second
  
  // Get access token ONCE at the start (uses cached token if available)
  console.log(`[Grid Parallel Fetch] 🔑 Getting access token for all batches...`)
  let accessToken = await getFreshTokenFn()
  
  // Process in batches
  for (let i = 0; i < scanIds.length; i += concurrency) {
    const batch = scanIds.slice(i, i + concurrency)
    const batchNum = Math.floor(i / concurrency) + 1
    const totalBatches = Math.ceil(scanIds.length / concurrency)
    
    console.log(`\n[Grid Parallel Fetch] 📦 Batch ${batchNum}/${totalBatches} (${batch.length} scans)`)
    
    // Retry logic for this batch
    let batchSuccess = false
    
    for (let attempt = 1; attempt <= maxRetries && !batchSuccess; attempt++) {
      try {
        // Only get a new token if this is a retry after auth error
        if (attempt > 1) {
          console.log(`[Grid Parallel Fetch] 🔄 Getting fresh token for batch ${batchNum} retry (attempt ${attempt}/${maxRetries})`)
          accessToken = await getFreshTokenFn()
        } else {
          console.log(`[Grid Parallel Fetch] Using existing token for batch ${batchNum} (attempt ${attempt}/${maxRetries})`)
        }
        
        // Process all requests in this batch with the same token
        const batchPromises = batch.map(async (scanId) => {
          try {
            const report = await getGridReportWithTokenFn(scanId, accessToken)
            return { success: true as const, data: report }
          } catch (error: any) {
            // Check if it's an auth error
            const isAuthError = error.message?.includes('401') || error.message?.includes('403')
            return { success: false as const, scanId, error, isAuthError }
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        
        // Check if any auth errors occurred
        const authErrors = batchResults.filter(r => !r.success && r.isAuthError)
        
        if (authErrors.length > 0 && attempt < maxRetries) {
          // Token is expired/invalid - retry with fresh token
          console.log(`[Grid Parallel Fetch] ⚠️ Auth errors detected (${authErrors.length}/${batch.length})`)
          console.log(`[Grid Parallel Fetch] Token expired/invalid, will get fresh token and retry batch ${batchNum} after ${retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue // Retry the batch
        }
        
        // Process results
        for (const result of batchResults) {
          if (result.success) {
            results.push(result.data)
          } else {
            errors.push({ scanId: result.scanId, error: result.error })
          }
        }
        
        batchSuccess = true
        console.log(`[Grid Parallel Fetch] ✓ Batch ${batchNum} completed: ${batchResults.filter(r => r.success).length}/${batch.length} successful`)
        
      } catch (error: any) {
        console.error(`[Grid Parallel Fetch] Batch ${batchNum} attempt ${attempt} failed:`, error)
        
        // Check if it's a token/auth error
        if ((error.message?.includes('token') || error.message?.includes('Authentication')) && attempt < maxRetries) {
          console.log(`[Grid Parallel Fetch] Token error, will retry batch ${batchNum} after ${retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }
        
        // If last attempt, record all scans in batch as failed
        if (attempt === maxRetries) {
          for (const scanId of batch) {
            errors.push({ scanId, error })
          }
          batchSuccess = true // Mark as "complete" to move to next batch
        }
      }
    }
  }
  
  console.log(`\n[Grid Parallel Fetch] 📊 Final Results: ${results.length}/${scanIds.length} successful, ${errors.length} failed`)
  
  if (errors.length > 0) {
    console.warn(`[Grid Parallel Fetch] ⚠️ Failed scans:`, errors.map(e => e.scanId).join(', '))
  }
  
  return results
}
