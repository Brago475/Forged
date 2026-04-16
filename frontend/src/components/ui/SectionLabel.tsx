interface SectionLabelProps {
  children: string
}

/**
 * Small all-caps, tracked heading used above content groupings
 * inside a Card (e.g. "Macros", "Quick actions").
 */
export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <h3 className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">
      {children}
    </h3>
  )
}