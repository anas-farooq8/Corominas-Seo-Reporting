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
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-orange-600" />
          <CardTitle>Controlled Losers</CardTitle>
        </div>
        <CardDescription>
          These keywords dropped slightly in ranking (3 positions or less), but they&apos;re nothing to worry about. Small fluctuations like these are completely normal in SEO as search engines continuously update their algorithms and competitors make changes. We track them here for your reference and awareness, but they don&apos;t indicate a major issue. If any keyword were to drop more significantly, it would require closer attention.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Keyword</TableHead>
                <TableHead className="text-center">Previous Rank</TableHead>
                <TableHead className="text-center">Current Rank</TableHead>
                <TableHead className="text-center">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedLosers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No controlled losses found
                  </TableCell>
                </TableRow>
              ) : (
                displayedLosers.map((kw) => {
                  const changeDisplay = formatRankChange(kw.monthlyRankChange ?? 0)
                  return (
                    <TableRow key={kw._id}>
                      <TableCell className="font-medium">{kw.keyword}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{kw.rankA}</TableCell>
                      <TableCell className="text-center font-semibold">{kw.rankB}</TableCell>
                      <TableCell className={`text-center font-semibold ${changeDisplay.color}`}>
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
          <div className="mt-4 flex justify-center">
            {showAll ? (
              <Button 
                variant="outline" 
                onClick={() => setShowAll(false)}
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
                Show More ({losers.length - INITIAL_DISPLAY_COUNT} more)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

