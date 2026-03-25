'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type {
  ComboMatchupStat,
  FactionMatchupSummary,
  LeagueMatchupGameRow,
} from '@/lib/league-cached-queries'
import { LeagueComboDisplay } from '@/components/league-combo-display'
import { FactionImage } from '@/components/faction-image'
import { WinRateBar } from '@/components/win-rate-bar'
import { formatLeagueBidPair } from '@/lib/league-format'
import { leaguePlayerProfileHref } from '@/lib/league-links'

type Props = {
  scope: string
  tierFilter: string | null
  minGames: number
  isAllScope: boolean
  matchups: ComboMatchupStat[]
  factionMatchups: FactionMatchupSummary[]
  initialMatchupSlug: string | null
}

function wlBar(wins: number, losses: number) {
  const t = wins + losses
  const p = t > 0 ? wins / t : 0
  return <WinRateBar rate={p} />
}

export function LeagueMatchupSection({
  scope,
  tierFilter,
  minGames,
  isAllScope,
  matchups,
  factionMatchups,
  initialMatchupSlug,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [openFactionKey, setOpenFactionKey] = useState<string | null>(null)
  const [openComboSlug, setOpenComboSlug] = useState<string | null>(null)
  const [gamesBySlug, setGamesBySlug] = useState<
    Record<string, LeagueMatchupGameRow[]>
  >({})
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [gamesError, setGamesError] = useState<string | null>(null)

  const setMatchupQuery = useCallback(
    (slug: string | null) => {
      const p = new URLSearchParams(searchParams.toString())
      if (slug) p.set('matchup', slug)
      else p.delete('matchup')
      const q = p.toString()
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const loadGames = useCallback(
    async (slug: string) => {
      if (gamesBySlug[slug]) return
      setLoadingSlug(slug)
      setGamesError(null)
      try {
        const tierQ = tierFilter ? `&tier=${encodeURIComponent(tierFilter)}` : ''
        const res = await fetch(
          `/api/league/matchup-games?scope=${encodeURIComponent(scope)}&slug=${encodeURIComponent(slug)}${tierQ}`
        )
        if (!res.ok) {
          setGamesError('Could not load games.')
          return
        }
        const data = (await res.json()) as { games: LeagueMatchupGameRow[] }
        setGamesBySlug((prev) => ({ ...prev, [slug]: data.games }))
      } finally {
        setLoadingSlug(null)
      }
    },
    [gamesBySlug, scope, tierFilter]
  )

  useEffect(() => {
    if (!initialMatchupSlug) return
    if (isAllScope) {
      const m = matchups.find((x) => x.matchupSlug === initialMatchupSlug)
      if (m) {
        const [f1, f2] =
          m.faction1 < m.faction2
            ? [m.faction1, m.faction2]
            : [m.faction2, m.faction1]
        setOpenFactionKey(`${f1}|${f2}`)
      }
    }
    setOpenComboSlug(initialMatchupSlug)
    void loadGames(initialMatchupSlug)
  }, [initialMatchupSlug, isAllScope, matchups, loadGames])

  const matRowsForFaction = useCallback(
    (fa: string, fb: string) =>
      matchups.filter(
        (m) =>
          (m.faction1 === fa && m.faction2 === fb) ||
          (m.faction1 === fb && m.faction2 === fa)
      ),
    [matchups]
  )

  const toggleCombo = async (slug: string) => {
    const next = openComboSlug === slug ? null : slug
    setOpenComboSlug(next)
    setMatchupQuery(next)
    if (next) await loadGames(next)
  }

  if (isAllScope) {
    return (
      <div className='space-y-3'>
        {factionMatchups.map((row) => {
          const key = `${row.faction1}|${row.faction2}`
          const open = openFactionKey === key
          const mats = matRowsForFaction(row.faction1, row.faction2)
          return (
            <div key={key} className='rounded-lg border bg-card/30 overflow-hidden'>
              <button
                type='button'
                className='flex w-full items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors'
                onClick={() => setOpenFactionKey(open ? null : key)}
              >
                {open ? (
                  <ChevronDown className='h-4 w-4 shrink-0 text-muted-foreground' />
                ) : (
                  <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground' />
                )}
                <div className='flex flex-1 flex-wrap items-center gap-4 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <FactionImage faction={row.faction1} width={32} height={32} />
                    <span className='font-medium capitalize'>{row.faction1}</span>
                  </div>
                  <span className='text-muted-foreground text-sm'>vs</span>
                  <div className='flex items-center gap-2'>
                    <FactionImage faction={row.faction2} width={32} height={32} />
                    <span className='font-medium capitalize'>{row.faction2}</span>
                  </div>
                </div>
                <div className='flex flex-col items-end gap-1 shrink-0 text-sm tabular-nums'>
                  <span>
                    {row.faction1Wins}-{row.faction2Wins} · {row.games} games
                  </span>
                  {wlBar(row.faction1Wins, row.faction2Wins)}
                </div>
              </button>
              {open && (
                <div className='border-t px-4 py-3 space-y-2 bg-muted/20'>
                  {mats.length === 0 && (
                    <p className='text-sm text-muted-foreground'>
                      No mat-level pairs meet the min sample ({minGames}) for this faction
                      pairing.
                    </p>
                  )}
                  {mats.map((m) => (
                    <div key={m.matchupSlug} className='rounded-md border bg-background'>
                      <button
                        type='button'
                        className='flex w-full flex-wrap items-center gap-3 p-3 text-left hover:bg-muted/50'
                        onClick={() => void toggleCombo(m.matchupSlug)}
                      >
                        {openComboSlug === m.matchupSlug ? (
                          <ChevronDown className='h-4 w-4 shrink-0' />
                        ) : (
                          <ChevronRight className='h-4 w-4 shrink-0' />
                        )}
                        <div className='flex flex-1 flex-wrap items-center gap-3 min-w-0'>
                          <LeagueComboDisplay
                            faction={m.faction1}
                            mat={m.mat1}
                            iconSize={24}
                          />
                          <span className='text-muted-foreground text-xs'>vs</span>
                          <LeagueComboDisplay
                            faction={m.faction2}
                            mat={m.mat2}
                            iconSize={24}
                          />
                        </div>
                        <div className='text-sm tabular-nums shrink-0'>
                          {m.combo1Wins}-{m.combo2Wins} · {m.games}g
                        </div>
                      </button>
                      {openComboSlug === m.matchupSlug && (
                        <MatchupGameTable
                          games={gamesBySlug[m.matchupSlug]}
                          loading={loadingSlug === m.matchupSlug}
                          error={gamesError}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {factionMatchups.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            No faction matchups meet the min sample for this filter.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      {matchups.map((m) => (
        <div key={m.matchupSlug} className='rounded-lg border bg-card/30 overflow-hidden'>
          <button
            type='button'
            className='flex w-full flex-wrap items-center gap-4 p-4 text-left hover:bg-muted/40 transition-colors'
            onClick={() => void toggleCombo(m.matchupSlug)}
          >
            {openComboSlug === m.matchupSlug ? (
              <ChevronDown className='h-4 w-4 shrink-0 text-muted-foreground' />
            ) : (
              <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground' />
            )}
            <div className='flex flex-1 flex-wrap items-center gap-4 min-w-0'>
              <LeagueComboDisplay faction={m.faction1} mat={m.mat1} />
              <span className='text-muted-foreground text-sm'>vs</span>
              <LeagueComboDisplay faction={m.faction2} mat={m.mat2} />
            </div>
            <div className='flex flex-col gap-1 items-end shrink-0'>
              <span className='text-sm font-medium tabular-nums'>
                {m.combo1Wins}-{m.combo2Wins}
              </span>
              <span className='text-xs text-muted-foreground'>{m.games} games</span>
              <div className='w-36'>{wlBar(m.combo1Wins, m.combo2Wins)}</div>
            </div>
          </button>
          {openComboSlug === m.matchupSlug && (
            <div className='border-t px-4 py-3'>
              <MatchupGameTable
                games={gamesBySlug[m.matchupSlug]}
                loading={loadingSlug === m.matchupSlug}
                error={gamesError}
              />
            </div>
          )}
        </div>
      ))}
      {matchups.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          No combo matchups meet the min sample for this scope and tier filter.
        </p>
      )}
    </div>
  )
}

function MatchupGameTable({
  games,
  loading,
  error,
}: {
  games: LeagueMatchupGameRow[] | undefined
  loading: boolean
  error: string | null
}) {
  if (loading) {
    return <p className='text-sm text-muted-foreground py-2'>Loading games…</p>
  }
  if (error) {
    return <p className='text-sm text-destructive py-2'>{error}</p>
  }
  if (!games?.length) {
    return (
      <p className='text-sm text-muted-foreground py-2'>
        No games in scope for this pairing.
      </p>
    )
  }

  return (
    <div className='overflow-x-auto text-sm'>
      <table className='w-full'>
        <thead>
          <tr className='border-b text-left text-muted-foreground'>
            <th className='py-2 pr-3'>Game</th>
            <th className='py-2 pr-3'>Players</th>
            <th className='py-2 pr-3'>Score</th>
            <th className='py-2 pr-3'>Bid</th>
            <th className='py-2'>Winner</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g.gameId} className='border-b border-border/60'>
              <td className='py-2 pr-3 align-top max-w-[180px]'>
                <span className='text-xs text-muted-foreground'>#{g.gameId}</span>
                {g.gameName && (
                  <div className='truncate text-xs' title={g.gameName}>
                    {g.gameName}
                  </div>
                )}
              </td>
              <td className='py-2 pr-3 align-top'>
                <div className='flex flex-col gap-0.5'>
                  <Link
                    href={leaguePlayerProfileHref(g.playerA)}
                    className='text-primary hover:underline w-fit'
                  >
                    {g.playerA}
                  </Link>
                  <Link
                    href={leaguePlayerProfileHref(g.playerB)}
                    className='text-primary hover:underline w-fit'
                  >
                    {g.playerB}
                  </Link>
                </div>
              </td>
              <td className='py-2 pr-3 tabular-nums align-top'>
                {g.scoreA ?? '—'} – {g.scoreB ?? '—'}
              </td>
              <td className='py-2 pr-3 tabular-nums align-top'>
                {formatLeagueBidPair(g.bidA, g.bidB)}
              </td>
              <td className='py-2 align-top'>
                {g.winnerUsername ? (
                  <Link
                    href={leaguePlayerProfileHref(g.winnerUsername)}
                    className='text-primary font-medium hover:underline'
                  >
                    {g.winnerUsername}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
