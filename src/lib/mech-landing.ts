/** Landing page mech GLB paths and their faction ids (DB/chart keys). */

import type { FactionThemeId } from '@/lib/faction-ui-theme'

export const MECH_URLS = [
  '/mechs/Albion_Mech.glb',
  '/mechs/Crimean_Mech.glb',
  '/mechs/Nordic_Mech.glb',
  '/mechs/Polania_Mech.glb',
  '/mechs/Rusviet_Mech.glb',
  '/mechs/Saxony_Mech.glb',
  '/mechs/Togawa_Mech.glb',
] as const

export type MechAssetUrl = (typeof MECH_URLS)[number]

export const MECH_URL_TO_FACTION: Record<MechAssetUrl, string> = {
  '/mechs/Albion_Mech.glb': 'albion',
  '/mechs/Crimean_Mech.glb': 'crimea',
  '/mechs/Nordic_Mech.glb': 'nordic',
  '/mechs/Polania_Mech.glb': 'polania',
  '/mechs/Rusviet_Mech.glb': 'rusviet',
  '/mechs/Saxony_Mech.glb': 'saxony',
  '/mechs/Togawa_Mech.glb': 'togawa',
}

/** One canonical mech asset per faction theme (for landing canvas). */
export const FACTION_TO_MECH_URL: Record<FactionThemeId, MechAssetUrl> = {
  albion: '/mechs/Albion_Mech.glb',
  crimea: '/mechs/Crimean_Mech.glb',
  nordic: '/mechs/Nordic_Mech.glb',
  polania: '/mechs/Polania_Mech.glb',
  rusviet: '/mechs/Rusviet_Mech.glb',
  saxony: '/mechs/Saxony_Mech.glb',
  togawa: '/mechs/Togawa_Mech.glb',
}
