'use client'

import {
  ResponsiveContainer,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

type ChartDataPoint = {
  id: number
  name: string
  fullName: string
  date: string
  rating: number
}

type TooltipPayload = {
  payload: ChartDataPoint
  value: number
  name: string
}

type TooltipProps = {
  active?: boolean
  payload?: TooltipPayload[]
}

export function Chart({ data }: { data: ChartDataPoint[] }) {
  // override console.error
  // this is a hack to suppress the warning about missing defaultProps in recharts as of version 2.12
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && /defaultProps/.test(args[0])) return
    originalError(...args)
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length > 0) {
      const dataPoint = payload[0].payload
      return (
        <div className='bg-background border border-border rounded-md p-2 shadow-md'>
          <p className='font-semibold'>
            {dataPoint.fullName || dataPoint.name}
          </p>
          <p className='text-sm text-muted-foreground'>
            Rating: {dataPoint.rating}
          </p>
          <p className='text-sm text-muted-foreground'>{dataPoint.date}</p>
        </div>
      )
    }
    return null
  }

  // Create a formatter function that uses the data array
  const formatTick = (value: number) => {
    const dataPoint = data[value]
    return dataPoint?.name || ''
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
          dataKey='id'
          stroke='#888888'
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={formatTick}
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
        <Tooltip content={<CustomTooltip />} />
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
