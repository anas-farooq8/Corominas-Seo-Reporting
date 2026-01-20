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
// Grid Visualization Utilities (Deduplication)
// ============================================

/**
 * Sort grid cells for proper visualization (top-left to bottom-right)
 */
function sortGridCells<T extends { lat: number; lng: number }>(cells: T[]): T[] {
  return [...cells].sort((a, b) => {
    if (Math.abs(a.lat - b.lat) > 0.0001) {
      return b.lat - a.lat // Higher lat first (top to bottom)
    }
    return a.lng - b.lng // Lower lng first (left to right)
  })
}

/**
 * Format position for display (handles null/undefined)
 */
function formatPosition(position: number | null | undefined): string {
  return position !== null && position !== undefined
    ? position.toString().padStart(2, ' ')
    : 'XX'
}

/**
 * Visualize grid as matrix (centralized visualization logic)
 * Used by both debug functions and aggregation display
 */
function visualizeGridMatrix<T extends { lat: number; lng: number; position: number }>(
  cells: T[],
  gridSize: number,
  prefix: string = '   '
): void {
  const sortedCells = sortGridCells(cells)
  
  if (sortedCells.length === gridSize * gridSize) {
    // Perfect square grid - display as gridSize × gridSize
    for (let row = 0; row < gridSize; row++) {
      const rowStart = row * gridSize
      const rowEnd = rowStart + gridSize
      const rowCells = sortedCells.slice(rowStart, rowEnd)
      
      const positions = rowCells.map(c => `[${formatPosition(c.position)}]`).join(' ')
      console.log(`${prefix}${positions}`)
    }
  } else {
    // Not a perfect square - group by latitude
    const rows = new Map<string, T[]>()
    for (const cell of sortedCells) {
      const latKey = cell.lat.toFixed(5)
      if (!rows.has(latKey)) {
        rows.set(latKey, [])
      }
      rows.get(latKey)!.push(cell)
    }
    
    // Print each row
    const rowKeys = Array.from(rows.keys()).sort((a, b) => parseFloat(b) - parseFloat(a))
    for (const latKey of rowKeys) {
      const rowCells = rows.get(latKey)!.sort((a, b) => a.lng - b.lng)
      const positions = rowCells.map(c => `[${formatPosition(c.position)}]`).join(' ')
      console.log(`${prefix}${positions}`)
    }
  }
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
  
  // Find min/max coordinates
  const lats = coords.map(c => c.coord.lat)
  const lngs = coords.map(c => c.coord.lng)
  
  console.log(`   Coordinates: lat [${Math.min(...lats).toFixed(4)} to ${Math.max(...lats).toFixed(4)}], lng [${Math.min(...lngs).toFixed(4)} to ${Math.max(...lngs).toFixed(4)}]`)
  console.log(`   Matrix (${coords.length} cells):`)
  
  // Convert to GridCell format
  const cells = coords.map(c => ({
    lat: c.coord.lat,
    lng: c.coord.lng,
    position: c.position !== null && c.position !== undefined ? c.position : NULL_POSITION_VALUE
  }))
  
  visualizeGridMatrix(cells, gridSize, '     ')
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
  
  // Build aggregated grid
  const aggregatedGrid = {
    keyword: template.keyword,
    gridSize: template.gridSize,
    distance: template.distance,
    distanceUnit: template.distanceUnit,
    cells,
    centerLat,
    centerLng
  }
  
  // Calculate statistics
  const positions = cells.map(c => c.position)
  const avgPos = positions.reduce((a, b) => a + b, 0) / positions.length
  const bestPos = Math.min(...positions)
  const worstPos = Math.max(...positions)
  
  // Display final aggregated grid
  console.log(`\n🎯 FINAL AGGREGATED GRID (keyword: "${template.keyword}"):`)
  console.log(`   (${template.gridSize}×${template.gridSize} grid)\n`)
  
  visualizeGridMatrix(cells, template.gridSize, '   ')
  
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
 * 
 * IMPROVED SCORING FORMULA (Fixed for variable grid sizes):
 * 1. Average Position Score: Rewards lower average positions (0-120 scale)
 * 2. Tiered Position Score: Rewards cells in top 3, top 10, and top 20 (0-200 scale)
 * 3. Position Improvement Score: Rewards improvements & penalizes declines, NORMALIZED by grid size (0-150 scale, capped)
 * 4. Dynamic Weighting: Current performance (75%) more than improvements (25%)
 * 
 * FIXES APPLIED:
 * - Improvement score normalized by grid size (prevents larger grids from dominating)
 * - Improvement score capped at 150 (prevents overwhelming current performance)
 * - Added penalty for worsening positions (-0.3 weight)
 * - Added tiered scoring (top 3 most important, but top 10 and top 20 have value)
 * - Better balance between local pack and average position (200 vs 120)
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
  console.log(`\n📊 [Keyword Scoring] Analyzing ${keywordsWithData.length} keywords with IMPROVED formula...\n`)
  
  const scored = keywordsWithData.map((kw, index) => {
    const stats = kw.gridStats
    const lastMonthCells = kw.lastMonthGrid?.cells ?? []
    const totalCells = lastMonthCells.length
    
    // 1. AVERAGE POSITION SCORE (0-120 scale)
    // Lower position = better, normalized and inverted
    const avgPosition = stats.averagePosition ?? 21
    const avgPositionScore = (21 - avgPosition) * 6 // 0-120 range
    
    // 2. TIERED POSITION SCORE (0-200 scale)
    // Not just top 3 - also reward top 10 and top 20
    const tier1Count = lastMonthCells.filter(cell => cell.position <= 3).length   // Local Pack
    const tier2Count = lastMonthCells.filter(cell => cell.position > 3 && cell.position <= 10).length  // Page 1
    const tier3Count = lastMonthCells.filter(cell => cell.position > 10 && cell.position <= 20).length // Page 2
    
    const tier1Coverage = totalCells > 0 ? (tier1Count / totalCells) * 100 : 0
    const tier2Coverage = totalCells > 0 ? (tier2Count / totalCells) * 100 : 0
    const tier3Coverage = totalCells > 0 ? (tier3Count / totalCells) * 100 : 0
    
    const tieredScore = 
      tier1Coverage * 2.0 +    // Top 3: max 200 points (most important)
      tier2Coverage * 0.6 +    // 4-10: max 60 points (still valuable)
      tier3Coverage * 0.15     // 11-20: max 15 points (some visibility)
    // Total max: 275 points if 100% in top 3
    
    // 3. POSITION IMPROVEMENT SCORE (NORMALIZED & CAPPED)
    // Calculate improvement/decline magnitude, normalize by grid size, cap to prevent explosion
    let totalImprovementMagnitude = 0
    let improvementDetails: Array<{from: number, to: number, magnitude: number, type: 'improved' | 'worsened'}> = []
    let improvedCount = 0
    let worsenedCount = 0
    
    if (kw.previousMonthGrid && kw.lastMonthGrid) {
      const prevCellsMap = new Map<string, number>()
      kw.previousMonthGrid.cells.forEach(cell => {
        const key = `${cell.lat.toFixed(6)},${cell.lng.toFixed(6)}`
        prevCellsMap.set(key, cell.position)
      })
      
      kw.lastMonthGrid.cells.forEach(cell => {
        const key = `${cell.lat.toFixed(6)},${cell.lng.toFixed(6)}`
        const prevPosition = prevCellsMap.get(key)
        
        if (prevPosition !== undefined && prevPosition !== 21 && cell.position !== 21) {
          const change = prevPosition - cell.position // Positive = improved, negative = worsened
          
          if (change > 0) {
            // IMPROVED
            const magnitude = change * change // Square it
            totalImprovementMagnitude += magnitude
            improvementDetails.push({ from: prevPosition, to: cell.position, magnitude, type: 'improved' })
            improvedCount++
          } else if (change < 0) {
            // WORSENED - penalize but less than we reward improvements
            const magnitude = change * change * -0.3 // Negative penalty, 30% weight
            totalImprovementMagnitude += magnitude
            improvementDetails.push({ from: prevPosition, to: cell.position, magnitude, type: 'worsened' })
            worsenedCount++
          }
        }
      })
    }
    
    // NORMALIZE by grid size to make scores comparable across different grid sizes
    // Max possible improvement per cell: 20 positions → 400 magnitude
    // For 49 cells (7×7): max = 19,600
    // For 81 cells (9×9): max = 32,400
    // Normalize to 0-100 scale, then scale to 0-300 range, then cap at 150
    const maxPossibleMagnitude = totalCells * (20 * 20) // Max if every cell improved by 20 positions
    const normalizedImprovement = maxPossibleMagnitude > 0 
      ? (totalImprovementMagnitude / maxPossibleMagnitude) * 300 
      : 0
    const improvementScore = Math.max(Math.min(normalizedImprovement, 150), -50) // Cap at +150, floor at -50
    
    // 4. FINAL SCORE WITH ADJUSTED WEIGHTING
    // Current performance matters more (75%), improvement less (25%)
    const currentPerformanceWeight = 0.75
    const improvementWeight = 0.25
    
    const totalScore = 
      (avgPositionScore + tieredScore) * currentPerformanceWeight +
      improvementScore * improvementWeight
    
    // Debug output for this keyword
    console.log(`   ${index + 1}. "${kw.keyword}" (${totalCells} cells)`)
    console.log(`      ├─ Avg Position: ${avgPosition.toFixed(2)} → Score: ${avgPositionScore.toFixed(1)}`)
    console.log(`      ├─ Tiered Coverage:`)
    console.log(`      │  • Top 3: ${tier1Coverage.toFixed(1)}% (${tier1Count} cells) → ${(tier1Coverage * 2.0).toFixed(1)} pts`)
    console.log(`      │  • Top 10: ${tier2Coverage.toFixed(1)}% (${tier2Count} cells) → ${(tier2Coverage * 0.6).toFixed(1)} pts`)
    console.log(`      │  • Top 20: ${tier3Coverage.toFixed(1)}% (${tier3Count} cells) → ${(tier3Coverage * 0.15).toFixed(1)} pts`)
    console.log(`      │  • Total Tier Score: ${tieredScore.toFixed(1)}`)
    
    if (improvedCount > 0 || worsenedCount > 0) {
      console.log(`      ├─ Month-over-Month Changes:`)
      if (improvedCount > 0) {
        console.log(`      │  ✅ Improved: ${improvedCount} cells`)
        const topImprovements = improvementDetails.filter(d => d.type === 'improved').slice(0, 3)
        topImprovements.forEach(imp => {
          console.log(`      │     • ${imp.from}→${imp.to} (magnitude: ${imp.magnitude})`)
        })
        if (improvedCount > 3) {
          console.log(`      │     • ... and ${improvedCount - 3} more`)
        }
      }
      if (worsenedCount > 0) {
        console.log(`      │  ❌ Worsened: ${worsenedCount} cells`)
        const topDeclines = improvementDetails.filter(d => d.type === 'worsened').slice(0, 2)
        topDeclines.forEach(imp => {
          console.log(`      │     • ${imp.from}→${imp.to} (penalty: ${imp.magnitude.toFixed(1)})`)
        })
        if (worsenedCount > 2) {
          console.log(`      │     • ... and ${worsenedCount - 2} more`)
        }
      }
      console.log(`      ├─ Raw Improvement: ${totalImprovementMagnitude.toFixed(1)}`)
      console.log(`      ├─ Normalized & Capped: ${improvementScore.toFixed(1)} (max ±150)`)
    } else {
      console.log(`      ├─ Month-over-Month: No changes`)
    }
    
    console.log(`      └─ 🎯 TOTAL SCORE: ${totalScore.toFixed(2)} (higher is better)`)
    console.log('')
    
    return {
      keyword: kw,
      score: totalScore,
      avgPos: avgPosition,
      localPackCoverage: tier1Coverage, // Keep for compatibility
      localPackCount: tier1Count,
      tier1Coverage,
      tier2Coverage,
      tier3Coverage,
      tieredScore,
      improvementScore,
      improvementDetails,
      improved: improvedCount,
      worsened: worsenedCount,
      totalCells: totalCells
    }
  })
  
  // Sort by score (highest is best)
  scored.sort((a, b) => b.score - a.score)
  
  // Show ranking
  console.log(`📈 [Keyword Ranking] Results (best to worst):\n`)
  scored.forEach((item, index) => {
    const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
    const changeIndicator = item.improved > item.worsened ? '📈' : item.worsened > item.improved ? '📉' : '➡️'
    console.log(`   ${medal} "${item.keyword.keyword}" - Score: ${item.score.toFixed(2)} | Avg: ${item.avgPos.toFixed(1)} | Top3: ${item.tier1Coverage.toFixed(0)}% ${changeIndicator}`)
  })
  
  const best = scored[0]
  console.log(`\n✅ [Best Keyword Selected] "${best.keyword.keyword}"`)
  console.log(`   ├─ Grid Size: ${best.totalCells} cells (${Math.sqrt(best.totalCells).toFixed(0)}×${Math.sqrt(best.totalCells).toFixed(0)})`)
  console.log(`   ├─ Average Position: ${best.avgPos.toFixed(2)}`)
  console.log(`   ├─ Top 3 Coverage: ${best.tier1Coverage.toFixed(1)}% (${best.localPackCount} cells)`)
  console.log(`   ├─ Top 10 Coverage: ${(best.tier1Coverage + best.tier2Coverage).toFixed(1)}%`)
  console.log(`   ├─ Improved/Worsened: ${best.improved}/${best.worsened} cells`)
  console.log(`   └─ Final Score: ${best.score.toFixed(2)}`)
  console.log(`   ════════════════════════════════════════\n`)
  
  return best.keyword
}

