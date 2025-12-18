"use client"

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { ArrowDown, ArrowUp, TrendingUp, MousePointerClick, Key } from "lucide-react"
import { formatNumber } from "@/lib/utils/dashboard-helpers"
import { memo } from "react"

interface KPICardProps {
  title: string
  icon: React.ReactNode
  currentValue: number
  previousValue: number
  currentLabel: string
  previousLabel: string
  colorScheme: 'purple' | 'green' | 'blue'
  percentageChange: {
    change: number
    isIncrease: boolean
  }
}

const colorClasses = {
  purple: {
    border: 'border-purple-200 dark:border-purple-900/50',
    bg: 'bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background',
    text: 'text-purple-700 dark:text-purple-400',
  },
  green: {
    border: 'border-green-200 dark:border-green-900/50',
    bg: 'bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background',
    text: 'text-green-700 dark:text-green-400',
  },
  blue: {
    border: 'border-blue-200 dark:border-blue-900/50',
    bg: 'bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background',
    text: 'text-blue-700 dark:text-blue-400',
  },
}

export const KPICard = memo(function KPICard({
  title,
  icon,
  currentValue,
  previousValue,
  currentLabel,
  previousLabel,
  colorScheme,
  percentageChange,
}: KPICardProps) {
  const colors = colorClasses[colorScheme]

  return (
    <Card className={`border-2 ${colors.border} ${colors.bg}`}>
      <CardHeader className="pb-0 px-3 sm:px-4 pt-0.5 sm:pt-1">
        <CardDescription className={`${colors.text} font-medium flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs`}>
          {icon}
          <span className="leading-tight">{title}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0.5 sm:pb-1 px-3 sm:px-4 pt-0.5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-0.5 sm:gap-1.5">
          <div className={`text-lg sm:text-2xl md:text-3xl font-bold ${colors.text}`}>
            {formatNumber(currentValue)}
          </div>
          <div
            className={`flex items-center gap-0.5 text-xs sm:text-sm font-bold flex-shrink-0 ${
              percentageChange.isIncrease ? "text-green-600" : "text-red-600"
            }`}
          >
            {percentageChange.isIncrease ? (
              <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="text-xs sm:text-sm">{percentageChange.change.toFixed(2)}%</span>
          </div>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight">
          <span className="font-medium">{currentLabel}:</span> {formatNumber(currentValue)} • <span className="font-medium">{previousLabel}:</span> {formatNumber(previousValue)}
        </p>
      </CardContent>
    </Card>
  )
})

