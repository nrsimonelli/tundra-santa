import type { ReactNode } from 'react'

export function KpiCard({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string
  value: ReactNode
  hint?: string
  /** When set, replaces the default numeric value typography (e.g. long event titles). */
  valueClassName?: string
}) {
  return (
    <div className='rounded-lg border bg-card/50 p-4 shadow-sm'>
      <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
        {label}
      </p>
      <div
        className={
          valueClassName ??
          'mt-1 text-2xl font-semibold tabular-nums tracking-tight'
        }
      >
        {value}
      </div>
      {hint && (
        <p className='mt-1 text-[11px] text-muted-foreground leading-snug'>
          {hint}
        </p>
      )}
    </div>
  )
}
