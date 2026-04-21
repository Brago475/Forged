/**
 * Theme-safe loading animations used across the app.
 *
 * The shimmer and reveal animations use opacity-based rgba values
 * so they adapt to any theme. The --skel-rgb variable lets future
 * themes override the base shimmer color without touching this file.
 *
 * Injected once via <style> from the Dashboard shell.
 */
export const LOADING_STYLES = `
:root {
  --skel-rgb: 255, 255, 255;
  --skel-low: 0.05;
  --skel-high: 0.12;
}

@keyframes forgedShim {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes forgedLogoPulse {
  0%, 100% { opacity: 0.75; transform: scale(0.96); }
  50% { opacity: 1; transform: scale(1.04); }
}

@keyframes forgedStaggerIn {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes forgedSkelFadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes forgedContentFadeIn {
  0% { opacity: 0; transform: translateY(6px); }
  60% { opacity: 0.5; }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes platePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

@keyframes plateDot {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}

.skel-shimmer {
  background: linear-gradient(
    90deg,
    rgba(var(--skel-rgb), var(--skel-low)) 0%,
    rgba(var(--skel-rgb), var(--skel-high)) 50%,
    rgba(var(--skel-rgb), var(--skel-low)) 100%
  );
  background-size: 200% 100%;
  animation: forgedShim 1.6s ease-in-out infinite;
  border-radius: 14px;
}

.skel-fade-out {
  animation: forgedSkelFadeOut 0.25s ease-out forwards;
}

.content-fade-in {
  animation: forgedContentFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
`