/**
 * In-app page loader. A weight plate with FORGED curved on top,
 * a tagline curved on the bottom, two parallel purple rings at
 * the outer edge, and a center hole with a pulsing gold dot.
 *
 * Pulses scale up/down instead of rotating (keeps text readable).
 * Uses theme tokens so colors adapt when themes change.
 */
export function PageLoader() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 40,
      }}
    >
      <svg
        width="160"
        height="160"
        viewBox="0 0 200 200"
        style={{
          animation: 'platePulse 1.6s ease-in-out infinite',
          transformOrigin: 'center',
        }}
      >
        <defs>
          <path id="plateTopCurve" d="M 40,100 A 60,60 0 0 1 160,100" fill="none" />
          <path id="plateBotCurve" d="M 40,100 A 60,60 0 0 0 160,100" fill="none" />
        </defs>

        {/* Outer railroad ring */}
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="none"
          stroke="var(--accent-purple)"
          strokeWidth="2"
        />

        {/* Plate body */}
        <circle cx="100" cy="100" r="88" fill="var(--bg-surface)" />

        {/* Inner railroad ring */}
        <circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke="var(--accent-purple)"
          strokeWidth="2"
        />

        {/* FORGED on top */}
        <text
          fontFamily="-apple-system, 'Segoe UI', sans-serif"
          fontWeight="900"
          fontSize="14"
          fill="var(--text)"
          letterSpacing="8"
        >
          <textPath href="#plateTopCurve" startOffset="50%" textAnchor="middle">
            FORGED
          </textPath>
        </text>

        {/* Tagline on bottom */}
        <text
          fontFamily="-apple-system, 'Segoe UI', sans-serif"
          fontWeight="900"
          fontSize="9"
          fill="var(--accent-gold)"
          letterSpacing="3"
        >
          <textPath href="#plateBotCurve" startOffset="50%" textAnchor="middle">
            TRAIN · EAT · WIN
          </textPath>
        </text>

        {/* Center hole */}
        <circle
          cx="100"
          cy="100"
          r="30"
          fill="var(--bg)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="2"
        />

        {/* Pulsing gold dot in center */}
        <circle
          cx="100"
          cy="100"
          r="5"
          fill="var(--accent-gold)"
          style={{
            animation: 'plateDot 1.6s ease-in-out infinite',
            transformOrigin: 'center',
          }}
        />
      </svg>
    </div>
  )
}