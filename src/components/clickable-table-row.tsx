'use client'

import React from 'react'
import Link from 'next/link'
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
  return (
    <TableRow className={cn('cursor-pointer group relative', className)}>
      <Link
        href={href}
        prefetch={true}
        className='absolute inset-0 z-0'
        aria-label='Navigate to details'
      />
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === TableCell) {
          return React.cloneElement(child, {
            ...child.props,
            className: cn('relative z-10', child.props.className),
          } as React.HTMLAttributes<HTMLTableCellElement>)
        }
        return child
      })}
    </TableRow>
  )
}
