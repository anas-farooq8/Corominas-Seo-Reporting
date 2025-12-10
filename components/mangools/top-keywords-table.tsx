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
  | 'rankABest'
  | 'rankBBest'
  | 'searchVolumeA'
  | 'searchVolumeB'
  | 'performanceIndexChangeA'
  | 'performanceIndexChangeB'
  | 'estimatedVisitsA'
  | 'estimatedVisitsB'

type SortDirection = 'asc' | 'desc'

const INITIAL_DISPLAY_COUNT = 10

export function TopKeywordsTable({ keywords, monthAName, monthBName }: TopKeywordsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('rankB')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showAll, setShowAll] = useState(false)
  
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
        case 'rankABest':
          aValue = a.rankABest
          bValue = b.rankABest
          break
        case 'rankBBest':
          aValue = a.rankBBest
          bValue = b.rankBBest
          break
        case 'searchVolumeA':
          aValue = a.searchVolumeA
          bValue = b.searchVolumeA
          break
        case 'searchVolumeB':
          aValue = a.searchVolumeB
          bValue = b.searchVolumeB
          break
        case 'performanceIndexChangeA':
          aValue = a.performanceIndexChangeA
          bValue = b.performanceIndexChangeA
          break
        case 'performanceIndexChangeB':
          aValue = a.performanceIndexChangeB
          bValue = b.performanceIndexChangeB
          break
        case 'estimatedVisitsA':
          aValue = a.estimatedVisitsA
          bValue = b.estimatedVisitsA
          break
        case 'estimatedVisitsB':
          aValue = a.estimatedVisitsB
          bValue = b.estimatedVisitsB
          break
      }

      // Handle null values - put them at the end
      if (aValue === null && bValue === null) return 0
      if (aValue === null) return 1
      if (bValue === null) return -1

      // Compare values
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
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
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-primary">Top Keywords</CardTitle>
        <CardDescription>
          Comparison of {monthAName} vs {monthBName}. Click columns to sort.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10 hover:bg-primary/10">
                <TableHead className="min-w-[200px] font-semibold text-primary border-r">
                  Keyword
                </TableHead>
                <TableHead className="text-center font-semibold text-primary border-r" title={`The Last Position at the Month\n\nMonth A: ${monthAName}\nMonth B: ${monthBName}\n\nLower numbers are better (e.g., #1 is top position)`}>
                  <div className="flex flex-col items-center gap-1">
                    <span>Rank</span>
                    <div className="flex items-center text-xs font-normal">
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('rankA')}
                      >
                        {monthAShort} <SortIcon column="rankA" />
                      </button>
                      <div className="h-4 w-px bg-border"></div>
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('rankB')}
                      >
                        {monthBShort} <SortIcon column="rankB" />
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-primary border-r" title={`Position Change\n\nMonth A: ${monthAName}\nMonth B: ${monthBName}\n\nGreen ▲ = Improved (moved up in rankings)\nRed ▼ = Declined (moved down in rankings)`}>
                  <div className="flex flex-col items-center gap-1">
                    <span>Change</span>
                    <div className="flex items-center text-xs font-normal">
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('rankChangeA')}
                      >
                        {monthAShort} <SortIcon column="rankChangeA" />
                      </button>
                      <div className="h-4 w-px bg-border"></div>
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('rankChangeB')}
                      >
                        {monthBShort} <SortIcon column="rankChangeB" />
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-primary border-r" title={`The Average Position in the Time Frame\n\nMonth A: ${monthAName}\nMonth B: ${monthBName}\n\nAverage ranking position throughout the entire month`}>
                  <div className="flex flex-col items-center gap-1">
                    <span>Avg</span>
                    <div className="flex items-center text-xs font-normal">
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('rankAAvg')}
                      >
                        {monthAShort} <SortIcon column="rankAAvg" />
                      </button>
                      <div className="h-4 w-px bg-border"></div>
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('rankBAvg')}
                      >
                        {monthBShort} <SortIcon column="rankBAvg" />
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-primary border-r" title={`Best Position Achieved in the Time Frame\n\nMonth A: ${monthAName}\nMonth B: ${monthBName}\n\nThe highest ranking position (lowest number) achieved during the month`}>
                  <div className="flex flex-col items-center gap-1">
                    <span>Best</span>
                    <div className="flex items-center text-xs font-normal">
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('rankABest')}
                      >
                        {monthAShort} <SortIcon column="rankABest" />
                      </button>
                      <div className="h-4 w-px bg-border"></div>
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('rankBBest')}
                      >
                        {monthBShort} <SortIcon column="rankBBest" />
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-primary border-r" title={`Monthly Search Volume\n\nMonth A: ${monthAName}\nMonth B: ${monthBName}\n\nEstimated number of searches per month for this keyword`}>
                  <div className="flex flex-col items-center gap-1">
                    <span>Search</span>
                    <div className="flex items-center text-xs font-normal">
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('searchVolumeA')}
                      >
                        {monthAShort} <SortIcon column="searchVolumeA" />
                      </button>
                      <div className="h-4 w-px bg-border"></div>
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('searchVolumeB')}
                      >
                        {monthBShort} <SortIcon column="searchVolumeB" />
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-primary border-r" title={`Performance Index Change\n\nMonth A: ${monthAName}\nMonth B: ${monthBName}\n\nMeasures overall keyword performance change\nGreen (+) = Performance improved\nRed (-) = Performance declined`}>
                  <div className="flex flex-col items-center gap-1">
                    <span>PI</span>
                    <div className="flex items-center text-xs font-normal">
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('performanceIndexChangeA')}
                      >
                        {monthAShort} <SortIcon column="performanceIndexChangeA" />
                      </button>
                      <div className="h-4 w-px bg-border"></div>
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('performanceIndexChangeB')}
                      >
                        {monthBShort} <SortIcon column="performanceIndexChangeB" />
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold text-primary" title={`Estimated Visits\n\nMonth A: ${monthAName}\nMonth B: ${monthBName}\n\nEstimated number of visitors from this keyword based on ranking position and search volume`}>
                  <div className="flex flex-col items-center gap-1">
                    <span>EV</span>
                    <div className="flex items-center text-xs font-normal">
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('estimatedVisitsA')}
                      >
                        {monthAShort} <SortIcon column="estimatedVisitsA" />
                      </button>
                      <div className="h-4 w-px bg-border"></div>
                      <button 
                        className="hover:text-primary-foreground cursor-pointer flex items-center gap-0.5 px-2"
                        onClick={() => handleSort('estimatedVisitsB')}
                      >
                        {monthBShort} <SortIcon column="estimatedVisitsB" />
                      </button>
                    </div>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedKeywords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    No keywords found
                  </TableCell>
                </TableRow>
              ) : (
                displayedKeywords.map((kw) => {
                  const changeADisplay = formatRankChange(kw.rankChangeA)
                  const changeBDisplay = formatRankChange(kw.rankChangeB)
                  
                  // Format PI values with color
                  const piAValue = kw.performanceIndexChangeA
                  const piBValue = kw.performanceIndexChangeB
                  
                  const piAColor = piAValue !== null 
                    ? piAValue > 0 ? "text-green-600" : piAValue < 0 ? "text-red-600" : ""
                    : "text-muted-foreground"
                  const piBColor = piBValue !== null 
                    ? piBValue > 0 ? "text-green-600 font-bold" : piBValue < 0 ? "text-red-600 font-bold" : "font-bold"
                    : "font-bold"
                  
                  const piADisplay = piAValue !== null 
                    ? `${piAValue > 0 ? '+' : ''}${piAValue.toFixed(2)}` 
                    : "N/A"
                  const piBDisplay = piBValue !== null 
                    ? `${piBValue > 0 ? '+' : ''}${piBValue.toFixed(2)}` 
                    : "N/A"
                  
                  return (
                    <TableRow key={kw._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium py-3 border-r">{kw.keyword}</TableCell>
                      
                      {/* Rank: A | B */}
                      <TableCell className="text-center py-3 border-r">
                        <div className="flex items-center justify-center">
                          <span className="text-muted-foreground w-10 text-right">
                            {kw.rankA !== null ? kw.rankA : "N/A"}
                          </span>
                          <div className="h-4 w-px bg-border mx-2"></div>
                          <span className="font-bold w-10 text-left">
                            {kw.rankB !== null ? kw.rankB : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Change: A | B */}
                      <TableCell className="text-center py-3 border-r">
                        <div className="flex items-center justify-center">
                          <span className={`${changeADisplay.color} w-12 text-right`}>
                            {changeADisplay.symbol} {changeADisplay.value}
                          </span>
                          <div className="h-4 w-px bg-border mx-2"></div>
                          <span className={`font-bold ${changeBDisplay.color} w-12 text-left`}>
                            {changeBDisplay.symbol} {changeBDisplay.value}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Avg: A | B */}
                      <TableCell className="text-center py-3 border-r">
                        <div className="flex items-center justify-center">
                          <span className="text-muted-foreground w-10 text-right">
                            {kw.rankAAvg !== null ? kw.rankAAvg.toFixed(1) : "N/A"}
                          </span>
                          <div className="h-4 w-px bg-border mx-2"></div>
                          <span className="font-bold w-10 text-left">
                            {kw.rankBAvg !== null ? kw.rankBAvg.toFixed(1) : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Best: A | B */}
                      <TableCell className="text-center py-3 border-r">
                        <div className="flex items-center justify-center">
                          <span className="text-muted-foreground w-10 text-right">
                            {kw.rankABest !== null ? kw.rankABest : "N/A"}
                          </span>
                          <div className="h-4 w-px bg-border mx-2"></div>
                          <span className="font-bold w-10 text-left">
                            {kw.rankBBest !== null ? kw.rankBBest : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Search Volume: A | B */}
                      <TableCell className="text-center py-3 border-r">
                        <div className="flex items-center justify-center">
                          <span className="text-muted-foreground w-16 text-right">
                            {kw.searchVolumeA !== null ? kw.searchVolumeA.toLocaleString() : "N/A"}
                          </span>
                          <div className="h-4 w-px bg-border mx-2"></div>
                          <span className="font-bold w-16 text-left">
                            {kw.searchVolumeB !== null ? kw.searchVolumeB.toLocaleString() : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Performance Index: A | B (colored) */}
                      <TableCell className="text-center py-3 border-r">
                        <div className="flex items-center justify-center">
                          <span className={`${piAColor} w-14 text-right`}>
                            {piADisplay}
                          </span>
                          <div className="h-4 w-px bg-border mx-2"></div>
                          <span className={`${piBColor} w-14 text-left`}>
                            {piBDisplay}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Estimated Visits: A | B */}
                      <TableCell className="text-center py-3">
                        <div className="flex items-center justify-center">
                          <span className="text-muted-foreground w-16 text-right">
                            {kw.estimatedVisitsA !== null ? kw.estimatedVisitsA.toLocaleString() : "N/A"}
                          </span>
                          <div className="h-4 w-px bg-border mx-2"></div>
                          <span className="font-bold w-16 text-left">
                            {kw.estimatedVisitsB !== null ? kw.estimatedVisitsB.toLocaleString() : "N/A"}
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
          <div className="mt-4 flex justify-center">
            {showAll ? (
              <Button 
                variant="outline" 
                onClick={handleShowLess}
                className="gap-2"
              >
                <ChevronUp className="h-4 w-4" />
                Show Less
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setShowAll(true)}
                className="gap-2"
              >
                <ChevronDown className="h-4 w-4" />
                Show More ({sortedKeywords.length - INITIAL_DISPLAY_COUNT} more)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

