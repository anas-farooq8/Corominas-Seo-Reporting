"use client"

import { memo, useMemo } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartLayerFilters, type LayerKey } from "./chart-layer-filters"
import { CustomSEMrushLegend, createSEMrushTooltip, formatNumber, formatDateForDisplay, formatFullDate } from "@/lib/utils/dashboard-helpers"
import type { SEMrushParsedDailyData } from "@/lib/semrush/api"

interface SEMrushChartProps {
  dailyData: SEMrushParsedDailyData[]
  visibleLayers: Record<LayerKey, boolean>
  onToggleLayer: (layer: LayerKey) => void
}

// Define layer configuration in a stable order (bottom to top visually)
const LAYER_ORDER = [
  { key: 'SERP functions' as LayerKey, dataKey: 'SERP functions', color: '#22c55e' },
  { key: 'AI Overviews' as LayerKey, dataKey: 'AI Overviews', color: '#8b5cf6' },
  { key: '51-100' as LayerKey, dataKey: '51-100', color: '#06b6d4' },
  { key: '21-50' as LayerKey, dataKey: '21-50', color: '#3b82f6' },
  { key: '11-20' as LayerKey, dataKey: '11-20', color: '#f59e0b' },
  { key: '4-10' as LayerKey, dataKey: '4-10', color: '#f97316' },
  { key: 'Top 3' as LayerKey, dataKey: 'Top 3', color: '#ef4444' },
] as const

export const SEMrushChart = memo(function SEMrushChart({ 
  dailyData, 
  visibleLayers, 
  onToggleLayer 
}: SEMrushChartProps) {
  const chartData = useMemo(() => 
    dailyData.map(day => ({
      date: formatDateForDisplay(day.date),
      dateKey: day.date,
      fullDate: formatFullDate(day.date),
      'Top 3': day.top3,
      '4-10': day.top4to10,
      '11-20': day.top11to20,
      '21-50': day.top21to50,
      '51-100': day.top51to100,
      'AI Overviews': day.aiOverviews,
      'SERP functions': day.serpFunctions,
      total: day.totalKeywords,
    })), 
    [dailyData]
  )

  const CustomTooltip = useMemo(() => createSEMrushTooltip(formatNumber), [])

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg md:text-xl">Total Ranking Keywords (Past 12 Months)</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              This chart shows how many search terms (keywords) your website appears for in Google results, grouped by how high they rank. Keywords in the <strong>Top 3</strong> positions get the most clicks, while those ranking <strong>4-10</strong> still get good visibility. Lower positions (11-100) mean fewer people see your site. The colored layers show how your keywords are distributed across these positions over time. More keywords moving into the top positions means better visibility and more potential visitors finding your website.
            </CardDescription>
          </div>
          <ChartLayerFilters visibleLayers={visibleLayers} onToggleLayer={onToggleLayer} />
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 md:px-6 pb-0.5 sm:pb-0">
        {/* Mobile Chart */}
        <ResponsiveContainer width="100%" height={400} className="sm:hidden">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9 }}
              angle={-45}
              textAnchor="end"
              height={50}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis tick={{ fontSize: 10 }} width={35} />
            <Tooltip content={<CustomTooltip />} />
            {/* Render all layers to maintain consistent stacking order */}
            {LAYER_ORDER.map((layer) => (
              <Area
                key={layer.key}
                type="monotone"
                dataKey={layer.dataKey}
                stackId="1"
                stroke={layer.color}
                fill={layer.color}
                fillOpacity={0.8}
                animationDuration={400}
                animationEasing="ease-in-out"
                hide={!visibleLayers[layer.key]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        {/* Desktop Chart */}
        <ResponsiveContainer width="100%" height={500} className="hidden sm:block">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={55}
              interval={Math.floor(chartData.length / 12)}
            />
            <YAxis tick={{ fontSize: 12 }} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomSEMrushLegend />} wrapperStyle={{ paddingTop: '10px' }} />
            {/* Render all layers to maintain consistent stacking order */}
            {LAYER_ORDER.map((layer) => (
              <Area
                key={layer.key}
                type="monotone"
                dataKey={layer.dataKey}
                stackId="1"
                stroke={layer.color}
                fill={layer.color}
                fillOpacity={0.8}
                animationDuration={400}
                animationEasing="ease-in-out"
                hide={!visibleLayers[layer.key]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})
