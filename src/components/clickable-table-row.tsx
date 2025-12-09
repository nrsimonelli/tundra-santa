'use client'

import { useRouter } from 'next/navigation'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface ClickableTableRowProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function ClickableTableRow({
  href,
  children,
  className,
}: ClickableTableRowProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(href)
  }

  return (
    <TableRow onClick={handleClick} className={cn('cursor-pointer', className)}>
      {children}
    </TableRow>
  )
}
