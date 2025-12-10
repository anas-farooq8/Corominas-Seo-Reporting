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
import { TrendingUp } from "lucide-react"
import type { KeywordComparison } from "@/lib/mangools/dashboard-utils"
import { formatRankChange } from "@/lib/mangools/dashboard-utils"

interface TopWinnersTableProps {
  winners: KeywordComparison[]
}

export function TopWinnersTable({ winners }: TopWinnersTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <CardTitle>Top Winners</CardTitle>
        </div>
        <CardDescription>
          Keywords with the largest positive improvements
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
              {winners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No improvements found
                  </TableCell>
                </TableRow>
              ) : (
                winners.map((kw) => {
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
      </CardContent>
    </Card>
  )
}

