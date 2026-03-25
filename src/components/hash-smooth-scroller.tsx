'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const SESSION_KEY = 'hash-smooth-pending'

function readHashTargetId(): string | null {
  if (typeof window === 'undefined') return null
  const raw = window.location.hash
  if (!raw || raw.length < 2) return null
  const id = decodeURIComponent(raw.slice(1))
  return id || null
}

function readPendingTargetId(expectedPathname: string): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const pending = JSON.parse(raw) as { pathname: string; targetId: string }
    if (!pending?.pathname || pending.pathname !== expectedPathname) return null
    return pending.targetId || null
  } catch {
    return null
  }
}

function clearPending() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

function scrollIntoViewById(targetId: string) {
  const el = document.getElementById(targetId)
  if (!el) return false
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return true
}

function startObserverScroll(targetId: string, timeoutMs: number) {
  // Try immediately first (case where bracket rendered fast).
  if (scrollIntoViewById(targetId)) return

  const startedAt = performance.now()
  const obs = new MutationObserver(() => {
    if (scrollIntoViewById(targetId)) {
      obs.disconnect()
      return
    }
    if (performance.now() - startedAt > timeoutMs) {
      obs.disconnect()
    }
  })

  obs.observe(document.body, { childList: true, subtree: true })

  // Ensure we disconnect if nothing mutates further.
  window.setTimeout(() => obs.disconnect(), timeoutMs)
}

export function HashSmoothScroller() {
  const pathname = usePathname()

  useEffect(() => {
    const run = () => {
      const pendingTargetId = readPendingTargetId(pathname)
      const hashTargetId = readHashTargetId()
      const targetId = hashTargetId ?? pendingTargetId
      if (!targetId) return

      // If we consumed pending, clear it so refresh doesn’t re-scroll unexpectedly.
      if (pendingTargetId && !hashTargetId) clearPending()

      startObserverScroll(targetId, 20000)
    }

    run()
    const onHashChange = () => run()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [pathname])

  return null
}
