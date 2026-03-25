'use client'

import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type {
  LeaguePlayerFactionStat,
  LeaguePlayerGameRow,
} from '@/lib/league-cached-queries'
import { LeagueFactionDonut } from '@/components/league-faction-donut'
import { WinRateBar } from '@/components/win-rate-bar'
import { FactionImage } from '@/components/faction-image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatPlayerMatLabel } from '@/lib/league-format'
import { cn } from '@/lib/utils'

function matRowsForFaction(
  games: LeaguePlayerGameRow[],
  faction: string
): {
  matKey: string
  matLabel: string
  games: number
  wins: number
  losses: number
  winRate: number
}[] {
  const filtered = games.filter((g) => g.myFaction === faction)
  const byMat = new Map<string | null, { wins: number; losses: number }>()
  for (const g of filtered) {
    const key = g.myMat
    const row = byMat.get(key) ?? { wins: 0, losses: 0 }
    if (g.won) row.wins += 1
    else row.losses += 1
    byMat.set(key, row)
  }
  return Array.from(byMat.entries())
    .map(([mat, stats]) => {
      const n = stats.wins + stats.losses
      const matKey = mat == null || mat === '' ? '—' : mat
      return {
        matKey,
        matLabel: formatPlayerMatLabel(mat),
        games: n,
        wins: stats.wins,
        losses: stats.losses,
        winRate: n > 0 ? stats.wins / n : 0,
      }
    })
    .sort((a, b) => b.games - a.games)
}

type Props = {
  factionByPlay: LeaguePlayerFactionStat[]
  gamesPlayed: LeaguePlayerGameRow[]
}

export function LeagueFactionsYouPlayedSection({
  factionByPlay,
  gamesPlayed,
}: Props) {
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null)

  if (factionByPlay.length === 0) return null

  return (
    <section className='space-y-4'>
      <h2 className='text-xl font-semibold'>Factions you played</h2>
      <p className='text-sm text-muted-foreground max-w-3xl'>
        Stats use only 1v1 league games where you chose each faction. Click a
        row for mat breakdown (W–L and win rate by player mat).
      </p>

      <div className='flex flex-col gap-8'>
        <LeagueFactionDonut rows={factionByPlay} />

        <div className='w-full min-w-0 space-y-4'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='text-primary'>Faction</TableHead>
                <TableHead className='text-primary'>Games</TableHead>
                <TableHead className='text-primary'>W-L</TableHead>
                <TableHead className='text-primary'>Win%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factionByPlay.map((row) => {
                const isOpen = selectedFaction === row.faction
                const matRows = isOpen
                  ? matRowsForFaction(gamesPlayed, row.faction)
                  : []
                return (
                  <Fragment key={row.faction}>
                    <TableRow
                      role='button'
                      tabIndex={0}
                      aria-expanded={isOpen}
                      aria-label={`${row.faction}, ${row.games} games. ${isOpen ? 'Collapse' : 'Expand'} mat breakdown.`}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isOpen && 'bg-muted/35'
                      )}
                      onClick={() =>
                        setSelectedFaction(isOpen ? null : row.faction)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedFaction(isOpen ? null : row.faction)
                        }
                      }}
                    >
                      <TableCell className='min-w-[140px]'>
                        <div className='flex items-center gap-2'>
                          {isOpen ? (
                            <ChevronDown className='size-4 shrink-0 text-muted-foreground' />
                          ) : (
                            <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
                          )}
                          <FactionImage
                            faction={row.faction}
                            width={24}
                            height={24}
                          />
                          <span className='capitalize whitespace-nowrap'>
                            {row.faction}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='tabular-nums whitespace-nowrap'>
                        {row.games}
                      </TableCell>
                      <TableCell className='tabular-nums whitespace-nowrap'>
                        {row.wins}-{row.losses}
                      </TableCell>
                      <TableCell className='min-w-[120px]'>
                        <WinRateBar rate={row.winRate} />
                      </TableCell>
                    </TableRow>
                    {isOpen &&
                      matRows.length > 0 &&
                      matRows.map((r) => (
                        <TableRow
                          key={r.matKey}
                          className='bg-muted/15 hover:bg-muted/20 border-0'
                        >
                          <TableCell className='min-w-[140px]'>
                            <span className='pl-14 text-sm font-medium text-foreground'>
                              {r.matLabel}
                            </span>
                          </TableCell>
                          <TableCell className='tabular-nums whitespace-nowrap text-sm'>
                            {r.games}
                          </TableCell>
                          <TableCell className='tabular-nums whitespace-nowrap text-sm'>
                            {r.wins}-{r.losses}
                          </TableCell>
                          <TableCell className='min-w-[120px] text-sm'>
                            <WinRateBar rate={r.winRate} />
                          </TableCell>
                        </TableRow>
                      ))}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  )
}