// ============================================
// Parallel Fetch Utilities (Deduplication)
// ============================================

const PARALLEL_MAX_RETRIES = 3
const PARALLEL_RETRY_DELAY = 1000 // 1 second

/**
 * Result from a single grid report fetch
 */
type FetchResult = 
  | { success: true; data: GMBGridReportResponse }
  | { success: false; scanId: string; error: any; isAuthError: boolean }

/**
 * Check if error is auth-related
 */
function isAuthError(error: any): boolean {
  return error.message?.includes('401') || error.message?.includes('403')
}

/**
 * Fetch a single batch of grid reports
 */
async function fetchBatch(
  batch: string[],
  accessToken: string,
  getGridReportWithTokenFn: (scanId: string, token: string) => Promise<GMBGridReportResponse>
): Promise<FetchResult[]> {
  const promises = batch.map(async (scanId): Promise<FetchResult> => {
    try {
      const report = await getGridReportWithTokenFn(scanId, accessToken)
      return { success: true, data: report }
    } catch (error: any) {
      return { success: false, scanId, error, isAuthError: isAuthError(error) }
    }
  })
  
  return Promise.all(promises)
}

/**
 * Process batch results and extract successful/failed items
 */
function processBatchResults(results: FetchResult[]): {
  successful: GMBGridReportResponse[]
  failed: Array<{ scanId: string; error: any }>
  authErrorCount: number
} {
  const successful: GMBGridReportResponse[] = []
  const failed: Array<{ scanId: string; error: any }> = []
  let authErrorCount = 0
  
  for (const result of results) {
    if (result.success) {
      successful.push(result.data)
    } else {
      failed.push({ scanId: result.scanId, error: result.error })
      if (result.isAuthError) {
        authErrorCount++
      }
    }
  }
  
  return { successful, failed, authErrorCount }
}

