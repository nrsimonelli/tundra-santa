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
    <div className='h-[280px] w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={data} margin={{ left: 8, right: 8, top: 12 }}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='bucket' tickLine={false} axisLine={false} />
          <YAxis
            yAxisId='left'
            tickFormatter={(value) => `${Math.round(value * 100)}%`}
            domain={[0, 1]}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId='right'
            orientation='right'
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'winRate') return [`${(value * 100).toFixed(1)}%`, 'Win rate']
              if (name === 'avgScoreDiff')
                return [value.toFixed(2), 'Avg score diff']
              return [value, name]
            }}
          />
          <Bar yAxisId='left' dataKey='winRate' fill='var(--gradient-from)' />
          <Line
            yAxisId='right'
            type='monotone'
            dataKey='avgScoreDiff'
            stroke='var(--gradient-to)'
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
