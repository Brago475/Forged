/**
 * Full-screen app loader. Pulsing logo on solid background.
 * Used for page transitions and initial app load.
 */
export function BrandLoader() {
  return (
    <div className="fixed inset-0 z-[100] bg-forged-bg flex items-center justify-center">
      <div
        className="w-28 h-28 rounded-3xl bg-white flex items-center justify-center shadow-2xl p-4"
        style={{ animation: 'forgedLogoPulse 1.6s ease-in-out infinite' }}
      >
        <img
          src="/logo.png"
          alt="FORGED"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  )
}