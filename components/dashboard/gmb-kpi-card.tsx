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
  subtitle
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
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </CardTitle>
          <div className={`p-1.5 rounded-lg ${colors.iconBg}`}>
            <div className={colors.iconColor}>
              {icon}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4 px-4 pt-1">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {displayValue}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-md ${
              isIncrease 
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {isIncrease ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            <span className="text-xs">{change.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
