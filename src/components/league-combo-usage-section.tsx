'use client'

import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ComboStat } from '@/lib/league-cached-queries'
import { LeagueComboDisplay } from '@/components/league-combo-display'
import { FactionImage } from '@/components/faction-image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatLeagueBid,
  formatPlayerMatLabel,
  LEAGUE_FACTION_ICON_ORDER,
  PLAYER_MAT_ORDER,
} from '@/lib/league-format'
import {
  RECHARTS_AXIS_STROKE,
  RECHARTS_GRID_STROKE,
  RECHARTS_LABEL_FILL,
  RECHARTS_TICK,
} from '@/lib/recharts-theme'
import { cn } from '@/lib/utils'
import { RechartsTooltipCard } from '@/components/recharts-tooltip-card'

type Props = {
  comboStats: ComboStat[]
}

export function LeagueComboUsageSection({ comboStats }: Props) {
  const defaultFaction = LEAGUE_FACTION_ICON_ORDER[0]
  const [faction, setFaction] = useState<string>(defaultFaction)

  const byFactionMat = useMemo(() => {
    const m = new Map<string, ComboStat>()
    for (const row of comboStats) {
      m.set(`${row.faction}|${row.mat}`, row)
    }
    return m
  }, [comboStats])

  const factionGameTotal = useMemo(() => {
    let n = 0
    for (const id of PLAYER_MAT_ORDER) {
      const row = byFactionMat.get(`${faction}|${id}`)
      if (row) n += row.games
    }
    return n
  }, [byFactionMat, faction])

  const matRows = useMemo(
    () =>
      PLAYER_MAT_ORDER.map((matId) => {
        const stat = byFactionMat.get(`${faction}|${matId}`) ?? null
        return {
          matId,
          label: formatPlayerMatLabel(matId),
          stat,
          games: stat?.games ?? 0,
        }
      }),
    [byFactionMat, faction],
  )

  const chartData = useMemo(
    () =>
      matRows.map((r) => ({
        key: `${faction}|${r.matId}`,
        label: r.label,
        games: r.games,
      })),
    [faction, matRows],
  )

  const usageShare = (games: number) =>
    factionGameTotal > 0 ? (games / factionGameTotal) * 100 : 0

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-center gap-2 sm:gap-3 border rounded-lg bg-card/30 p-3'>
        {LEAGUE_FACTION_ICON_ORDER.map((f) => {
          const selected = faction === f
          return (
            <button
              key={f}
              type='button'
              aria-pressed={selected}
              title={f.charAt(0).toUpperCase() + f.slice(1)}
              onClick={() => setFaction(f)}
              className={cn(
                'rounded-full p-1 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                selected
                  ? 'ring-2 ring-primary shadow-sm'
                  : 'opacity-70 hover:opacity-100',
              )}
            >
              <FactionImage faction={f} width={40} height={40} />
            </button>
          )
        })}
      </div>

      <div className='h-[min(420px,60vh)] w-full min-h-[280px] border rounded-lg p-2 bg-card/20'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={chartData}
            layout='vertical'
            margin={{ top: 8, right: 48, left: 8, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray='3 3'
              stroke={RECHARTS_GRID_STROKE}
            />
            <XAxis
              type='number'
              tick={RECHARTS_TICK}
              stroke={RECHARTS_AXIS_STROKE}
            />
            <YAxis
              type='category'
              dataKey='label'
              width={112}
              tick={RECHARTS_TICK}
              stroke={RECHARTS_AXIS_STROKE}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted)/50)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as {
                  label: string
                  games: number
                }
                return (
                  <RechartsTooltipCard>
                    <p className='font-medium text-popover-foreground'>
                      {row.label}
                    </p>
                    <p className='text-muted-foreground'>Games: {row.games}</p>
                  </RechartsTooltipCard>
                )
              }}
            />
            <Bar
              dataKey='games'
              name='games'
              fill='hsl(var(--primary))'
              radius={[0, 4, 4, 0]}
            >
              <LabelList
                dataKey='games'
                position='right'
                fontSize={12}
                fill={RECHARTS_LABEL_FILL}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='text-primary'>Combo</TableHead>
            <TableHead className='text-primary'>Games</TableHead>
            <TableHead className='text-primary'>Usage%</TableHead>
            <TableHead className='text-primary'>Win%</TableHead>
            <TableHead className='text-primary'>Avg bid</TableHead>
            <TableHead className='text-primary'>Avg score</TableHead>
            <TableHead className='text-primary'>Avg score Δ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matRows.map(({ matId, stat, games }) => (
            <TableRow key={`${faction}|${matId}`}>
              <TableCell>
                <LeagueComboDisplay faction={faction} mat={matId} />
              </TableCell>
              <TableCell className='tabular-nums'>{games}</TableCell>
              <TableCell className='tabular-nums'>
                {usageShare(games).toFixed(1)}%
              </TableCell>
              <TableCell className='tabular-nums'>
                {stat && games > 0
                  ? `${(stat.winRate * 100).toFixed(1)}%`
                  : '—'}
              </TableCell>
              <TableCell className='tabular-nums'>
                {formatLeagueBid(stat?.avgBid ?? null)}
              </TableCell>
              <TableCell className='tabular-nums'>
                {stat?.avgScore == null ? '—' : stat.avgScore.toFixed(1)}
              </TableCell>
              <TableCell className='tabular-nums'>
                {stat && games > 0 ? stat.avgScoreDiff.toFixed(2) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
