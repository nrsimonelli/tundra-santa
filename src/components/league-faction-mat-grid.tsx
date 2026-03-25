'use client'

import { useRouter } from 'next/navigation'
import { FactionImage } from '@/components/faction-image'
import type { LeagueFactionMatGrid } from '@/lib/league-cached-queries'
import { cn } from '@/lib/utils'

function gridCellClass(
  winRate: number | null,
  games: number,
  minCellGames: number
): string {
  if (games === 0) return 'bg-muted/20 text-muted-foreground'
  if (games < minCellGames) return 'bg-muted/30 text-muted-foreground'
  if (winRate == null) return 'bg-muted/30 text-muted-foreground'
  if (winRate >= 0.65) return 'bg-emerald-600/35'
  if (winRate >= 0.55) return 'bg-emerald-500/20'
  if (winRate <= 0.35) return 'bg-rose-600/35'
  if (winRate <= 0.45) return 'bg-rose-500/20'
  return 'bg-muted/40'
}

function buildHref(
  scope: string,
  tierParam: string | null,
  minGames: number,
  fa: string,
  fb: string
): string {
  const p = new URLSearchParams()
  if (tierParam) p.set('tier', tierParam)
  p.set('minGames', String(minGames))
  if (fa) p.set('fa', fa)
  if (fb) p.set('fb', fb)
  const q = p.toString()
  return `/league/${scope}${q ? `?${q}` : ''}`
}

export function LeagueFactionMatGridSection({
  scope,
  tierParam,
  minGames,
  factions,
  fa,
  fb,
  grid,
  minCellGames,
}: {
  scope: string
  tierParam: string | null
  minGames: number
  factions: string[]
  fa: string
  fb: string
  grid: LeagueFactionMatGrid | null
  minCellGames: number
}) {
  const router = useRouter()

  return (
    <section className='space-y-3'>
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2'>
        <h3 className='text-xl font-semibold'>Faction vs faction (mat × mat)</h3>
        <p className='text-sm text-muted-foreground max-w-xl'>
          Win rate for{' '}
          <span className='font-medium text-foreground'>faction A</span> (rows: A&apos;s mat) when
          facing <span className='font-medium text-foreground'>faction B</span> (columns: B&apos;s
          mat). Only 1v1 games with both mats recorded.
        </p>
      </div>

      <div className='flex flex-wrap items-end gap-4'>
        <label className='flex flex-col gap-1 text-sm min-w-[180px]'>
          <span className='text-muted-foreground font-medium'>Faction A (perspective)</span>
          <select
            className='h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            value={fa}
            onChange={(e) =>
              router.push(buildHref(scope, tierParam, minGames, e.target.value, fb))
            }
          >
            <option value=''>Choose faction…</option>
            {factions.map((f) => (
              <option key={f} value={f} disabled={f === fb}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className='flex flex-col gap-1 text-sm min-w-[180px]'>
          <span className='text-muted-foreground font-medium'>Faction B (opponent)</span>
          <select
            className='h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            value={fb}
            onChange={(e) =>
              router.push(buildHref(scope, tierParam, minGames, fa, e.target.value))
            }
          >
            <option value=''>Choose faction…</option>
            {factions.map((f) => (
              <option key={f} value={f} disabled={f === fa}>
                {f}
              </option>
            ))}
          </select>
        </label>
      </div>

      {fa && fb && fa === fb && (
        <p className='text-sm text-muted-foreground'>Choose two different factions.</p>
      )}

      {fa && fb && fa !== fb && grid && (
        <p className='text-xs text-muted-foreground'>
          {grid.gamesWithBothFactions} games with these factions · {grid.gamesWithBothMats} with
          both mats set
        </p>
      )}

      {fa && fb && fa !== fb && grid && grid.matsA.length > 0 && grid.matsB.length > 0 && (
        <div className='overflow-x-auto border rounded-lg'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b'>
                <th className='p-2 text-left align-middle w-36'>
                  <div className='flex items-center gap-2'>
                    <FactionImage faction={fa} width={24} height={24} />
                    <span className='capitalize text-xs'>A mat</span>
                  </div>
                </th>
                {grid.matsB.map((mb) => (
                  <th
                    key={mb}
                    className='p-2 text-center align-bottom max-w-[100px]'
                    title={mb}
                  >
                    <span className='text-[11px] font-medium line-clamp-2'>{mb}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.matsA.map((ma) => (
                <tr key={ma} className='border-b'>
                  <td className='p-2 font-medium text-xs align-middle max-w-[140px]' title={ma}>
                    <span className='line-clamp-2'>{ma}</span>
                  </td>
                  {grid.matsB.map((mb) => {
                    const cell = grid.cells[ma]?.[mb]
                    const games = cell?.games ?? 0
                    const wr = cell?.winRate ?? null
                    const cls = gridCellClass(wr, games, minCellGames)
                    return (
                      <td key={mb} className={cn('p-2 text-center align-middle', cls)}>
                        {games === 0 ? (
                          '—'
                        ) : (
                          <>
                            <div className='tabular-nums font-medium'>
                              {wr == null ? '—' : `${Math.round(wr * 100)}%`}
                            </div>
                            <div className='text-[10px] text-muted-foreground leading-tight'>
                              {cell?.aWins ?? 0}-{games - (cell?.aWins ?? 0)} · n={games}
                            </div>
                          </>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {fa && fb && fa !== fb && grid && (grid.matsA.length === 0 || grid.matsB.length === 0) && (
        <p className='text-sm text-muted-foreground'>
          No mat × mat samples in this scope/tier (both players need a recorded mat).
        </p>
      )}
    </section>
  )
}
