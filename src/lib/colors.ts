/** Swatches offered when creating a team member or label. */
export const SWATCHES = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#64748b', // slate
]

export const STARTER_LABELS = [
  { name: 'Bug', color: '#ef4444' },
  { name: 'Feature', color: '#6366f1' },
  { name: 'Design', color: '#ec4899' },
  { name: 'Docs', color: '#0ea5e9' },
]

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Pick the next swatch that isn't used yet, so new items look distinct. */
export function nextSwatch(used: string[]): string {
  return SWATCHES.find((c) => !used.includes(c)) ?? SWATCHES[used.length % SWATCHES.length]
}
