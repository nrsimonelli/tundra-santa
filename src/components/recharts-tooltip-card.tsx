import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  className?: string
}

/** Recharts tooltip shell aligned with popover / border tokens (not default white box). */
export function RechartsTooltipCard({ children, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-popover px-2.5 py-1.5 text-sm text-popover-foreground shadow-md',
        className,
      )}
    >
      {children}
    </div>
  )
}
