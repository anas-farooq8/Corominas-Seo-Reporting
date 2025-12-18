"use client"

import { memo } from "react"

export type LayerKey = 'Top 3' | '4-10' | '11-20' | '21-50' | '51-100' | 'AI Overviews' | 'SERP functions'

interface ChartLayerFiltersProps {
  visibleLayers: Record<LayerKey, boolean>
  onToggleLayer: (layer: LayerKey) => void
}

const layerConfig = [
  { key: 'Top 3' as LayerKey, color: '#ef4444', label: 'Top 3' },
  { key: '4-10' as LayerKey, color: '#f97316', label: '4-10' },
  { key: '11-20' as LayerKey, color: '#f59e0b', label: '11-20' },
  { key: '21-50' as LayerKey, color: '#3b82f6', label: '21-50' },
  { key: '51-100' as LayerKey, color: '#06b6d4', label: '51-100' },
  { key: 'AI Overviews' as LayerKey, color: '#8b5cf6', label: 'AI Overviews' },
  { key: 'SERP functions' as LayerKey, color: '#22c55e', label: 'SERP functions' },
]

export const ChartLayerFilters = memo(function ChartLayerFilters({ 
  visibleLayers, 
  onToggleLayer 
}: ChartLayerFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 items-start">
      {layerConfig.map((layer) => (
        <button
          key={layer.key}
          onClick={() => onToggleLayer(layer.key)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all cursor-pointer ${
            visibleLayers[layer.key]
              ? 'bg-opacity-20 hover:bg-opacity-30'
              : 'bg-gray-100 opacity-50 hover:opacity-70'
          }`}
          style={{
            backgroundColor: visibleLayers[layer.key] 
              ? layer.color + '33' 
              : undefined
          }}
        >
          <div
            className="w-3 h-3 rounded-sm flex items-center justify-center"
            style={{ backgroundColor: layer.color }}
          >
            {visibleLayers[layer.key] && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className="font-medium whitespace-nowrap">{layer.label}</span>
        </button>
      ))}
    </div>
  )
})

