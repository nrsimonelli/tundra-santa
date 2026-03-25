const EM_DASH = '—'

// Mats by in turn order sequence
export const PLAYER_MAT_ORDER = [
  'industrial',
  'engineering',
  'militant',
  'patriotic',
  'innovative',
  'mechanical',
  'agricultural',
] as const

export type PlayerMatId = (typeof PLAYER_MAT_ORDER)[number]

// factions in clockwise sequence
export const LEAGUE_FACTION_ICON_ORDER = [
  'nordic',
  'rusviet',
  'togawa',
  'crimea',
  'saxony',
  'polania',
  'albion',
] as const

/** Title-style label for DB mat ids (e.g. `industrial` → `Industrial`). */
export function formatPlayerMatLabel(mat: string | null | undefined): string {
  if (mat == null || mat === '') return EM_DASH
  return mat
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function isUsableNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value)
}

/** Whole-number bid for display; missing or non-finite → em dash. */
export function formatLeagueBid(value: number | null | undefined): string {
  if (!isUsableNumber(value)) return EM_DASH
  return String(Math.round(value))
}

/**
 * `a / b` with integer bids. Both missing → em dash. Both exactly 0 → em dash.
 * Otherwise each side is rounded or em dash if missing.
 */
export function formatLeagueBidPair(
  a: number | null | undefined,
  b: number | null | undefined,
): string {
  const aOk = isUsableNumber(a)
  const bOk = isUsableNumber(b)
  if (!aOk && !bOk) return EM_DASH
  if (aOk && bOk && a === 0 && b === 0) return EM_DASH
  const left = aOk ? String(Math.round(a)) : EM_DASH
  const right = bOk ? String(Math.round(b)) : EM_DASH
  return `${left} / ${right}`
}
