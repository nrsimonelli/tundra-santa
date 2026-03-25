'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyFactionThemeToDocument,
  DEFAULT_FACTION_THEME_ID,
  FACTION_THEME_STORAGE_KEY,
  isFactionThemeId,
  type FactionThemeId,
} from '@/lib/faction-ui-theme'

type FactionThemeContextValue = {
  activeFactionThemeId: FactionThemeId
  setFactionTheme: (factionId: string) => void
}

const FactionThemeContext = createContext<FactionThemeContextValue | null>(null)

export function useFactionTheme(): FactionThemeContextValue {
  const ctx = useContext(FactionThemeContext)
  if (!ctx) {
    throw new Error('useFactionTheme must be used within FactionThemeProvider')
  }
  return ctx
}

export function FactionThemeProvider({ children }: { children: ReactNode }) {
  const [activeFactionThemeId, setActiveFactionThemeId] =
    useState<FactionThemeId>(DEFAULT_FACTION_THEME_ID)

  const setFactionTheme = useCallback((factionId: string) => {
    if (!isFactionThemeId(factionId)) return
    localStorage.setItem(FACTION_THEME_STORAGE_KEY, factionId)
    applyFactionThemeToDocument(factionId)
    setActiveFactionThemeId(factionId)
  }, [])

  useEffect(() => {
    const raw = localStorage.getItem(FACTION_THEME_STORAGE_KEY)
    const fromDom =
      typeof document !== 'undefined'
        ? document.documentElement.dataset.faction
        : undefined
    let id: FactionThemeId = DEFAULT_FACTION_THEME_ID
    if (raw && isFactionThemeId(raw)) {
      id = raw
    } else if (fromDom && isFactionThemeId(fromDom)) {
      id = fromDom
    }
    applyFactionThemeToDocument(id)
    setActiveFactionThemeId(id)
    if (!raw || !isFactionThemeId(raw)) {
      localStorage.setItem(FACTION_THEME_STORAGE_KEY, id)
    }
  }, [])

  const value = useMemo(
    () => ({
      activeFactionThemeId,
      setFactionTheme,
    }),
    [activeFactionThemeId, setFactionTheme],
  )

  return (
    <FactionThemeContext.Provider value={value}>
      {children}
    </FactionThemeContext.Provider>
  )
}
