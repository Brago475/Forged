/**
 * In-app page loader. Stopwatch-shaped, ticks around the face
 * with ripples radiating outward and a progress ring filling.
 *
 * Uses CSS tokens (--forged-purple, --forged-gold) so it adapts
 * to every theme automatically. Centered via viewport height
 * so every page shows the loader in the same spot.
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
      <div style={{ position: 'relative', width: 160, height: 180 }}>

        {/* Crown button on top */}
        <div style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 24,
          height: 10,
          background: 'var(--accent-purple)',
          borderRadius: '3px 3px 0 0',
        }} />
        <div style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 12,
          height: 6,
          background: 'var(--accent-gold)',
          borderRadius: 2,
        }} />

        {/* Angled stems */}
        <div style={{
          position: 'absolute',
          top: 2,
          right: 18,
          width: 6,
          height: 14,
          background: 'var(--accent-purple)',
          borderRadius: 2,
          transform: 'rotate(35deg)',
        }} />
        <div style={{
          position: 'absolute',
          top: 2,
          left: 18,
          width: 6,
          height: 14,
          background: 'var(--accent-purple)',
          borderRadius: 2,
          transform: 'rotate(-35deg)',
        }} />

        {/* Watch body */}
        <div style={{
          position: 'absolute',
          top: 24,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ position: 'relative', width: 150, height: 150 }}>

            {/* Purple ripple */}
            <div style={{
              position: 'absolute',
              inset: 0,
              border: '2px solid var(--accent-purple)',
              borderRadius: '50%',
              animation: 'swRipple 2.2s ease-out infinite',
            }} />
            {/* Gold ripple (offset) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              border: '2px solid var(--accent-gold)',
              borderRadius: '50%',
              animation: 'swRipple 2.2s ease-out 0.7s infinite',
            }} />

            {/* Watch face background */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'var(--bg)',
              border: '3px solid rgba(255,255,255,0.1)',
              boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.4)',
            }} />

            {/* Clock numbers + tick marks */}
            <svg
              viewBox="0 0 150 150"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              <g
                fill="rgba(255,255,255,0.25)"
                fontFamily="-apple-system, sans-serif"
                fontWeight={900}
                fontSize={12}
                letterSpacing="-0.02em"
                textAnchor="middle"
                dominantBaseline="central"
              >
                <text x="75" y="22">12</text>
                <text x="101.5" y="29.1">1</text>
                <text x="120.9" y="48.5">2</text>
                <text x="128" y="75">3</text>
                <text x="120.9" y="101.5">4</text>
                <text x="101.5" y="120.9">5</text>
                <text x="75" y="128">6</text>
                <text x="48.5" y="120.9">7</text>
                <text x="29.1" y="101.5">8</text>
                <text x="22" y="75">9</text>
                <text x="29.1" y="48.5">10</text>
                <text x="48.5" y="29.1">11</text>
              </g>
              <g stroke="rgba(255,255,255,0.18)" strokeWidth={1} strokeLinecap="round">
                <line x1="75" y1="8" x2="75" y2="14" />
                <line x1="75" y1="136" x2="75" y2="142" />
                <line x1="8" y1="75" x2="14" y2="75" />
                <line x1="136" y1="75" x2="142" y2="75" />
              </g>
            </svg>

            {/* Filling progress ring */}
            <svg
              viewBox="0 0 150 150"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              <circle cx="75" cy="75" r="64" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
              <circle
                cx="75"
                cy="75"
                r="64"
                fill="none"
                stroke="var(--accent-purple)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="402"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center',
                  animation: 'swRing 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                }}
              />
            </svg>

            {/* Ticking hand */}
            <svg
              viewBox="0 0 150 150"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                animation: 'swTick 3.6s steps(1) infinite',
                transformOrigin: 'center',
              }}
            >
              <line x1="75" y1="75" x2="75" y2="22" stroke="var(--accent-gold)" strokeWidth={2.5} strokeLinecap="round" />
              <circle cx="75" cy="22" r="2" fill="var(--accent-gold)" />
            </svg>

            {/* Center pivot dot */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 6,
              height: 6,
              background: '#FAFAF8',
              borderRadius: '50%',
              zIndex: 5,
            }} />

          </div>
        </div>

      </div>
    </div>
  )
}