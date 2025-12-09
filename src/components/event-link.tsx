import Link from 'next/link'
import { removeYearFromEventName } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface EventLinkProps {
  eventId: number
  eventName: string | null
  className?: string
  children?: React.ReactNode
}

export default function EventLink({
  eventId,
  eventName,
  className,
  children,
}: EventLinkProps) {
  const displayName = removeYearFromEventName(eventName) || 'Unnamed Tournament'

  return (
    <Link href={`/tournament/${eventId}`} className={className}>
      {children || displayName}
    </Link>
  )
}

