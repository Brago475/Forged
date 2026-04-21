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
  @keyframes swRipple {
  0% { transform: scale(0.45); opacity: 0.7; }
  100% { transform: scale(2.4); opacity: 0; }
}

@keyframes swRing {
  0% { stroke-dashoffset: 402; }
  100% { stroke-dashoffset: 0; }
}

@keyframes swTick {
  0% { transform: rotate(0deg); }
  8.33% { transform: rotate(30deg); }
  16.66% { transform: rotate(60deg); }
  25% { transform: rotate(90deg); }
  33.33% { transform: rotate(120deg); }
  41.66% { transform: rotate(150deg); }
  50% { transform: rotate(180deg); }
  58.33% { transform: rotate(210deg); }
  66.66% { transform: rotate(240deg); }
  75% { transform: rotate(270deg); }
  83.33% { transform: rotate(300deg); }
  91.66% { transform: rotate(330deg); }
  100% { transform: rotate(360deg); }
}
`