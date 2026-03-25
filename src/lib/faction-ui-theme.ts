/**
 * Faction UI theme is defined in globals.css under :root[data-faction='…'].
 * JS only sets the root token + validates against the allowlist.
 */

export const FACTION_THEME_STORAGE_KEY = 'str-faction-ui'

/** Same value as storage key; readable on the server for SSR `data-faction`. */
export const FACTION_THEME_COOKIE_NAME = FACTION_THEME_STORAGE_KEY

export const FACTION_THEME_IDS = [
  'nordic',
  'rusviet',
  'togawa',
  'crimea',
  'saxony',
  'polania',
  'albion',
] as const

export type FactionThemeId = (typeof FACTION_THEME_IDS)[number]

/** When nothing is stored yet, the site uses Nordic (matches previous default hero palette). */
export const DEFAULT_FACTION_THEME_ID: FactionThemeId = 'nordic'

const FACTION_IDS = new Set<string>(FACTION_THEME_IDS)

export function isFactionThemeId(id: string): id is FactionThemeId {
  return FACTION_IDS.has(id)
}

export function applyFactionThemeToDocument(factionId: string): void {
  if (!isFactionThemeId(factionId) || typeof document === 'undefined') return
  document.documentElement.dataset.faction = factionId
}

/** Server + client: coerce cookie/query string to a valid faction id. */
export function resolveFactionThemeId(
  raw: string | undefined | null,
): FactionThemeId {
  if (raw && isFactionThemeId(raw)) return raw
  return DEFAULT_FACTION_THEME_ID
}

/**
 * Persist faction for SSR on the next request (first-party UI preference).
 * Call only from the client after a user action or when syncing from localStorage.
 */
export function setFactionThemeCookie(factionId: FactionThemeId): void {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 * 400
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : ''
  document.cookie = `${FACTION_THEME_COOKIE_NAME}=${encodeURIComponent(factionId)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}
