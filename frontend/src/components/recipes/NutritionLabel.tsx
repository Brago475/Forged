import type { RecipeMacros } from './recipesStorage'

export function NutritionLabel({ macros, servings }: {
  macros: RecipeMacros
  servings: number
}) {
  const p = macros.perServing
  return (
    <div className="bg-white text-black rounded-xl p-4 border-2 border-black font-sans">
      <p className="text-2xl font-black leading-none">Nutrition Facts</p>
      <p className="text-[10px] font-bold mt-0.5">Serving size: 1 of {servings}</p>
      <div className="h-[6px] bg-black my-2" />

      <p className="text-[10px] font-bold">Amount per serving</p>
      <div className="flex items-baseline justify-between border-b-[6px] border-black pb-1 mb-2">
        <p className="text-lg font-black">Calories</p>
        <p className="text-2xl font-black tabular-nums">{p.calories}</p>
      </div>

      <Row label="Total Fat" value={`${p.fat}g`} bold />
      <Row label="Total Carbohydrate" value={`${p.carbs}g`} bold />
      <IndentRow label="Dietary Fiber" value={`${p.fiber}g`} />
      <IndentRow label="Total Sugars" value={`${p.sugar}g`} />
      <Row label="Protein" value={`${p.protein}g`} bold />
      <div className="h-[6px] bg-black my-1" />
      <Row label="Sodium" value={`${p.sodium}mg`} />
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-0.5 border-b border-black">
      <p className={`text-xs ${bold ? 'font-black' : 'font-medium'}`}>{label}</p>
      <p className="text-xs font-bold tabular-nums">{value}</p>
    </div>
  )
}

function IndentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-0.5 border-b border-black pl-4">
      <p className="text-xs">{label}</p>
      <p className="text-xs font-bold tabular-nums">{value}</p>
    </div>
  )
}