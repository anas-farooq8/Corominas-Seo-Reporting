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
import { TrendingDown, ChevronDown, ChevronUp } from "lucide-react"
import type { KeywordComparison } from "@/lib/mangools/dashboard-utils"
import { formatRankChange } from "@/lib/mangools/dashboard-utils"

interface ControlledLosersTableProps {
  losers: KeywordComparison[]
}

const INITIAL_DISPLAY_COUNT = 5

export function ControlledLosersTable({ losers }: ControlledLosersTableProps) {
  const [showAll, setShowAll] = useState(false)
  
  const displayedLosers = useMemo(() => {
    return showAll ? losers : losers.slice(0, INITIAL_DISPLAY_COUNT)
  }, [losers, showAll])
  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
          <CardTitle className="text-base sm:text-lg">Controlled Losers</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          These keywords dropped slightly in ranking (3 positions or less), but they&apos;re nothing to worry about. Small fluctuations like these are completely normal in SEO as search engines continuously update their algorithms and competitors make changes. We track them here for your reference and awareness, but they don&apos;t indicate a major issue. If any keyword were to drop more significantly, it would require closer attention.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6 pb-4 sm:pb-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px] sm:min-w-[200px] text-xs sm:text-sm">Keyword</TableHead>
                <TableHead className="text-center text-xs sm:text-sm">Previous Rank</TableHead>
                <TableHead className="text-center text-xs sm:text-sm">Current Rank</TableHead>
                <TableHead className="text-center text-xs sm:text-sm">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedLosers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground text-xs sm:text-sm">
                    No controlled losses found
                  </TableCell>
                </TableRow>
              ) : (
                displayedLosers.map((kw) => {
                  const changeDisplay = formatRankChange(kw.monthlyRankChange ?? 0)
                  return (
                    <TableRow key={kw._id}>
                      <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-3">{kw.keyword}</TableCell>
                      <TableCell className="text-center text-muted-foreground text-xs sm:text-sm py-2 sm:py-3">{kw.rankA}</TableCell>
                      <TableCell className="text-center font-semibold text-xs sm:text-sm py-2 sm:py-3">{kw.rankB}</TableCell>
                      <TableCell className={`text-center font-semibold text-xs sm:text-sm py-2 sm:py-3 ${changeDisplay.color}`}>
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
        {losers.length > INITIAL_DISPLAY_COUNT && (
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
                Show More ({losers.length - INITIAL_DISPLAY_COUNT} more)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

