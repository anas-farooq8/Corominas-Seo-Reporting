"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import type { KeywordComparison } from "@/lib/mangools/dashboard-utils"

interface KeywordPositionFlowProps {
  keywords: KeywordComparison[]
  monthAName: string
  monthBName: string
}

export function KeywordPositionFlow({ keywords, monthAName, monthBName }: KeywordPositionFlowProps) {
  // Calculate stats for Month B using rank_change from API (rankChangeB)
  // Skip keywords where rank_change is null
  const statsB = keywords.reduce(
    (acc, kw) => {
      const change = kw.rankChangeB
      
      // Skip null values
      if (change === null) return acc
      
      if (change < 0) {
        acc.wentUp++
      } else if (change > 0) {
        acc.wentDown++
      } else {
        acc.unchanged++
      }
      return acc
    },
    { wentUp: 0, wentDown: 0, unchanged: 0 }
  )

  const totalB = statsB.wentUp + statsB.wentDown + statsB.unchanged
  const upPercentB = totalB > 0 ? (statsB.wentUp / totalB) * 100 : 0
  const downPercentB = totalB > 0 ? (statsB.wentDown / totalB) * 100 : 0
  const unchangedPercentB = totalB > 0 ? (statsB.unchanged / totalB) * 100 : 0

  // Calculate stats for Month A using rank_change from API (rankChangeA)
  // Skip keywords where rank_change is null
  const statsA = keywords.reduce(
    (acc, kw) => {
      const change = kw.rankChangeA
      
      // Skip null values
      if (change === null) return acc
      
      if (change < 0) {
        acc.wentUp++
      } else if (change > 0) {
        acc.wentDown++
      } else {
        acc.unchanged++
      }
      return acc
    },
    { wentUp: 0, wentDown: 0, unchanged: 0 }
  )

  const totalA = statsA.wentUp + statsA.wentDown + statsA.unchanged
  const upPercentA = totalA > 0 ? (statsA.wentUp / totalA) * 100 : 0
  const downPercentA = totalA > 0 ? (statsA.wentDown / totalA) * 100 : 0
  const unchangedPercentA = totalA > 0 ? (statsA.unchanged / totalA) * 100 : 0

  // Calculate comparison/difference
  const upDiff = statsB.wentUp - statsA.wentUp
  const downDiff = statsB.wentDown - statsA.wentDown
  const unchangedDiff = statsB.unchanged - statsA.unchanged

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword Position Flow</CardTitle>
        <CardDescription>
          This section shows how many of your tracked keywords improved their ranking (went up), declined (went down), or stayed the same (unchanged) compared to the previous month. The visual bars help you quickly see the proportion of positive vs. negative movement. More green means more keywords are climbing in search results, which increases your website&apos;s visibility to potential customers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Month A Stats */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-3">{monthAName}</div>
            <div className="space-y-3">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                    <TrendingUp className="h-5 w-5" />
                    {statsA.wentUp}
                  </div>
                  <div className="text-sm text-muted-foreground">went up</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">
                    <TrendingDown className="h-5 w-5" />
                    {statsA.wentDown}
                  </div>
                  <div className="text-sm text-muted-foreground">went down</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500">
                    {statsA.unchanged}
                  </div>
                  <div className="text-sm text-muted-foreground">unchanged</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="flex h-full">
                  {upPercentA > 0 && (
                    <div
                      className="bg-green-500"
                      style={{ width: `${upPercentA}%` }}
                      title={`${statsA.wentUp} keywords improved (${upPercentA.toFixed(1)}%)`}
                    />
                  )}
                  {downPercentA > 0 && (
                    <div
                      className="bg-red-500"
                      style={{ width: `${downPercentA}%` }}
                      title={`${statsA.wentDown} keywords declined (${downPercentA.toFixed(1)}%)`}
                    />
                  )}
                  {unchangedPercentA > 0 && (
                    <div
                      className="bg-gray-400"
                      style={{ width: `${unchangedPercentA}%` }}
                      title={`${statsA.unchanged} keywords unchanged (${unchangedPercentA.toFixed(1)}%)`}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Arrow Separator */}
          <div className="flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Month B Stats with Comparison */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-3">{monthBName}</div>
            <div className="space-y-3">
              {/* Stats Grid with Comparison */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                    <TrendingUp className="h-5 w-5" />
                    {statsB.wentUp}
                  </div>
                  <div className="text-sm text-muted-foreground">went up</div>
                  {upDiff !== 0 && (
                    <div className={`text-xs font-medium mt-1 ${upDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {upDiff > 0 ? '+' : ''}{upDiff}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">
                    <TrendingDown className="h-5 w-5" />
                    {statsB.wentDown}
                  </div>
                  <div className="text-sm text-muted-foreground">went down</div>
                  {downDiff !== 0 && (
                    <div className={`text-xs font-medium mt-1 ${downDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {downDiff > 0 ? '+' : ''}{downDiff}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500">
                    {statsB.unchanged}
                  </div>
                  <div className="text-sm text-muted-foreground">unchanged</div>
                  {unchangedDiff !== 0 && (
                    <div className={`text-xs font-medium mt-1 text-muted-foreground`}>
                      {unchangedDiff > 0 ? '+' : ''}{unchangedDiff}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="flex h-full">
                  {upPercentB > 0 && (
                    <div
                      className="bg-green-500"
                      style={{ width: `${upPercentB}%` }}
                      title={`${statsB.wentUp} keywords improved (${upPercentB.toFixed(1)}%)`}
                    />
                  )}
                  {downPercentB > 0 && (
                    <div
                      className="bg-red-500"
                      style={{ width: `${downPercentB}%` }}
                      title={`${statsB.wentDown} keywords declined (${downPercentB.toFixed(1)}%)`}
                    />
                  )}
                  {unchangedPercentB > 0 && (
                    <div
                      className="bg-gray-400"
                      style={{ width: `${unchangedPercentB}%` }}
                      title={`${statsB.unchanged} keywords unchanged (${unchangedPercentB.toFixed(1)}%)`}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

