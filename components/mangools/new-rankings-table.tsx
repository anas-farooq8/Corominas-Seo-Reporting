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
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import type { KeywordComparison } from "@/lib/mangools/dashboard-utils"

interface NewRankingsTableProps {
  newRankings: KeywordComparison[]
}

const INITIAL_DISPLAY_COUNT = 5

export function NewRankingsTable({ newRankings }: NewRankingsTableProps) {
  const [showAll, setShowAll] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  
  const displayedRankings = useMemo(() => {
    return showAll ? newRankings : newRankings.slice(0, INITIAL_DISPLAY_COUNT)
  }, [newRankings, showAll])
  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 py-2 sm:py-3 pb-0.5 sm:pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
            <CardTitle className="text-base sm:text-lg">New Rankings</CardTitle>
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
          Exciting news! These keywords just entered the top 100 search results for the first time (or returned after being unranked). Each new ranking is a potential source of organic traffic to your website. The <strong>Search Volume</strong> column shows how many people search for each term every month, helping you understand the opportunity size. The better these keywords rank over time, the more visitors they can bring to your site.
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
                <TableHead className="text-center text-[10px] sm:text-sm font-semibold text-primary">Search Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRankings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground text-[10px] sm:text-sm">
                    No new rankings found
                  </TableCell>
                </TableRow>
              ) : (
                displayedRankings.map((kw) => (
                  <TableRow key={kw._id}>
                    <TableCell className="font-medium text-[10px] sm:text-sm py-1.5 sm:py-3">{kw.keyword}</TableCell>
                    <TableCell className="text-center text-muted-foreground text-[10px] sm:text-sm py-1.5 sm:py-3">
                      {kw.rankA !== null ? kw.rankA : "N/A"}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-blue-600 text-[10px] sm:text-sm py-1.5 sm:py-3">
                      {kw.rankB}
                    </TableCell>
                    <TableCell className="text-center text-[10px] sm:text-sm py-1.5 sm:py-3">
                      {kw.searchVolumeB !== null ? kw.searchVolumeB.toLocaleString() : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Show More / Show Less Button */}
        {newRankings.length > INITIAL_DISPLAY_COUNT && (
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
                Show More ({newRankings.length - INITIAL_DISPLAY_COUNT} more)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

