'use client'

import {
  ResponsiveContainer,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

export default function Chart({
  data,
}: {
  data: { name: string; date: string; rating: number }[]
}) {
  // override console.error
  // this is a hack to suppress the warning about missing defaultProps in recharts as of version 2.12
  const error = console.error
  console.error = (...args: any) => {
    if (/defaultProps/.test(args[0])) return
    error(...args)
  }

  return (
    <ResponsiveContainer width='100%' height={300}>
      <AreaChart data={data}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          stroke='#888888'
          tickLine={false}
          axisLine={false}
          fontSize={12}
          ticks={[400, 800, 1200, 1600, 2000]}
        />
        <Tooltip />
        <Area
          type='monotone'
          dataKey='rating'
          fill='primary'
          fillOpacity={'0.6'}
          className='fill-primary'
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
