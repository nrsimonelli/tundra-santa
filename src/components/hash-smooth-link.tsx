'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

const SESSION_KEY = 'hash-smooth-pending'

type Props = {
  href: string
  className?: string
  children: React.ReactNode
  title?: string
}

type Pending = {
  pathname: string
  targetId: string
}

function safeSetPending(p: Pending) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(p))
  } catch {
    // Non-fatal: if storage is blocked, we fall back to URL hash behavior.
  }
}

export function HashSmoothLink({ href, className, children, title }: Props) {
  const router = useRouter()

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Respect browser / OS behaviors: open in new tab/window or allow
      // modified clicks to work normally.
      if (e.defaultPrevented) return
      if (e.button !== 0) return // left click only
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      let url: URL
      try {
        url = new URL(href, window.location.origin)
      } catch {
        return
      }

      const hash = url.hash
      if (!hash || hash.length < 2) return

      const targetId = decodeURIComponent(hash.slice(1))
      if (!targetId) return

      // Prevent native hash navigation (which can jump before async content mounts).
      e.preventDefault()

      safeSetPending({
        pathname: url.pathname,
        targetId,
      })

      // Remove the hash from the URL during navigation. We'll smooth-scroll
      // after the destination mounts (see `HashSmoothScroller`).
      const nextHref = `${url.pathname}${url.search}`
      router.push(nextHref, { scroll: false })
    },
    [href, router],
  )

  return (
    <Link href={href} className={className} title={title} onClick={onClick}>
      {children}
    </Link>
  )
}
