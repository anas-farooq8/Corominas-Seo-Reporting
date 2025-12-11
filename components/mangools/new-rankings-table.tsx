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
  
  const displayedRankings = useMemo(() => {
    return showAll ? newRankings : newRankings.slice(0, INITIAL_DISPLAY_COUNT)
  }, [newRankings, showAll])
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <CardTitle>New Rankings</CardTitle>
        </div>
        <CardDescription>
          Keywords that went from unranked to ranked ≤100
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
                <TableHead className="text-center">Search Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRankings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No new rankings found
                  </TableCell>
                </TableRow>
              ) : (
                displayedRankings.map((kw) => (
                  <TableRow key={kw._id}>
                    <TableCell className="font-medium">{kw.keyword}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {kw.rankA !== null ? kw.rankA : "N/A"}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-blue-600">
                      {kw.rankB}
                    </TableCell>
                    <TableCell className="text-center">
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
                Show More ({newRankings.length - INITIAL_DISPLAY_COUNT} more)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

