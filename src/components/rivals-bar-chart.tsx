'use client'

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { RechartsTooltipCard } from '@/components/recharts-tooltip-card'
import {
  RECHARTS_AXIS_STROKE,
  RECHARTS_TICK,
  RECHARTS_TICK_MUTED,
} from '@/lib/recharts-theme'
import type { NemesisRecord } from '@/lib/supabase/cached-queries'

type Row = NemesisRecord & { label: string }

function prepareRows(rivals: NemesisRecord[]): Row[] {
  return [...rivals]
    .sort((a, b) => b.totalGames - a.totalGames)
    .map((r) => ({
      ...r,
      label:
        r.username.length > 18 ? `${r.username.slice(0, 18)}…` : r.username,
    }))
}

type TooltipProps = {
  active?: boolean
  payload?: { payload: Row }[]
}

export function RivalsBarChart({ rivals }: { rivals: NemesisRecord[] }) {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && /defaultProps/.test(args[0])) return
    originalError(...args)
  }

  const data = prepareRows(rivals)
  const height = Math.min(120 + data.length * 36, 520)

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length > 0) {
      const row = payload[0].payload
      return (
        <RechartsTooltipCard>
          <p className='font-semibold text-popover-foreground'>
            {row.username}
          </p>
          <p className='text-sm text-muted-foreground tabular-nums'>
            {row.wins}W / {row.losses}L / {row.draws}D ({row.totalGames} games)
          </p>
        </RechartsTooltipCard>
      )
    }
    return null
  }

  return (
    <div className='w-full min-w-0'>
      <ResponsiveContainer width='100%' height={height}>
        <BarChart
          layout='vertical'
          data={data}
          margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
          barCategoryGap={6}
        >
          <XAxis
            type='number'
            stroke={RECHARTS_AXIS_STROKE}
            tickLine={false}
            axisLine={false}
            tick={RECHARTS_TICK_MUTED}
            allowDecimals={false}
          />
          <YAxis
            type='category'
            dataKey='label'
            width={108}
            stroke={RECHARTS_AXIS_STROKE}
            tickLine={false}
            axisLine={false}
            tick={{ ...RECHARTS_TICK, fontSize: 11 }}
            interval={0}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'hsl(var(--muted) / 0.25)' }}
          />
          <Bar
            dataKey='wins'
            name='Wins'
            stackId='h2h'
            fill='hsl(var(--primary))'
          />
          <Bar
            dataKey='losses'
            name='Losses'
            stackId='h2h'
            fill='hsl(var(--muted-foreground) / 0.45)'
          />
          <Bar
            dataKey='draws'
            name='Draws'
            stackId='h2h'
            fill='hsl(var(--border))'
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
