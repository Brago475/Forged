/**
 * CSS keyframes used by loaders and stagger animations across the app.
 * Injected once via <style> from the Dashboard shell.
 *
 * Kept as a string (not a .css file) so the Dashboard shell can scope
 * when they're mounted, and so Vite doesn't emit a separate CSS bundle
 * just for a handful of keyframes.
 */
export const LOADING_STYLES = `
@keyframes forgedSkelShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes forgedLogoPulse {
  0%, 100% { opacity: 0.75; transform: scale(0.96); }
  50% { opacity: 1; transform: scale(1.04); }
}
@keyframes forgedStaggerIn {
  0% { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes fadeSlide {
  from { opacity: 0; transform: translateY(4px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes forgedPageFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
`