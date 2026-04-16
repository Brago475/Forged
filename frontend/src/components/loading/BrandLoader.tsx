/**
 * Full-screen app-launch loader. Shown on first mount for a minimum
 * duration so the brand has time to register even on fast loads.
 */
export function BrandLoader() {
  return (
    <div className="fixed inset-0 z-[100] bg-forged-bg flex flex-col items-center justify-center">
      <div
        className="font-black text-3xl tracking-[0.2em] uppercase text-forged-text"
        style={{
          fontFamily: "'Archivo', sans-serif",
          animation: 'forgedLogoPulse 1.6s ease infinite',
        }}
      >
        F<span className="text-forged-gold">O</span>RGED
      </div>

      <div
        className="mt-4 rounded-full overflow-hidden bg-forged-border"
        style={{ width: 120, height: 3 }}
      >
        <div
          className="h-full rounded-full bg-forged-purple"
          style={{ animation: 'forgedBarPulse 1.6s ease infinite' }}
        />
      </div>

      <p className="text-xs text-forged-text2 mt-3 opacity-50">
        Loading your workout...
      </p>
    </div>
  )
}