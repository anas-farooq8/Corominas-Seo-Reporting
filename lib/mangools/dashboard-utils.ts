import type { MangoolsStatsResponse, MangoolsKeywordStats } from "./api"

export interface KeywordComparison {
  _id: string
  keyword: string
  
  // Current month (B) data
  rankB: number | null
  rankChangeB: number | null
  rankBAvg: number | null
  rankBBest: number | null
  searchVolumeB: number | null
  estimatedVisitsB: number | null
  performanceIndexChangeB: number | null
  
  // Previous month (A) data
  rankA: number | null
  rankChangeA: number | null
  rankAAvg: number | null
  rankABest: number | null
  searchVolumeA: number | null
  estimatedVisitsA: number | null
  performanceIndexChangeA: number | null

  // Computed rank change between months (rankB - rankA)
  // Negative = improved (went up), Positive = declined (went down)
  monthlyRankChange: number | null
}

/**
 * Match keywords from both months and generate comparison data
 */
export function compareMonthlyKeywords(
  monthA: MangoolsStatsResponse,
  monthB: MangoolsStatsResponse,
  keywordsData: Array<{ _id: string; kw: string }>
): KeywordComparison[] {
  const comparisons: KeywordComparison[] = []
  
  // Create a map for easy lookup
  const monthAMap = new Map<string, MangoolsKeywordStats>()
  monthA.keywords.forEach(kw => monthAMap.set(kw._id, kw))
  
  const keywordNameMap = new Map<string, string>()
  keywordsData.forEach(kw => keywordNameMap.set(kw._id, kw.kw))
  
  // Process each keyword from month B (current month)
  monthB.keywords.forEach(kwB => {
    const kwA = monthAMap.get(kwB._id)
    
    // Debug specific keyword from raw API data
    if (kwB._id === '691c3ec0f265bb5eded2526d') {
      console.log(`\n[DEBUG - RAW API DATA] Keyword ID: 691c3ec0f265bb5eded2526d`)
      console.log(`  Month B (current):`, JSON.stringify({
        rank: kwB.rank,
        rank_change: kwB.rank_change,
      }, null, 2))
      console.log(`  Month A (previous):`, kwA ? JSON.stringify({
        rank: kwA.rank,
        rank_change: kwA.rank_change,
      }, null, 2) : 'NOT FOUND')
    }
    
    const rankB = kwB.rank?.last ?? null
    const rankA = kwA?.rank?.last ?? null
    
    // Compute monthly rank change: rankB - rankA
    // Negative = improved (went up), Positive = declined (went down)
    let monthlyRankChange: number | null = null
    if (rankB !== null && rankA !== null) {
      monthlyRankChange = rankB - rankA
    }
    
    // Build comparison object with data from both months
    const comparison: KeywordComparison = {
      _id: kwB._id,
      keyword: keywordNameMap.get(kwB._id) || "Unknown",
      
      // Month B (current month) - all data from kwB
      rankB: rankB,
      rankBAvg: kwB.rank?.avg ?? null,
      rankBBest: kwB.rank?.best ?? null,
      estimatedVisitsB: kwB.estimated_visits ?? null,
      performanceIndexChangeB: kwB.performanceIndexChange ?? null,
      searchVolumeB: kwB.search_volume ?? null,
      rankChangeB: kwB.rank_change ?? null,
      
      // Previous month (A) - all data from kwA
      rankA: rankA,
      rankAAvg: kwA?.rank?.avg ?? null,
      rankABest: kwA?.rank?.best ?? null,
      estimatedVisitsA: kwA?.estimated_visits ?? null,
      performanceIndexChangeA: kwA?.performanceIndexChange ?? null,
      searchVolumeA: kwA?.search_volume ?? null,
      rankChangeA: kwA?.rank_change ?? null,
      
      // Computed monthly rank change
      monthlyRankChange: monthlyRankChange,
    }
    
    comparisons.push(comparison)
  })
  
  // Debug: Log keywords with null rank_change values
  const nullRankChangeA = comparisons.filter(kw => kw.rankChangeA === null)
  const nullRankChangeB = comparisons.filter(kw => kw.rankChangeB === null)
  
  if (nullRankChangeA.length > 0) {
    console.log(`\n[DEBUG - NULL RANK_CHANGE] Found ${nullRankChangeA.length} keywords with null rankChangeA:`)
    nullRankChangeA.slice(0, 5).forEach(kw => {
      console.log(`  - "${kw.keyword}" (${kw._id}): rankA=${kw.rankA}, rankChangeA=null`)
    })
    if (nullRankChangeA.length > 5) {
      console.log(`  ... and ${nullRankChangeA.length - 5} more`)
    }
  }
  
  if (nullRankChangeB.length > 0) {
    console.log(`\n[DEBUG - NULL RANK_CHANGE] Found ${nullRankChangeB.length} keywords with null rankChangeB:`)
    nullRankChangeB.slice(0, 5).forEach(kw => {
      console.log(`  - "${kw.keyword}" (${kw._id}): rankB=${kw.rankB}, rankChangeB=null`)
    })
    if (nullRankChangeB.length > 5) {
      console.log(`  ... and ${nullRankChangeB.length - 5} more`)
    }
  }
  
  return comparisons
}

