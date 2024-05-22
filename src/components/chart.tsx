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
        <defs>
          <linearGradient id='gradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#495aff' stopOpacity={0.8} />
            <stop offset='95%' stopColor='#0acffe' stopOpacity={0} />
          </linearGradient>
        </defs>
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
          domain={[
            (dataMin: number) => (dataMin < 1200 ? dataMin - 100 : 1200),
            (dataMax: number) => (dataMax > 2000 ? dataMax + 100 : 2000),
          ]}
        />
        <Tooltip />
        <Area
          type='monotone'
          dataKey='rating'
          fill='url(#gradient)'
          fillOpacity={'1'}
          className='fill-primary'
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
