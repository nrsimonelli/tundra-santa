'use client'

import { useRouter } from 'next/navigation'
import type { LeagueEventOption } from '@/lib/league-cached-queries'

export function LeagueScopeSelect({
  options,
  currentScope,
  searchSuffix,
  variant = 'analytics',
}: {
  options: LeagueEventOption[]
  currentScope: string
  searchSuffix: string
  /** `analytics` → `/league/[scope]`; `standings` → `/league/standings/[scope]` */
  variant?: 'analytics' | 'standings'
}) {
  const router = useRouter()

  const basePath =
    variant === 'standings' ? '/league/standings' : '/league'

  return (
    <label className='flex flex-col gap-1 text-sm'>
      <span className='text-muted-foreground font-medium'>League scope</span>
      <select
        className='h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
        value={currentScope}
        onChange={(e) => {
          const next = e.target.value
          router.push(`${basePath}/${next}${searchSuffix}`)
        }}
      >
        <option value='all'>All league events</option>
        {options.map((opt) => (
          <option key={opt.id} value={String(opt.id)}>
            {opt.name ?? `Event ${opt.id}`}
            {opt.start_date
              ? ` (${new Date(opt.start_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })})`
              : ''}
            {` — ${opt.gameCount} games`}
          </option>
        ))}
      </select>
    </label>
  )
}
