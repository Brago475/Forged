export type PhotoAngle = 'front' | 'side' | 'back'

export interface Measurements {
  waist?: number
  chest?: number
  arms?: number
  thighs?: number
  hips?: number
  neck?: number
}

export interface ProgressPhoto {
  id: string
  date: string           // YYYY-MM-DD
  capturedAt: string     // ISO timestamp
  angle: PhotoAngle
  dataUrl: string        // base64
  weight?: number        // lbs at time of capture
  measurements?: Measurements
  note?: string
  tags?: string[]
}

const PHOTOS_KEY = 'forged:progress-photos'
const LOCK_KEY = 'forged:photos-lock'

// ──────────────────────────────
// CRUD
// ──────────────────────────────

export function loadPhotos(): ProgressPhoto[] {
  try {
    const raw = localStorage.getItem(PHOTOS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function savePhotos(photos: ProgressPhoto[]): void {
  try { localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos)) } catch { /* ignore */ }
}

export function addPhoto(photo: ProgressPhoto): ProgressPhoto[] {
  const photos = loadPhotos()
  const next = [photo, ...photos]
  savePhotos(next)
  return next
}

export function updatePhoto(id: string, patch: Partial<ProgressPhoto>): ProgressPhoto[] {
  const photos = loadPhotos()
  const next = photos.map(p => p.id === id ? { ...p, ...patch } : p)
  savePhotos(next)
  return next
}

export function deletePhoto(id: string): ProgressPhoto[] {
  const photos = loadPhotos().filter(p => p.id !== id)
  savePhotos(photos)
  return photos
}

// ──────────────────────────────
// Selectors
// ──────────────────────────────

export function sortByDateDesc(photos: ProgressPhoto[]): ProgressPhoto[] {
  return [...photos].sort((a, b) => b.date.localeCompare(a.date))
}

export function sortByDateAsc(photos: ProgressPhoto[]): ProgressPhoto[] {
  return [...photos].sort((a, b) => a.date.localeCompare(b.date))
}

export function filterByAngle(photos: ProgressPhoto[], angle: PhotoAngle | 'all'): ProgressPhoto[] {
  if (angle === 'all') return photos
  return photos.filter(p => p.angle === angle)
}

export function groupByMonth(photos: ProgressPhoto[]): Array<{ monthLabel: string; monthKey: string; photos: ProgressPhoto[] }> {
  const groups: Record<string, ProgressPhoto[]> = {}
  for (const photo of photos) {
    const d = new Date(photo.date + 'T00:00:00')
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(photo)
  }
  return Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .map(key => {
      const [year, month] = key.split('-')
      const d = new Date(Number(year), Number(month) - 1, 1)
      return {
        monthKey: key,
        monthLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        photos: groups[key],
      }
    })
}

export function getFirstAndLatest(photos: ProgressPhoto[]): { first?: ProgressPhoto; latest?: ProgressPhoto } {
  if (photos.length === 0) return {}
  const sorted = sortByDateAsc(photos)
  return { first: sorted[0], latest: sorted[sorted.length - 1] }
}

export function daysBetween(aDate: string, bDate: string): number {
  const a = new Date(aDate + 'T00:00:00').getTime()
  const b = new Date(bDate + 'T00:00:00').getTime()
  return Math.abs(Math.round((b - a) / (1000 * 60 * 60 * 24)))
}

// ──────────────────────────────
// Privacy lock
// ──────────────────────────────

export interface LockConfig {
  enabled: boolean
  pin?: string      // 4-digit
  hashedPin?: string // simple hash
}

export function loadLock(): LockConfig {
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    if (!raw) return { enabled: false }
    return JSON.parse(raw)
  } catch {
    return { enabled: false }
  }
}

export function saveLock(config: LockConfig): void {
  try { localStorage.setItem(LOCK_KEY, JSON.stringify(config)) } catch { /* ignore */ }
}

/** Trivial PIN hash. This is obfuscation, not real security. */
export function hashPin(pin: string): string {
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return `forged_${hash}`
}

// ──────────────────────────────
// Export helpers
// ──────────────────────────────

export function exportAsJson(photos: ProgressPhoto[]): Blob {
  const bundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    photos,
  }
  return new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
}

/**
 * Download all photos as individual files via a manifest.
 * Real zip support would need jszip; for now we export a single PDF-style
 * document with base64 embeds inside the JSON.
 */
export function downloadJson(photos: ProgressPhoto[]): void {
  const blob = exportAsJson(photos)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `forged-photos-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Generate a simple HTML snapshot of all photos that can be saved as PDF
 * via the browser's print dialog. Opens a new tab.
 */
export function exportAsPdf(photos: ProgressPhoto[]): void {
  const sorted = sortByDateAsc(photos)
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
    <title>FORGED Progress Photos</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #fff; color: #111; margin: 0; padding: 24px; }
      h1 { font-size: 24px; margin: 0 0 8px; }
      p.sub { color: #666; margin: 0 0 24px; font-size: 12px; }
      .photo { break-inside: avoid; margin-bottom: 24px; border-bottom: 1px solid #eee; padding-bottom: 16px; }
      .photo img { max-width: 100%; max-height: 480px; border-radius: 8px; }
      .meta { font-size: 12px; color: #333; margin-top: 8px; }
      .meta strong { color: #111; }
      .measure { font-size: 11px; color: #666; margin-top: 4px; }
      .note { font-size: 12px; color: #333; margin-top: 6px; font-style: italic; }
    </style></head><body>
    <h1>FORGED Progress Photos</h1>
    <p class="sub">${sorted.length} photos · exported ${new Date().toLocaleDateString()}</p>
    ${sorted.map(p => `
      <div class="photo">
        <img src="${p.dataUrl}" alt="${p.angle}"/>
        <div class="meta"><strong>${p.date}</strong> · ${p.angle}${p.weight ? ` · ${p.weight} lbs` : ''}</div>
        ${p.measurements ? `<div class="measure">${
          Object.entries(p.measurements)
            .filter(([, v]) => v != null)
            .map(([k, v]) => `${k}: ${v}"`)
            .join(' · ')
        }</div>` : ''}
        ${p.note ? `<div class="note">${p.note}</div>` : ''}
      </div>
    `).join('')}
    <script>window.onload = () => setTimeout(() => window.print(), 300)</script>
    </body></html>`
  const w = window.open('', '_blank')
  if (w) {
    w.document.open()
    w.document.write(html)
    w.document.close()
  }
}