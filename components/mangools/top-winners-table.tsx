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
  
  const displayedWinners = useMemo(() => {
    return showAll ? winners : winners.slice(0, INITIAL_DISPLAY_COUNT)
  }, [winners, showAll])
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <CardTitle>Top Winners</CardTitle>
        </div>
        <CardDescription>
          These are your star performers keywords that jumped up the most in search rankings this month. Higher rankings mean more visibility to potential customers searching for these terms. Focus on these successes to understand what&apos;s working in your SEO strategy. Each position gained increases the likelihood that people will click on your website in search results.
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
              {displayedWinners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No improvements found
                  </TableCell>
                </TableRow>
              ) : (
                displayedWinners.map((kw) => {
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
        {winners.length > INITIAL_DISPLAY_COUNT && (
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
                Show More ({winners.length - INITIAL_DISPLAY_COUNT} more)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

