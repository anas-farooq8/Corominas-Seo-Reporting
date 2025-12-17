"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from "lucide-react"
import type { KeywordComparison } from "@/lib/mangools/dashboard-utils"
import { formatRankChange } from "@/lib/mangools/dashboard-utils"

interface TopKeywordsTableProps {
  keywords: KeywordComparison[]
  monthAName: string
  monthBName: string
}

type SortColumn = 
  | 'rankA'
  | 'rankB'
  | 'rankChangeA'
  | 'rankChangeB'
  | 'rankAAvg'
  | 'rankBAvg'

type SortDirection = 'asc' | 'desc'

const INITIAL_DISPLAY_COUNT = 5

export function TopKeywordsTable({ keywords, monthAName, monthBName }: TopKeywordsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('rankB')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showAll, setShowAll] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  
  // Extract short month names (e.g., "Oct 2024" -> "Oct")
  const monthAShort = monthAName.split(' ')[0]
  const monthBShort = monthBName.split(' ')[0]

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle between: asc <-> desc
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New column: start with asc
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleShowLess = () => {
    setShowAll(false)
    // Reset to default sorting: Month B rank (ascending)
    setSortColumn('rankB')
    setSortDirection('asc')
  }

  const sortedKeywords = useMemo(() => {
    return [...keywords].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortColumn) {
        case 'rankA':
          aValue = a.rankA
          bValue = b.rankA
          break
        case 'rankB':
          aValue = a.rankB
          bValue = b.rankB
          break
        case 'rankChangeA':
          aValue = a.rankChangeA
          bValue = b.rankChangeA
          break
        case 'rankChangeB':
          aValue = a.rankChangeB
          bValue = b.rankChangeB
          break
        case 'rankAAvg':
          aValue = a.rankAAvg
          bValue = b.rankAAvg
          break
        case 'rankBAvg':
          aValue = a.rankBAvg
          bValue = b.rankBAvg
          break
      }

      // Handle null values - put them at the end
      if (aValue === null && bValue === null) return 0
      if (aValue === null) return 1
      if (bValue === null) return -1

      // Reverse sorting direction for change columns (negative = improvement, should be first in desc)
      const isChangeColumn = sortColumn === 'rankChangeA' || sortColumn === 'rankChangeB'
      const effectiveDirection = isChangeColumn 
        ? (sortDirection === 'asc' ? 'desc' : 'asc')
        : sortDirection

      // Compare values
      if (aValue < bValue) return effectiveDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return effectiveDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [keywords, sortColumn, sortDirection])

  // Display only first 10 or all based on showAll state
  const displayedKeywords = useMemo(() => {
    return showAll ? sortedKeywords : sortedKeywords.slice(0, INITIAL_DISPLAY_COUNT)
  }, [sortedKeywords, showAll])

  const SortIcon = ({ column }: { column: SortColumn }) => {
    const isActive = sortColumn === column
    if (!isActive) {
      return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-30" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-1 h-3 w-3 inline text-primary" />
    }
    return <ArrowDown className="ml-1 h-3 w-3 inline text-primary" />
  }
  return (
    <Card>
      <CardHeader className="bg-base/5 px-4 sm:px-6 py-2 sm:py-3 pb-0.5 sm:pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-primary text-base sm:text-lg">Top Keywords</CardTitle>
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="sm:hidden p-1 hover:bg-primary/10 rounded touch-manipulation"
            aria-label="Toggle description"
          >
            {showDescription ? (
              <ChevronUp className="h-4 w-4 text-primary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-primary" />
            )}
          </button>
        </div>
        <CardDescription className={`text-xs sm:text-sm ${showDescription ? 'block' : 'hidden sm:block'}`}>
          This comprehensive table shows all your tracked keywords with detailed performance metrics. For each keyword, you can see: <strong>Last Rank</strong> (current position in search results lower numbers are better), <strong>Rank Change</strong> (movement up ↑ or down ↓), and <strong>Avg Rank</strong> (average position over the month). Click any column header to sort and analyze your data. Compare {monthAName} vs {monthBName} side-by-side.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6 pt-1 sm:pt-1.5 pb-4 sm:pb-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10">
                <TableHead className="min-w-[150px] sm:min-w-[200px] font-semibold text-primary border-r text-xs sm:text-sm">
                  Keyword
                </TableHead>
                <TableHead className="text-center font-semibold text-primary border-r">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs sm:text-sm">Last Rank</span>
                    <div className="flex items-center text-[10px] sm:text-xs font-normal">
                      <button 
                        className="cursor-pointer flex items-center gap-0.5 px-1.5 sm:px-2 touch-manipulation"
                        onClick={() => handleSort('rankA')}
                      >
                        {monthAShort} <SortIcon column="rankA" />
                      </button>
                      <div className="h-4 w-px bg-border"></div>
                      <button 
                        className="cursor-pointer flex items-center gap-0.5 px-1.5 sm:px-2 touch-manipulation"
                        onClick={() => handleSort('rankB')}
                      >
                        {monthBShort} <SortIcon column="rankB" />
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-primary border-r">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs sm:text-sm">Rank Change</span>
                    <div className="flex items-center text-[10px] sm:text-xs font-normal">
                      <button 
                        className="cursor-pointer flex items-center gap-0.5 px-1.5 sm:px-2 touch-manipulation"
                        onClick={() => handleSort('rankChangeA')}
                      >
                        {monthAShort} <SortIcon column="rankChangeA" />
                      </button>
                      <div className="h-4 w-px bg-border"></div>
                      <button 
                        className="cursor-pointer flex items-center gap-0.5 px-1.5 sm:px-2 touch-manipulation"
                        onClick={() => handleSort('rankChangeB')}
                      >
                        {monthBShort} <SortIcon column="rankChangeB" />
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-primary border-r">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs sm:text-sm">Avg Rank</span>
                    <div className="flex items-center text-[10px] sm:text-xs font-normal">
                      <button 
                        className="cursor-pointer flex items-center gap-0.5 px-1.5 sm:px-2 touch-manipulation"
                        onClick={() => handleSort('rankAAvg')}
                      >
                        {monthAShort} <SortIcon column="rankAAvg" />
                      </button>
                      <div className="h-4 w-px bg-border"></div>
                      <button 
                        className="cursor-pointer flex items-center gap-0.5 px-1.5 sm:px-2 touch-manipulation"
                        onClick={() => handleSort('rankBAvg')}
                      >
                        {monthBShort} <SortIcon column="rankBAvg" />
                      </button>
                    </div>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedKeywords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground text-xs sm:text-sm">
                    No keywords found
                  </TableCell>
                </TableRow>
              ) : (
                displayedKeywords.map((kw) => {
                  const changeADisplay = formatRankChange(kw.rankChangeA)
                  const changeBDisplay = formatRankChange(kw.rankChangeB)
                  
                  return (
                    <TableRow key={kw._id}>
                      <TableCell className="font-medium py-1.5 sm:py-3 border-r text-[10px] sm:text-sm">{kw.keyword}</TableCell>
                      
                      {/* Rank: A | B */}
                      <TableCell className="text-center py-1.5 sm:py-3 border-r text-[10px] sm:text-sm">
                        <div className="flex items-center justify-center">
                          <span className="text-muted-foreground w-6 sm:w-10 text-right">
                            {kw.rankA !== null ? kw.rankA : "N/A"}
                          </span>
                          <div className="h-3 sm:h-4 w-px bg-border mx-1 sm:mx-2"></div>
                          <span className="font-bold w-6 sm:w-10 text-left">
                            {kw.rankB !== null ? kw.rankB : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Change: A | B */}
                      <TableCell className="text-center py-1.5 sm:py-3 border-r text-[10px] sm:text-sm">
                        <div className="flex items-center justify-center">
                          <span className={`${changeADisplay.color} w-8 sm:w-12 text-right`}>
                            {changeADisplay.symbol} {changeADisplay.value}
                          </span>
                          <div className="h-3 sm:h-4 w-px bg-border mx-1 sm:mx-2"></div>
                          <span className={`font-bold ${changeBDisplay.color} w-8 sm:w-12 text-left`}>
                            {changeBDisplay.symbol} {changeBDisplay.value}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Avg: A | B */}
                      <TableCell className="text-center py-1.5 sm:py-3 text-[10px] sm:text-sm">
                        <div className="flex items-center justify-center">
                          <span className="text-muted-foreground w-6 sm:w-10 text-right">
                            {kw.rankAAvg !== null ? kw.rankAAvg.toFixed(1) : "N/A"}
                          </span>
                          <div className="h-3 sm:h-4 w-px bg-border mx-1 sm:mx-2"></div>
                          <span className="font-bold w-6 sm:w-10 text-left">
                            {kw.rankBAvg !== null ? kw.rankBAvg.toFixed(1) : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Show More / Show Less Button */}
        {sortedKeywords.length > INITIAL_DISPLAY_COUNT && (
          <div className="mt-4 flex justify-center px-4 sm:px-0">
            {showAll ? (
              <Button 
                variant="outline" 
                onClick={handleShowLess}
                className="gap-2 h-10 sm:h-11 text-xs sm:text-sm touch-manipulation"
              >
                <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Show Less
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setShowAll(true)}
                className="gap-2 h-10 sm:h-11 text-xs sm:text-sm touch-manipulation"
              >
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Show More ({sortedKeywords.length - INITIAL_DISPLAY_COUNT} more)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
