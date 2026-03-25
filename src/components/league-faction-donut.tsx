'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { LeaguePlayerFactionStat } from '@/lib/league-cached-queries'
import {
  factionChartFill,
  factionChartSegmentStroke,
} from '@/lib/faction-chart-colors'
import { FactionImage } from '@/components/faction-image'
import { cn } from '@/lib/utils'

type Props = {
  rows: LeaguePlayerFactionStat[]
}

type Slice = {
  factionKey: string
  displayName: string
  value: number
}

export function LeagueFactionDonut({ rows }: Props) {
  const data: Slice[] = rows.map((r) => ({
    factionKey: r.faction,
    displayName: r.faction.charAt(0).toUpperCase() + r.faction.slice(1),
    value: r.games,
  }))

  if (data.length === 0) {
    return (
      <p className='text-sm text-muted-foreground py-8 text-center'>
        No faction data for chart.
      </p>
    )
  }

  return (
    <div className='w-full max-w-md mx-auto space-y-4'>
      <div className='aspect-square w-full max-h-[360px] min-h-[240px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={data}
              dataKey='value'
              nameKey='displayName'
              cx='50%'
              cy='50%'
              innerRadius='44%'
              outerRadius='82%'
              paddingAngle={2}
            >
              {data.map((d) => {
                const stroke = factionChartSegmentStroke(d.factionKey)
                return (
                  <Cell
                    key={d.factionKey}
                    fill={factionChartFill(d.factionKey)}
                    stroke={stroke}
                    strokeWidth={stroke ? 1.5 : 0}
                  />
                )
              })}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload as Slice
                return (
                  <div className='rounded-md border bg-popover px-2.5 py-1.5 text-sm text-popover-foreground shadow-md'>
                    {p.displayName}: {p.value}
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className='flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-4 sm:gap-y-2'>
        {data.map((d) => {
          const isPolania = d.factionKey.trim().toLowerCase() === 'polania'
          return (
            <li
              key={d.factionKey}
              className='flex items-center gap-2 text-sm text-foreground'
            >
              <FactionImage faction={d.factionKey} width={22} height={22} />
              <span className='capitalize'>{d.factionKey}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
