'use client'

import Link from 'next/link'
import { getFormattedDate, getNumericDate, cn } from '@/lib/utils'
import EventLink from '@/components/event-link'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Crown, User, Swords } from 'lucide-react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import type { TournamentWithDetails } from '@/lib/tournaments'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface TournamentTableProps {
  tournaments: TournamentWithDetails[]
  lastUpdated: string | null
}

export default function TournamentTable({
  tournaments,
  lastUpdated,
}: TournamentTableProps) {
  const [showCrowns, setShowCrowns] = useLocalStorage<boolean>(
    'tournament-show-crowns',
    false
  )

  return (
    <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-6'>
      <Table>
        <TableCaption>
          {lastUpdated
            ? `Updated: ${getFormattedDate(lastUpdated)}`
            : 'A list of all tournaments in the database.'}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className='text-primary w-[260px] max-w-[260px]'>
              Tournament
            </TableHead>
            <TableHead className='text-primary w-fit'>Date</TableHead>
            <TableHead className='text-primary w-auto'>Details</TableHead>
            <TableHead className='text-primary w-[420px] max-w-[420px]'>
              <div className='flex items-center justify-between'>
                <span>Finalists</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Crown
                        className={cn(
                          'h-4 w-4 cursor-pointer transition-colors',
                          showCrowns ? 'text-primary' : 'text-black'
                        )}
                        onClick={() => setShowCrowns(!showCrowns)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to reveal tournament champions</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournaments.map((tournament) => (
            <TableRow key={tournament.id}>
              <TableCell className='w-[260px] max-w-[260px] min-w-0'>
                <div className='max-w-[260px]'>
                  <EventLink
                    eventId={tournament.id}
                    eventName={tournament.name}
                  />
                </div>
              </TableCell>
              <TableCell className='w-fit'>
                {getNumericDate(tournament.start_date) || '—'}
              </TableCell>
              <TableCell className='w-auto'>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-1.5'>
                    <User className='h-4 w-4 text-muted-foreground' />
                    <span>{tournament.player_count}</span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <Swords className='h-4 w-4 text-muted-foreground' />
                    <span>{tournament.games_count}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className='w-[420px] max-w-[420px] min-w-0'>
                <div className='max-w-[420px]'>
                  {tournament.finalists.length > 0 ? (
                    // For other tournaments, show all unique finalists with crown on winner
                    <div className='flex flex-wrap gap-x-2 gap-y-1 items-center'>
                      {tournament.finalists.map((finalist, index) => {
                        const isWinner = tournament.winner === finalist.id
                        return (
                          <span
                            key={finalist.id}
                            className={cn(
                              'inline-flex items-center transition-all duration-300 ease-in-out',
                              isWinner && showCrowns && 'gap-1'
                            )}
                          >
                            {isWinner && (
                              <span
                                className={cn(
                                  'inline-flex items-center justify-center flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden',
                                  showCrowns ? 'w-3 h-3' : 'w-0'
                                )}
                              >
                                <Crown
                                  className={cn(
                                    'h-3 w-3 text-primary transition-all duration-300 ease-in-out',
                                    showCrowns
                                      ? 'opacity-100 scale-100'
                                      : 'opacity-0 scale-0'
                                  )}
                                />
                              </span>
                            )}
                            <Link
                              href={`/leaderboard/${encodeURIComponent(
                                finalist.username
                              )}`}
                              className='transition-all duration-300 ease-in-out'
                            >
                              {finalist.username}
                            </Link>
                            {index < tournament.finalists.length - 1 && (
                              <span className='text-muted-foreground mx-1'>
                                •
                              </span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  ) : tournament.winner_name ? (
                    // Fallback to winner if no finalists found
                    <span
                      className={cn(
                        'inline-flex items-center transition-all duration-300 ease-in-out',
                        showCrowns && 'gap-1'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex items-center justify-center flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden',
                          showCrowns ? 'w-3 h-3' : 'w-0'
                        )}
                      >
                        <Crown
                          className={cn(
                            'h-3 w-3 text-primary transition-all duration-300 ease-in-out',
                            showCrowns
                              ? 'opacity-100 scale-100'
                              : 'opacity-0 scale-0'
                          )}
                        />
                      </span>
                      <Link
                        href={`/leaderboard/${encodeURIComponent(
                          tournament.winner_name
                        )}`}
                        className='transition-all duration-300 ease-in-out'
                      >
                        {tournament.winner_name}
                      </Link>
                    </span>
                  ) : (
                    '—'
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
