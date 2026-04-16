import { useEffect, useState } from 'react'
import type { WeightEntry } from '../../types'

interface MiniWeightChartProps {
  data: WeightEntry[]
}

/**
 * Compact SVG sparkline of the last 10 weight entries.
 * Uses cubic bezier curves between points and a gradient fill.
 */
export function MiniWeightChart({ data }: MiniWeightChartProps) {
  const [drawn, setDrawn] = useState<boolean>(false)

  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), 300)
    return () => clearTimeout(timer)
  }, [])

  if (data.length < 2) {
    return (
      <p className="text-xs text-forged-text2 text-center py-2">
        Need 2+ entries for chart
      </p>
    )
  }

  const recent = data.slice(-10)
  const width = 500
  const height = 60
  const padX = 10
  const padY = 6

  const weights = recent.map(d => d.weight)
  const min = Math.min(...weights) - 0.5
  const max = Math.max(...weights) + 0.5

  const points = recent.map((d, i) => ({
    x: padX + (i / (recent.length - 1)) * (width - 2 * padX),
    y: padY + ((max - d.weight) / (max - min)) * (height - 2 * padY),
  }))

  const pathD = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const prev = points[i - 1]
      const cpx = (prev.x + p.x) / 2
      return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
    })
    .join(' ')

  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]
  const areaD = `${pathD} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="mcg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9b59b6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#9b59b6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gradient fill */}
      <path
        d={areaD}
        fill="url(#mcg)"
        opacity={drawn ? 1 : 0}
        style={{ transition: 'opacity 0.5s ease' }}
      />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="#9b59b6"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={drawn ? 1 : 0}
        style={{ transition: 'opacity 0.5s ease 0.2s' }}
      />
    </svg>
  )
}