/**
 * Get top keywords sorted by search volume and best rank
 */
export function getTopKeywords(comparisons: KeywordComparison[]): KeywordComparison[] {
  return [...comparisons]
    .sort((a, b) => {
      // First sort by search volume (higher is better)
      const aVol = a.searchVolumeB ?? 0
      const bVol = b.searchVolumeB ?? 0
      if (bVol !== aVol) {
        return bVol - aVol
      }
      // If equal, sort by best rank (lower is better)
      const aBest = a.rankBBest ?? Infinity
      const bBest = b.rankBBest ?? Infinity
      return aBest - bBest
    })
}

/**
 * Get top winners (largest improvements)
 * Note: Negative monthlyRankChange = improvement (rank got better/lower number)
 * Example: rankA=20, rankB=9 → monthlyRankChange=-11 (improved by 11 positions)
 */
export function getTopWinners(comparisons: KeywordComparison[], limit = 5): KeywordComparison[] {
  return [...comparisons]
    .filter(kw => {
      const isNew = (kw.rankA === null || kw.rankA > 100) && kw.rankB !== null && kw.rankB <= 100
      const rankChange = kw.monthlyRankChange
      return !isNew && rankChange !== null && rankChange < 0 // Negative = improvement, exclude new rankings
    })
    .sort((a, b) => {
      const aChange = a.monthlyRankChange ?? 0
      const bChange = b.monthlyRankChange ?? 0
      return aChange - bChange // Most negative (best improvement) first
    })
    .slice(0, limit)
}

/**
 * Get new rankings (keywords that went from unranked to ranked ≤100)
 */
export function getNewRankings(comparisons: KeywordComparison[]): KeywordComparison[] {
  return [...comparisons]
    .filter(kw => {
      const isNew = (kw.rankA === null || kw.rankA > 100) && kw.rankB !== null && kw.rankB <= 100
      return isNew
    })
    .sort((a, b) => (b.searchVolumeB ?? 0) - (a.searchVolumeB ?? 0)) // Sort by search volume
}

/**
 * Get controlled losers (small drops, max 3 positions)
 * Note: Positive monthlyRankChange = decline (rank got worse/higher number)
 * Example: rankA=5, rankB=8 → monthlyRankChange=+3 (declined by 3 positions)
 */
export function getControlledLosers(comparisons: KeywordComparison[], limit = 5): KeywordComparison[] {
  return [...comparisons]
    .filter(kw => {
      const isNew = (kw.rankA === null || kw.rankA > 100) && kw.rankB !== null && kw.rankB <= 100
      const rankChange = kw.monthlyRankChange
      return !isNew && rankChange !== null && rankChange > 0 && rankChange <= 3 // Positive = decline, max 3 positions
    })
    .sort((a, b) => {
      const aChange = a.monthlyRankChange ?? 0
      const bChange = b.monthlyRankChange ?? 0
      return bChange - aChange // Most positive (worst decline) first
    })
    .slice(0, limit)
}

/**
 * Format rank change for display
 * Note: Negative change = rank improved (moved up), Positive = declined (moved down)
 * Examples: -11 → "▲11", 0 → "•", +5 → "▼5", null → "N/A"
 */
export function formatRankChange(change: number | null): { symbol: string; color: string; value: string } {
  if (change === null) {
    // No data available
    return {
      symbol: "",
      color: "text-muted-foreground",
      value: "N/A",
    }
  } else if (change < 0) {
    // Negative = rank improved (e.g., from rank 20 to rank 9 = -11)
    return {
      symbol: "▲",
      color: "text-green-600",
      value: `${Math.abs(change)}`, // Show as positive number with up arrow
    }
  } else if (change > 0) {
    // Positive = rank declined (e.g., from rank 5 to rank 12 = +7)
    return {
      symbol: "▼",
      color: "text-red-600",
      value: `${change}`,
    }
  } else {
    // No change
    return {
      symbol: "•",
      color: "text-gray-500",
      value: "",
    }
  }
}

/**
 * Format month name from date string
 */
export function formatMonthName(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

