'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { LeaguePlayerGameRow } from '@/lib/league-cached-queries'
import { LeagueComboDisplay } from '@/components/league-combo-display'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatLeagueBidPair } from '@/lib/league-format'
import { leaguePlayerProfileHref } from '@/lib/league-links'

type Props = {
  games: LeaguePlayerGameRow[]
}

export function LeaguePlayerGamesTabs({ games }: Props) {
  const seasons = useMemo(() => {
    const m = new Map<number, LeaguePlayerGameRow[]>()
    for (const g of games) {
      if (g.seasonIndex <= 0) continue
      const list = m.get(g.seasonIndex) ?? []
      list.push(g)
      m.set(g.seasonIndex, list)
    }
    return Array.from(m.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([seasonIndex, list]) => ({
        seasonIndex,
        label: `S${seasonIndex}`,
        games: list.sort((a, b) => b.gameId - a.gameId),
      }))
  }, [games])

  const [active, setActive] = useState<number | 'all'>(
    seasons[0]?.seasonIndex ?? 'all'
  )

  const visible =
    active === 'all'
      ? games
      : games.filter((g) => g.seasonIndex === active)

  if (seasons.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='text-primary'>Result</TableHead>
            <TableHead className='text-primary'>Opponent</TableHead>
            <TableHead className='text-primary'>You</TableHead>
            <TableHead className='text-primary'>Opp</TableHead>
            <TableHead className='text-primary'>Score</TableHead>
            <TableHead className='text-primary'>Bid</TableHead>
            <TableHead className='text-primary'>Game</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((g) => (
            <GameRow key={g.gameId} g={g} />
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          onClick={() => setActive('all')}
          className={cn(
            'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
            active === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-input bg-background hover:bg-muted/60'
          )}
        >
          All seasons
        </button>
        {seasons.map((s) => (
          <button
            key={s.seasonIndex}
            type='button'
            onClick={() => setActive(s.seasonIndex)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
              active === s.seasonIndex
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-input bg-background hover:bg-muted/60'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='text-primary'>Result</TableHead>
            <TableHead className='text-primary'>Opponent</TableHead>
            <TableHead className='text-primary'>Tier</TableHead>
            <TableHead className='text-primary'>You</TableHead>
            <TableHead className='text-primary'>Opp</TableHead>
            <TableHead className='text-primary'>Score</TableHead>
            <TableHead className='text-primary'>Bid</TableHead>
            <TableHead className='text-primary'>Game</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((g) => (
            <GameRow key={g.gameId} g={g} />
          ))}
          {visible.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className='text-muted-foreground'>
                No games in this season.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function GameRow({ g }: { g: LeaguePlayerGameRow }) {
  return (
    <TableRow>
      <TableCell>
        <span
          className={cn(
            'text-xs font-semibold uppercase',
            g.won ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {g.won ? 'Win' : 'Loss'}
        </span>
      </TableCell>
      <TableCell>
        <Link
          href={leaguePlayerProfileHref(g.opponent)}
          className='text-primary hover:underline font-medium'
        >
          {g.opponent}
        </Link>
      </TableCell>
      <TableCell>
        <span className='text-xs rounded-md border px-1.5 py-0.5 bg-muted/40'>
          {g.tierLabel}
        </span>
      </TableCell>
      <TableCell>
        <LeagueComboDisplay faction={g.myFaction} mat={g.myMat} iconSize={22} />
      </TableCell>
      <TableCell>
        <LeagueComboDisplay faction={g.oppFaction} mat={g.oppMat} iconSize={22} />
      </TableCell>
      <TableCell className='tabular-nums text-sm'>
        {g.myScore ?? '—'} – {g.oppScore ?? '—'}
      </TableCell>
      <TableCell className='tabular-nums text-sm'>
        {formatLeagueBidPair(g.myBid, g.oppBid)}
      </TableCell>
      <TableCell className='max-w-[160px]'>
        <span className='text-xs text-muted-foreground'>#{g.gameId}</span>
        {g.seasonIndex > 0 && (
          <div className='text-[10px] text-muted-foreground'>S{g.seasonIndex}</div>
        )}
        {g.gameName && (
          <div className='text-xs truncate' title={g.gameName ?? ''}>
            {g.gameName}
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}
