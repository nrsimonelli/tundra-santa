export type LeagueCombo = { faction: string; mat: string }

/** Sorted pair for stable URLs and keys. */
export function sortComboPair(a: LeagueCombo, b: LeagueCombo): [LeagueCombo, LeagueCombo] {
  const sa = `${a.faction}|${a.mat}`
  const sb = `${b.faction}|${b.mat}`
  return sa <= sb ? [a, b] : [b, a]
}

export function encodeLeagueMatchupSlug(comboA: LeagueCombo, comboB: LeagueCombo): string {
  const [first, second] = sortComboPair(comboA, comboB)
  return Buffer.from(JSON.stringify([first, second])).toString('base64url')
}

export function decodeLeagueMatchupSlug(slug: string): [LeagueCombo, LeagueCombo] | null {
  try {
    const raw = Buffer.from(slug, 'base64url').toString('utf8')
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length !== 2) return null
    const [a, b] = parsed as [{ faction?: string; mat?: string }, { faction?: string; mat?: string }]
    if (!a?.faction || !a?.mat || !b?.faction || !b?.mat) return null
    return sortComboPair(
      { faction: a.faction, mat: a.mat },
      { faction: b.faction, mat: b.mat }
    )
  } catch {
    return null
  }
}
