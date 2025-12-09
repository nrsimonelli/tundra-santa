'use client'

import React, { useEffect } from 'react'
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

  // Prefetch the route for better performance
  useEffect(() => {
    router.prefetch(href)
  }, [href, router])

  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    // Allow clicking on links/buttons inside the row
    const target = e.target as HTMLElement
    if (target.closest('a, button')) {
      return
    }
    router.push(href)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(href)
    }
  }

  return (
    <TableRow
      className={cn('cursor-pointer group relative', className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`Navigate to ${href}`}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === TableCell) {
          const cellChild = child as React.ReactElement<React.HTMLAttributes<HTMLTableCellElement> & { className?: string }>
          return React.cloneElement(cellChild, {
            className: cn('relative z-10', cellChild.props.className),
          })
        }
        return child
      })}
    </TableRow>
  )
}
