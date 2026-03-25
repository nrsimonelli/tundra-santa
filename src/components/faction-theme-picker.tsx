'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFactionTheme } from '@/components/faction-theme-provider'
import { FACTION_THEME_IDS, type FactionThemeId } from '@/lib/faction-ui-theme'

import albionImage from '@/assets/factions/albion.png'
import crimeaImage from '@/assets/factions/crimea.png'
import nordicImage from '@/assets/factions/nordic.png'
import polaniaImage from '@/assets/factions/polania.png'
import rusvietImage from '@/assets/factions/rusviet.png'
import saxonyImage from '@/assets/factions/saxony.png'
import togawaImage from '@/assets/factions/togawa.png'

const pickerFactionImages: Record<FactionThemeId, typeof albionImage> = {
  albion: albionImage,
  crimea: crimeaImage,
  nordic: nordicImage,
  polania: polaniaImage,
  rusviet: rusvietImage,
  saxony: saxonyImage,
  togawa: togawaImage,
}

/** Orbit radius (px) from hub center; positive translateY places icons on a U below the hub. */
const RADIAL_R = 92
const STAGGER_MS = 42
const DURATION_MS = 280
/** Longest close: duration + reverse stagger for last icon + buffer. */
const CLOSE_UNMOUNT_MS =
  DURATION_MS + STAGGER_MS * (FACTION_THEME_IDS.length - 2) + 120

export function FactionThemePicker() {
  const { activeFactionThemeId, setFactionTheme } = useFactionTheme()
  const [overlayMounted, setOverlayMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const others = useMemo(
    () =>
      FACTION_THEME_IDS.filter(
        (id) => id !== activeFactionThemeId,
      ) as FactionThemeId[],
    [activeFactionThemeId],
  )

  const n = others.length

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const beginClose = useCallback(() => {
    setExpanded(false)
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setOverlayMounted(false)
      closeTimerRef.current = null
    }, CLOSE_UNMOUNT_MS)
  }, [clearCloseTimer])

  const openMenu = useCallback(() => {
    clearCloseTimer()
    setOverlayMounted(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setExpanded(true))
    })
  }, [clearCloseTimer])

  const onTriggerClick = useCallback(() => {
    if (expanded) {
      beginClose()
    } else if (overlayMounted) {
      clearCloseTimer()
      setExpanded(true)
    } else {
      openMenu()
    }
  }, [expanded, overlayMounted, beginClose, openMenu, clearCloseTimer])

  useEffect(() => {
    if (!overlayMounted && !expanded) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') beginClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [overlayMounted, expanded, beginClose])

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer])

  return (
    <div className='relative'>
      <button
        type='button'
        className='flex h-10 w-10 items-center justify-center rounded-full bg-background/80 shadow-lg ring-offset-background backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        aria-expanded={expanded}
        aria-haspopup='listbox'
        aria-label='Choose faction theme'
        onClick={onTriggerClick}
      >
        <Image
          src={pickerFactionImages[activeFactionThemeId]}
          alt={`${activeFactionThemeId} theme`}
          width={40}
          height={40}
          className='h-10 w-10 object-contain'
        />
      </button>

      {overlayMounted ? (
        <>
          <div
            className='fixed inset-0 z-40 bg-transparent'
            aria-hidden
            onPointerDown={beginClose}
          />
          <div
            className='pointer-events-none absolute left-1/2 top-full z-50 mt-3 flex w-max -translate-x-1/2 flex-col items-center gap-3'
            role='listbox'
            aria-label='Other factions'
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Link
              href='/'
              className='pointer-events-auto z-[60] shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-sm text-background drop-shadow-[0_1px_2px_rgb(0_0_0/0.85)] hover:underline'
              onClick={() => {
                beginClose()
              }}
            >
              Home
            </Link>
            <div className='relative h-px w-px shrink-0'>
              {others.map((id, i) => {
                const angleDeg = n > 1 ? -90 + (180 * i) / (n - 1) : 0
                const delayOpen = expanded
                  ? i * STAGGER_MS
                  : (n - 1 - i) * STAGGER_MS
                return (
                  <button
                    key={id}
                    type='button'
                    role='option'
                    aria-label={`${id} theme`}
                    title={id}
                    className='pointer-events-auto absolute -right-5 -top-10 flex h-10 w-10 items-center justify-center rounded-full bg-popover/95 shadow-md transition-[transform,opacity] ease-out hover:bg-accent'
                    style={{
                      transform: expanded
                        ? `rotate(${angleDeg}deg) translateY(${RADIAL_R}px) rotate(${-angleDeg}deg) scale(1)`
                        : `rotate(${angleDeg}deg) translateY(0px) rotate(${-angleDeg}deg) scale(0.12)`,
                      opacity: expanded ? 1 : 0,
                      transitionDuration: `${DURATION_MS}ms`,
                      transitionDelay: `${delayOpen}ms`,
                    }}
                    onClick={() => {
                      setFactionTheme(id)
                      beginClose()
                    }}
                  >
                    <Image
                      src={pickerFactionImages[id]}
                      alt=''
                      width={36}
                      height={36}
                      className='h-9 w-9 object-contain'
                    />
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
