/**
 * Full-screen app loader. Pulsing logo only — no text, no bar.
 * Used for page transitions and initial app load.
 */
export function BrandLoader() {
  return (
    <div className="fixed inset-0 z-[100] bg-forged-bg flex items-center justify-center">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.25) 0%, transparent 60%)',
        }}
      />
      <div className="relative">
        <div
          className="absolute inset-0 rounded-3xl blur-2xl"
          style={{
            background:
              'radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)',
            animation: 'forgedLogoPulse 1.6s ease-in-out infinite',
          }}
        />
        <div
          className="relative w-28 h-28 rounded-3xl bg-white flex items-center justify-center shadow-2xl overflow-hidden"
          style={{ animation: 'forgedLogoPulse 1.6s ease-in-out infinite' }}
        >
          <img
            src="/logo.png"
            alt="FORGED"
            className="w-full h-full object-contain scale-150"
          />
        </div>
      </div>
    </div>
  )
}