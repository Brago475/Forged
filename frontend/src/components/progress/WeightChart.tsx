import { useState, useEffect } from 'react'
import type { WeightEntry } from '../../types'

export type WeightRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all'

interface WeightChartProps {
  data: WeightEntry[]
  range: WeightRange
}

/**
 * SVG line chart of weight over time. Supports 7d, 30d, 90d, 6m, 1y, all.
 * Animates the line path on mount.
 */
export function WeightChart({ data, range }: WeightChartProps) {
  const [drawn, setDrawn] = useState<boolean>(false)

  useEffect(() => {
    setDrawn(false)
    const t = setTimeout(() => setDrawn(true), 200)
    return () => clearTimeout(t)
  }, [data, range])

  if (data.length < 2) {
    return (
      <p className="text-sm text-forged-text2 text-center py-6">
        Need 2+ entries for this range
      </p>
    )
  }

  const w = 600, h = 160, px = 44, py = 16
  const vals = data.map(d => d.weight)
  const mn = Math.min(...vals) - 1
  const mx = Math.max(...vals) + 1
  const pts = data.map((d, i) => ({
    x: px + (i / (data.length - 1)) * (w - 2 * px),
    y: py + ((mx - d.weight) / (mx - mn)) * (h - 2 * py),
    weight: d.weight,
    date: d.date,
  }))

  const pathD = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1]
    const cpx = (prev.x + p.x) / 2
    return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
  }).join(' ')

  const fmt = (s: string): string =>
    new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Show fewer labels for longer ranges
  const labelStep = Math.max(1, Math.floor(data.length / 5))

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="wChartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6D28D9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6D28D9" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((f, i) => {
        const y = py + f * (h - 2 * py)
        return (
          <line key={i} x1={px} y1={y} x2={w - px} y2={y}
            stroke="var(--border)" strokeWidth="0.5" />
        )
      })}

      {pts.filter((_, i) => i % labelStep === 0).map((p, i) => (
        <text key={i} x={p.x} y={h - 2} fill="var(--text2)" fontSize="9"
          textAnchor="middle" fontFamily="-apple-system,system-ui,sans-serif">
          {fmt(p.date)}
        </text>
      ))}

      <path
        d={`${pathD} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`}
        fill="url(#wChartGrad)"
        opacity={drawn ? 1 : 0}
        style={{ transition: 'opacity 0.8s ease 0.2s' }}
      />
      <path
        d={pathD}
        fill="none"
        stroke="#6D28D9"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          strokeDasharray: drawn ? 'none' : '1200',
          strokeDashoffset: drawn ? 0 : 1200,
          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)',
        }}
      />

      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y} r="3"
          fill="var(--bg)"
          stroke="#6D28D9"
          strokeWidth="1.5"
          opacity={drawn ? 1 : 0}
          style={{ transition: `opacity 0.3s ease ${0.2 + i * 0.04}s` }}
        />
      ))}

      {drawn && (
        <g>
          <rect
            x={pts[pts.length - 1].x - 26}
            y={pts[pts.length - 1].y - 24}
            width="52" height="18" rx="5" fill="#6D28D9"
          />
          <text
            x={pts[pts.length - 1].x}
            y={pts[pts.length - 1].y - 12}
            fill="#fff" fontSize="10" fontWeight="600"
            textAnchor="middle"
            fontFamily="-apple-system,system-ui,sans-serif"
          >
            {data[data.length - 1].weight}
          </text>
        </g>
      )}
    </svg>
  )
}