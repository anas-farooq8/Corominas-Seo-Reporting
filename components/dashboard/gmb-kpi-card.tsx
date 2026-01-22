"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"
import { memo } from "react"

interface GMBKPICardProps {
  title: string
  icon: React.ReactNode
  currentValue: number | string
  change: number
  isIncrease: boolean
  colorScheme: 'purple' | 'green' | 'blue' | 'orange'
  formatValue?: (value: number | string) => string
  subtitle?: string
  dateRange?: string // Optional date range to show the period
}

const colorClasses = {
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    text: 'text-purple-700 dark:text-purple-300',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    text: 'text-green-700 dark:text-green-300',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-700 dark:text-blue-300',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    text: 'text-orange-700 dark:text-orange-300',
  },
}

export const GMBKPICard = memo(function GMBKPICard({
  title,
  icon,
  currentValue,
  change,
  isIncrease,
  colorScheme,
  formatValue,
  subtitle,
  dateRange
}: GMBKPICardProps) {
  const colors = colorClasses[colorScheme]
  
  // Use custom formatter if provided
  const displayValue = formatValue 
    ? formatValue(currentValue) 
    : typeof currentValue === 'number' 
      ? currentValue.toFixed(1) 
      : currentValue

  return (
    <Card className={`${colors.bg} border-none shadow-sm`}>
      <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-2 sm:pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[9px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">
            {title}
          </CardTitle>
          <div className={`p-1 sm:p-1.5 rounded-lg ${colors.iconBg}`}>
            <div className={colors.iconColor}>
              {icon}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 sm:pb-4 px-3 sm:px-4 pt-0.5 sm:pt-1">
        <div className="flex items-end justify-between gap-1">
          <div className="min-w-0 flex-1">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {displayValue}
            </div>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight">
                {subtitle}
              </p>
            )}
            {dateRange && (
              <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 mt-0.5 leading-tight font-mono">
                {dateRange}
              </p>
            )}
          </div>
          <div
            className={`flex items-center gap-0.5 sm:gap-1 text-sm font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md flex-shrink-0 ${
              isIncrease 
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {isIncrease ? (
              <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            ) : (
              <ArrowDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            )}
            <span className="text-[10px] sm:text-xs">{change.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
