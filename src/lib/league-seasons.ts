import type { LeagueEventOption } from '@/lib/league-cached-queries'

export type LeagueSeasonRow = {
  seasonIndex: number
  eventId: number
  /** Event name, date, game count — for titles / tooltips */
  label: string
}

function formatSeasonLabel(e: LeagueEventOption): string {
  const name = e.name ?? `Event ${e.id}`
  const datePart = e.start_date
    ? ` (${new Date(e.start_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })})`
    : ''
  return `${name}${datePart} — ${e.gameCount} games`
}

/** S1 = oldest league season by start_date (matches player profile seasonIndex). */
export function leagueSeasonsByStartDateAsc(
  options: LeagueEventOption[],
): LeagueSeasonRow[] {
  const sorted = [...options].sort((a, b) => {
    const da = a.start_date ?? ''
    const db = b.start_date ?? ''
    const cmp = da.localeCompare(db)
    if (cmp !== 0) return cmp
    return a.id - b.id
  })
  return sorted.map((e, i) => ({
    seasonIndex: i + 1,
    eventId: e.id,
    label: formatSeasonLabel(e),
  }))
}

/** Latest league season = last row from {@link leagueSeasonsByStartDateAsc} (most recent start_date). */
export function leagueLatestSeasonEventId(
  options: LeagueEventOption[],
): number | null {
  const rows = leagueSeasonsByStartDateAsc(options)
  if (rows.length === 0) return null
  return rows[rows.length - 1]!.eventId
}
