import type { FoodLog } from '../../types'
import { MacroBar } from './MacroBar'
import { computeTotals, computeDerived, computeRatings } from './nutritionMath'

interface FullBreakdownModalProps {
  logs: FoodLog[]
  onClose: () => void
}

const MEAL_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  snack: 'Snacks',
}

export function FullBreakdownModal({ logs, onClose }: FullBreakdownModalProps) {
  const totals = computeTotals(logs)
  const derived = computeDerived(totals)
  const ratings = computeRatings(totals)

  const fmtNum = (n: number): string => {
    if (n >= 100) return Math.round(n).toString()
    return n.toFixed(1).replace(/\.0$/, '')
  }

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center
        bg-black/60 backdrop-blur-sm px-3 py-4"
      onClick={onClose}
    >
      <div
        className="bg-forged-surface border border-forged-border rounded-t-2xl sm:rounded-2xl
          p-5 w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-forged-purple font-bold uppercase tracking-widest">Premium Analysis</p>
            <h2 className="text-xl font-black text-forged-text">Full Breakdown</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-text transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Basic info */}
        <Section title="Basic Info" icon="🍽️">
          <Row label="Items logged" value={`${logs.length}`} />
          <Row label="Total calories" value={`${totals.cal} kcal`} highlight />
        </Section>

        {/* Macros */}
        <Section title="Macronutrients" icon="⚡">
          <MacroBar protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
          <div className="mt-3 flex flex-col gap-1">
            <MacroRow color="#9b59b6" label="Protein" grams={totals.protein} pct={derived.proteinPct} cal={totals.protein * 4} />
            <MacroRow color="#3498db" label="Carbohydrates" grams={totals.carbs} pct={derived.carbsPct} cal={totals.carbs * 4} />
            <div className="pl-4 flex flex-col gap-0.5">
              <SubRow label="Fiber" value={`${fmtNum(totals.fiber)}g`} />
              <SubRow label="Sugar" value={`${fmtNum(totals.sugar)}g`} />
              <SubRow label="Net carbs" value={`${fmtNum(derived.netCarbs)}g`} hint="carbs minus fiber" />
            </div>
            <MacroRow color="#e74c3c" label="Fat" grams={totals.fat} pct={derived.fatPct} cal={totals.fat * 9} />
          </div>
        </Section>

        {/* Micros (what we have) */}
        <Section title="Micronutrients" icon="🔬">
          <Row label="Sodium" value={`${fmtNum(totals.sodium)} mg`} />
          <p className="text-[10px] text-forged-text2 italic mt-2">
            More micronutrients (potassium, iron, vitamins) coming soon with USDA integration.
          </p>
        </Section>

        {/* Derived metrics */}
        <Section title="Derived Metrics" icon="🧠">
          <Row label="Net carbs" value={`${fmtNum(derived.netCarbs)}g`} hint="Carbs − Fiber" />
          <Row label="Protein density" value={`${fmtNum(derived.proteinDensity)} g/100 cal`} hint="Higher = leaner" />
          <Row label="Calorie density" value={`${fmtNum(derived.calorieDensity)} cal/g`} hint="Per gram of macronutrients" />
          <Row label="Macro split" value={`${Math.round(derived.proteinPct)}% / ${Math.round(derived.carbsPct)}% / ${Math.round(derived.fatPct)}%`} hint="Protein / Carbs / Fat (by calories)" />
        </Section>

        {/* Ratings */}
        <Section title="Fitness Ratings" icon="🏋️">
          <RatingRow
            label="Muscle Gain"
            rating={ratings.muscleGain}
            reason={ratings.muscleGainReason}
          />
          <RatingRow
            label="Fat Loss"
            rating={ratings.fatLoss}
            reason={ratings.fatLossReason}
          />
          <div className="bg-forged-bg border border-forged-border rounded-xl p-3 mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-forged-text">Energy Impact</span>
              <span className="text-xs font-black text-forged-purple">{ratings.energyImpact}</span>
            </div>
            <p className="text-[10px] text-forged-text2">{ratings.energyReason}</p>
          </div>
          <div className="bg-forged-bg border border-forged-border rounded-xl p-3 mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-forged-text">Protein Quality</span>
              <span
                className={`text-xs font-black
                  ${ratings.proteinQuality === 'High' ? 'text-forged-green'
                    : ratings.proteinQuality === 'Medium' ? 'text-yellow-600'
                      : 'text-forged-red'}`}
              >
                {ratings.proteinQuality}
              </span>
            </div>
            <p className="text-[10px] text-forged-text2">
              Based on total protein and density. Amino-acid-level scoring requires USDA integration.
            </p>
          </div>
        </Section>

        {/* Ingredients breakdown */}
        {logs.length > 0 && (
          <Section title="Ingredients Breakdown" icon="🧾">
            <div className="bg-forged-bg border border-forged-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-forged-surface2/50 text-[9px] font-bold text-forged-text2 uppercase tracking-wider">
                <div className="col-span-5">Ingredient</div>
                <div className="col-span-2 text-right">Cal</div>
                <div className="col-span-2 text-right">Protein</div>
                <div className="col-span-2 text-right">Carbs</div>
                <div className="col-span-1 text-right">Fat</div>
              </div>
              {logs.map((log) => {
                const cal = (log.food?.calories ?? 0) * log.servings
                const p = (log.food?.protein ?? 0) * log.servings
                const c = (log.food?.carbs ?? 0) * log.servings
                const f = (log.food?.fat ?? 0) * log.servings
                return (
                  <div
                    key={log.id}
                    className="grid grid-cols-12 gap-1 px-3 py-2 border-t border-forged-border
                      text-[11px] items-center"
                  >
                    <div className="col-span-5 min-w-0">
                      <p className="font-bold text-forged-text truncate">{log.food?.name || 'Food'}</p>
                      <p className="text-[9px] text-forged-text2">{MEAL_LABELS[log.mealType || 'snack']}</p>
                    </div>
                    <div className="col-span-2 text-right font-black text-forged-text tabular-nums">{Math.round(cal)}</div>
                    <div className="col-span-2 text-right tabular-nums" style={{ color: '#9b59b6' }}>{fmtNum(p)}g</div>
                    <div className="col-span-2 text-right tabular-nums" style={{ color: '#3498db' }}>{fmtNum(c)}g</div>
                    <div className="col-span-1 text-right tabular-nums" style={{ color: '#e74c3c' }}>{fmtNum(f)}g</div>
                  </div>
                )
              })}
              <div className="grid grid-cols-12 gap-1 px-3 py-2 border-t-2 border-forged-border bg-forged-surface2/30
                text-[11px] font-black">
                <div className="col-span-5 text-forged-text">TOTAL</div>
                <div className="col-span-2 text-right tabular-nums text-forged-text">{totals.cal}</div>
                <div className="col-span-2 text-right tabular-nums" style={{ color: '#9b59b6' }}>{fmtNum(totals.protein)}g</div>
                <div className="col-span-2 text-right tabular-nums" style={{ color: '#3498db' }}>{fmtNum(totals.carbs)}g</div>
                <div className="col-span-1 text-right tabular-nums" style={{ color: '#e74c3c' }}>{fmtNum(totals.fat)}g</div>
              </div>
            </div>
          </Section>
        )}

        {/* Scoring transparency */}
        <Section title="How scores are calculated" icon="💡">
          <p className="text-[10px] text-forged-text2 leading-relaxed">
            <strong className="text-forged-text">Muscle Gain</strong> weighs total protein and protein-per-calorie (density). 30g+ protein with 7g+/100cal earns 5 stars.
            <br /><br />
            <strong className="text-forged-text">Fat Loss</strong> rewards high protein density and penalizes high-fat low-protein meals.
            <br /><br />
            <strong className="text-forged-text">Energy Impact</strong> estimates glycemic response from carbs and fiber ratio. Higher fiber = more sustained energy.
            <br /><br />
            All scores are heuristics. Full accuracy needs micronutrient and amino acid data (Tier 2 backend).
          </p>
        </Section>

        <button
          onClick={onClose}
          className="w-full mt-3 py-3 rounded-xl text-sm font-black
            bg-forged-purple text-white hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ── Subcomponents ──

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span>{icon}</span>
        {title}
      </p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value, hint, highlight }: {
  label: string; value: string; hint?: string; highlight?: boolean
}) {
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-forged-text">{label}</span>
        <span className={`text-sm font-black tabular-nums
          ${highlight ? 'text-forged-purple' : 'text-forged-text'}`}>
          {value}
        </span>
      </div>
      {hint && <p className="text-[9px] text-forged-text2 mt-1">{hint}</p>}
    </div>
  )
}

function SubRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between text-[11px] py-1">
      <span className="text-forged-text2">
        {label}
        {hint && <span className="text-forged-text2/60 ml-1">({hint})</span>}
      </span>
      <span className="font-bold text-forged-text tabular-nums">{value}</span>
    </div>
  )
}

function MacroRow({ color, label, grams, pct, cal }: {
  color: string; label: string; grams: number; pct: number; cal: number
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-bold text-forged-text">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px] tabular-nums">
        <span className="font-black text-forged-text">{grams.toFixed(1).replace(/\.0$/, '')}g</span>
        <span className="text-forged-text2">·</span>
        <span className="text-forged-text2">{Math.round(pct)}%</span>
        <span className="text-forged-text2">·</span>
        <span className="text-forged-text2">{cal} cal</span>
      </div>
    </div>
  )
}

function RatingRow({ label, rating, reason }: {
  label: string; rating: number; reason: string
}) {
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-forged-text">{label}</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={i <= rating ? 'text-forged-purple' : 'text-forged-text2/30'}
              style={{ fontSize: '14px', lineHeight: 1 }}
            >
              ★
            </span>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-forged-text2">{reason}</p>
    </div>
  )
}