/**
 * Fetch multiple grid reports in parallel with controlled concurrency
 * 
 * OPTIMIZED:
 * - Uses ONE cached access token for ALL batches
 * - Only fetches new token on auth errors
 * - Automatic retry with re-authentication
 * - Centralized error handling
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
  const allErrors: Array<{ scanId: string; error: any }> = []
  
  // Get access token ONCE at the start (uses cached token if available)
  console.log(`[Grid Parallel Fetch] 🔑 Getting access token for all batches...`)
  let accessToken = await getFreshTokenFn()
  
  // Process in batches
  const totalBatches = Math.ceil(scanIds.length / concurrency)
  
  for (let i = 0; i < scanIds.length; i += concurrency) {
    const batch = scanIds.slice(i, i + concurrency)
    const batchNum = Math.floor(i / concurrency) + 1
    
    console.log(`\n[Grid Parallel Fetch] 📦 Batch ${batchNum}/${totalBatches} (${batch.length} scans)`)
    
    // Retry logic for this batch
    let batchComplete = false
    
    for (let attempt = 1; attempt <= PARALLEL_MAX_RETRIES && !batchComplete; attempt++) {
      try {
        // Get fresh token only on retry attempts (after auth errors)
        if (attempt > 1) {
          console.log(`[Grid Parallel Fetch] 🔄 Getting fresh token for retry (attempt ${attempt}/${PARALLEL_MAX_RETRIES})`)
          accessToken = await getFreshTokenFn()
        } else {
          console.log(`[Grid Parallel Fetch] Using cached token (attempt ${attempt}/${PARALLEL_MAX_RETRIES})`)
        }
        
        // Fetch all reports in this batch
        const batchResults = await fetchBatch(batch, accessToken, getGridReportWithTokenFn)
        const { successful, failed, authErrorCount } = processBatchResults(batchResults)
        
        // If auth errors occurred and we can retry, do so
        if (authErrorCount > 0 && attempt < PARALLEL_MAX_RETRIES) {
          console.log(`[Grid Parallel Fetch] ⚠️ Auth errors: ${authErrorCount}/${batch.length} - retrying after ${PARALLEL_RETRY_DELAY}ms...`)
          await new Promise(resolve => setTimeout(resolve, PARALLEL_RETRY_DELAY))
          continue
        }
        
        // Add results
        results.push(...successful)
        allErrors.push(...failed)
        
        batchComplete = true
        console.log(`[Grid Parallel Fetch] ✓ Batch ${batchNum}: ${successful.length}/${batch.length} successful`)
        
      } catch (error: any) {
        console.error(`[Grid Parallel Fetch] Batch ${batchNum} attempt ${attempt} failed:`, error)
        
        // Retry on token/auth errors
        if (isAuthError(error) && attempt < PARALLEL_MAX_RETRIES) {
          console.log(`[Grid Parallel Fetch] Token error - retrying after ${PARALLEL_RETRY_DELAY}ms...`)
          await new Promise(resolve => setTimeout(resolve, PARALLEL_RETRY_DELAY))
          continue
        }
        
        // Last attempt - record all as failed
        if (attempt === PARALLEL_MAX_RETRIES) {
          allErrors.push(...batch.map(scanId => ({ scanId, error })))
          batchComplete = true
        }
      }
    }
  }
  
  console.log(`\n[Grid Parallel Fetch] 📊 Final: ${results.length}/${scanIds.length} successful, ${allErrors.length} failed`)
  
  if (allErrors.length > 0) {
    console.warn(`[Grid Parallel Fetch] ⚠️ Failed scans:`, allErrors.map(e => e.scanId.substring(0, 8)).join(', '))
  }
  
  return results
}
