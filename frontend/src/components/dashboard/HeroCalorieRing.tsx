import { useEffect, useState } from 'react'

interface HeroCalorieRingProps {
  /** 0 to 1. Percentage of calorie goal consumed. */
  pct: number
}

/**
 * Animated SVG ring showing calorie progress. Fills clockwise
 * with a purple stroke and a glow filter on the leading edge.
 */
export function HeroCalorieRing({ pct }: HeroCalorieRingProps) {
  const size = 110
  const strokeWidth = 9
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const [offset, setOffset] = useState<number>(circumference)

  useEffect(() => {
    const timer = setTimeout(
      () => setOffset(circumference * (1 - pct)),
      200
    )
    return () => clearTimeout(timer)
  }, [pct, circumference])

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          opacity={0.4}
        />
        {/* Filled arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#9b59b6"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1)',
            filter: 'drop-shadow(0 0 12px rgba(155,89,182,0.5))',
          }}
        />
      </svg>

      {/* Center percentage label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-black text-forged-purple tabular-nums">
          {Math.round(pct * 100)}%
        </span>
      </div>
    </div>
  )
}