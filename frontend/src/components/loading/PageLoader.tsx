/**
 * Loader overlay. Renders fixed over the main content area, blurring
 * and dimming whatever's behind it. Shows the pulsing plate centered
 * in the viewport. Rendered by Dashboard when useLoadingState() is true.
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
        backgroundColor: 'rgba(10, 8, 20, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 90,
        animation: 'forgedContentFadeIn 0.2s ease-out both',
      }}
    >
      <svg
        width="160"
        height="160"
        viewBox="0 0 200 200"
        style={{
          animation: 'platePulse 1.6s ease-in-out infinite',
          transformOrigin: 'center',
          willChange: 'transform',
          display: 'block',
        }}
      >
        <defs>
          <path id="plateTopCurve" d="M 40,100 A 60,60 0 0 1 160,100" fill="none" />
          <path id="plateBotCurve" d="M 40,100 A 60,60 0 0 0 160,100" fill="none" />
        </defs>

        <circle cx="100" cy="100" r="94" fill="none" stroke="var(--accent-purple)" strokeWidth="2" />
        <circle cx="100" cy="100" r="88" fill="var(--bg-surface)" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="var(--accent-purple)" strokeWidth="2" />

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

        <circle cx="100" cy="100" r="30" fill="var(--bg)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <circle
          cx="100"
          cy="100"
          r="5"
          fill="var(--accent-gold)"
          style={{
            animation: 'plateDot 1.6s ease-in-out infinite',
            transformOrigin: 'center',
            willChange: 'transform, opacity',
          }}
        />
      </svg>
    </div>
  )
}