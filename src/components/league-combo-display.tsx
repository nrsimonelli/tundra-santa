import { FactionImage } from '@/components/faction-image'
import { formatPlayerMatLabel } from '@/lib/league-format'
import { cn } from '@/lib/utils'

export function LeagueComboDisplay({
  faction,
  mat,
  iconSize = 24,
  className,
}: {
  faction: string | null | undefined
  mat: string | null | undefined
  iconSize?: number
  className?: string
}) {
  if (!faction || !mat) {
    return <span className='text-muted-foreground text-sm'>—</span>
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <FactionImage faction={faction} width={iconSize} height={iconSize} />
      <span className='text-sm text-foreground'>{formatPlayerMatLabel(mat)}</span>
    </div>
  )
}
