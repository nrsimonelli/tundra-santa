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
  setFactionThemeCookie,
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

export function FactionThemeProvider({
  children,
  initialFactionThemeId = DEFAULT_FACTION_THEME_ID,
}: {
  children: ReactNode
  /** From SSR cookie; must match `data-faction` on `<html>`. */
  initialFactionThemeId?: FactionThemeId
}) {
  const [activeFactionThemeId, setActiveFactionThemeId] =
    useState<FactionThemeId>(initialFactionThemeId)

  const setFactionTheme = useCallback((factionId: string) => {
    if (!isFactionThemeId(factionId)) return
    localStorage.setItem(FACTION_THEME_STORAGE_KEY, factionId)
    setFactionThemeCookie(factionId)
    applyFactionThemeToDocument(factionId)
    setActiveFactionThemeId(factionId)
  }, [])

  useEffect(() => {
    const raw = localStorage.getItem(FACTION_THEME_STORAGE_KEY)
    let id: FactionThemeId = initialFactionThemeId

    if (raw && isFactionThemeId(raw)) {
      id = raw
      if (raw !== initialFactionThemeId) {
        applyFactionThemeToDocument(raw)
        setFactionThemeCookie(raw)
      }
    } else {
      localStorage.setItem(FACTION_THEME_STORAGE_KEY, initialFactionThemeId)
    }

    applyFactionThemeToDocument(id)
    setActiveFactionThemeId(id)
  }, [initialFactionThemeId])

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
