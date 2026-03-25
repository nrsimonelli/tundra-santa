/**
 * Fill colors for charts (donut). Keys are lowercase DB faction ids.
 */
export const FACTION_CHART_FILL: Record<string, string> = {
  albion: '#16A34A',
  nordic: '#2563EB',
  rusviet: '#DC2626',
  togawa: '#9333EA',
  crimea: '#EAB308',
  saxony: '#171717',
  polania: '#ffffff',
}

export function factionChartFill(faction: string): string {
  const k = faction.trim().toLowerCase()
  return FACTION_CHART_FILL[k] ?? '#64748b'
}

/** Stroke for donut segments that need separation from the background (e.g. white Polania). */
export function factionChartSegmentStroke(faction: string): string | undefined {
  const k = faction.trim().toLowerCase()
  if (k === 'polania') return '#DC2626'
  if (k === 'saxony') return '#404040'
  return undefined
}
