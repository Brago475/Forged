/**
 * Small inline spinner for buttons, inputs, and form actions.
 * For full-page loading use <BrandLoader />. For content blocks
 * loading inside a page, use skeleton components.
 */
export function InlineSpinner({
  size = 'md',
  color = 'purple',
}: {
  size?: 'sm' | 'md' | 'lg'
  color?: 'purple' | 'red' | 'white'
}) {
  const sizes = {
    sm: 'w-3 h-3 border-2',
    md: 'w-4 h-4 border-2',
    lg: 'w-6 h-6 border-[3px]',
  }
  const colors = {
    purple: 'border-forged-purple border-t-transparent',
    red: 'border-forged-red border-t-transparent',
    white: 'border-white border-t-transparent',
  }
  return (
    <div
      className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`}
    />
  )
}