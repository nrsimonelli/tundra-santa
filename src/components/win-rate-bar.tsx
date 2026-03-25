export function WinRateBar({ rate }: { rate: number }) {
  const pct = rate * 100
  const width = Math.min(100, Math.max(0, pct))
  return (
    <div className='flex items-center gap-2 min-w-[128px] max-w-[200px]'>
      <div className='h-2 flex-1 rounded-full bg-muted overflow-hidden'>
        <div
          className='h-full rounded-full bg-primary/70'
          style={{ width: `${width}%` }}
        />
      </div>
      <span className='tabular-nums text-xs text-muted-foreground w-11 shrink-0'>
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}
