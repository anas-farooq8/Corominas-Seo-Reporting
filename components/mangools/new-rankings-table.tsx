"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import type { KeywordComparison } from "@/lib/mangools/dashboard-utils"

interface NewRankingsTableProps {
  newRankings: KeywordComparison[]
}

export function NewRankingsTable({ newRankings }: NewRankingsTableProps) {
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
              {newRankings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No new rankings found
                  </TableCell>
                </TableRow>
              ) : (
                newRankings.map((kw) => (
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
      </CardContent>
    </Card>
  )
}

