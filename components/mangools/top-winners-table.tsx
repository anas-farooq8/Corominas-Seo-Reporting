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
import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import type { KeywordComparison } from "@/lib/mangools/dashboard-utils"
import { formatRankChange } from "@/lib/mangools/dashboard-utils"

interface TopWinnersTableProps {
  winners: KeywordComparison[]
}

const INITIAL_DISPLAY_COUNT = 5

export function TopWinnersTable({ winners }: TopWinnersTableProps) {
  const [showAll, setShowAll] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  
  const displayedWinners = useMemo(() => {
    return showAll ? winners : winners.slice(0, INITIAL_DISPLAY_COUNT)
  }, [winners, showAll])
  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 py-2 sm:py-3 pb-0.5 sm:pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            <CardTitle className="text-base sm:text-lg">Top Winners</CardTitle>
          </div>
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
          These are your star performers keywords that jumped up the most in search rankings this month. Higher rankings mean more visibility to potential customers searching for these terms. Focus on these successes to understand what&apos;s working in your SEO strategy. Each position gained increases the likelihood that people will click on your website in search results.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6 pt-1 sm:pt-1.5 pb-4 sm:pb-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10">
                <TableHead className="min-w-[120px] sm:min-w-[200px] text-[10px] sm:text-sm font-semibold text-primary">Keyword</TableHead>
                <TableHead className="text-center text-[10px] sm:text-sm font-semibold text-primary">Previous Rank</TableHead>
                <TableHead className="text-center text-[10px] sm:text-sm font-semibold text-primary">Current Rank</TableHead>
                <TableHead className="text-center text-[10px] sm:text-sm font-semibold text-primary">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedWinners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground text-[10px] sm:text-sm">
                    No improvements found
                  </TableCell>
                </TableRow>
              ) : (
                displayedWinners.map((kw) => {
                  const changeDisplay = formatRankChange(kw.monthlyRankChange ?? 0)
                  return (
                    <TableRow key={kw._id}>
                      <TableCell className="font-medium text-[10px] sm:text-sm py-1.5 sm:py-3">{kw.keyword}</TableCell>
                      <TableCell className="text-center text-muted-foreground text-[10px] sm:text-sm py-1.5 sm:py-3">{kw.rankA}</TableCell>
                      <TableCell className="text-center font-semibold text-[10px] sm:text-sm py-1.5 sm:py-3">{kw.rankB}</TableCell>
                      <TableCell className={`text-center font-semibold text-[10px] sm:text-sm py-1.5 sm:py-3 ${changeDisplay.color}`}>
                        {changeDisplay.symbol}{changeDisplay.value}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Show More / Show Less Button */}
        {winners.length > INITIAL_DISPLAY_COUNT && (
          <div className="mt-4 flex justify-center px-4 sm:px-0">
            {showAll ? (
              <Button 
                variant="outline" 
                onClick={() => setShowAll(false)}
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
                Show More ({winners.length - INITIAL_DISPLAY_COUNT} more)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

