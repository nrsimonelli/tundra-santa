'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FactionThemePicker } from '@/components/faction-theme-picker'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/league', label: '1v1 League' },
  { href: '/tournament', label: 'Tournaments' },
  { href: '/leaderboard', label: 'Leaderboard' },
] as const

export function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  return (
    <div className='top-3 z-50 left-0 w-full absolute'>
      <div className='flex justify-between items-center max-w-5xl h-16 px-4 sm:px-6 mx-auto text-[hsl(var(--hero-foreground))]'>
        <FactionThemePicker />
        <nav
          className='hidden md:flex items-center gap-3 lg:gap-4'
          aria-label='Main'
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              className='hover:opacity-90 whitespace-nowrap text-sm lg:text-base'
              href={href}
              prefetch={true}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button
          type='button'
          className='md:hidden flex h-10 w-10 items-center justify-center rounded-md hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--hero-foreground))]/40'
          aria-expanded={menuOpen}
          aria-controls='mobile-nav-panel'
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <X className='h-6 w-6' aria-hidden />
          ) : (
            <Menu className='h-6 w-6' aria-hidden />
          )}
        </button>
      </div>

      {menuOpen ? (
        <>
          <button
            type='button'
            className='fixed inset-0 z-40 bg-black/40 md:hidden'
            aria-label='Close menu'
            onClick={() => setMenuOpen(false)}
          />
          <div
            id='mobile-nav-panel'
            className='fixed left-0 right-0 z-50 md:hidden top-[calc(0.75rem+4rem)] border-b border-border/40 bg-background/95 text-foreground shadow-lg backdrop-blur-sm'
          >
            <nav
              className='max-w-5xl mx-auto px-4 py-3 flex flex-col gap-1'
              aria-label='Main'
            >
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  className='rounded-md px-3 py-2.5 text-base font-medium hover:bg-accent hover:text-accent-foreground'
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      ) : null}
    </div>
  )
}
