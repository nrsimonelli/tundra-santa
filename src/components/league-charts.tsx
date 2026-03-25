'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { RechartsTooltipCard } from '@/components/recharts-tooltip-card'
import {
  RECHARTS_AXIS_STROKE,
  RECHARTS_GRID_STROKE,
  RECHARTS_TICK,
} from '@/lib/recharts-theme'

type BidEfficiencyPoint = {
  bucket: string
  games: number
  winRate: number
  avgScoreDiff: number
}

export function LeagueBidEfficiencyChart({
  data,
}: {
  data: BidEfficiencyPoint[]
}) {
  return (
    <div className='h-[280px] w-full min-w-0'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={data} margin={{ left: 8, right: 8, top: 12 }}>
          <CartesianGrid
            strokeDasharray='3 3'
            stroke='hsl(var(--border))'
          />
          <XAxis
            dataKey='bucket'
            tickLine={false}
            axisLine={false}
            tick={RECHARTS_TICK}
            stroke={RECHARTS_AXIS_STROKE}
          />
          <YAxis
            yAxisId='left'
            tickFormatter={(value) => `${Math.round(value * 100)}%`}
            domain={[0, 1]}
            tickLine={false}
            axisLine={false}
            tick={RECHARTS_TICK}
            stroke={RECHARTS_AXIS_STROKE}
          />
          <YAxis
            yAxisId='right'
            orientation='right'
            tickLine={false}
            axisLine={false}
            tick={RECHARTS_TICK}
            stroke={RECHARTS_AXIS_STROKE}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const win = payload.find((p) => p.dataKey === 'winRate')?.value as
                | number
                | undefined
              const diff = payload.find((p) => p.dataKey === 'avgScoreDiff')
                ?.value as number | undefined
              return (
                <RechartsTooltipCard>
                  <p className='font-medium text-popover-foreground'>{label}</p>
                  {win != null && (
                    <p className='text-muted-foreground'>
                      Win rate: {(win * 100).toFixed(1)}%
                    </p>
                  )}
                  {diff != null && (
                    <p className='text-muted-foreground'>
                      Avg score diff: {diff.toFixed(2)}
                    </p>
                  )}
                </RechartsTooltipCard>
              )
            }}
          />
          <Bar yAxisId='left' dataKey='winRate' fill='var(--gradient-from)' />
          <Line
            yAxisId='right'
            type='monotone'
            dataKey='avgScoreDiff'
            stroke='var(--gradient-to)'
            strokeWidth={2}
            dot={{ r: 2, fill: 'hsl(var(--foreground))', strokeWidth: 0 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
