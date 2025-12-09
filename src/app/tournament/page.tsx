import Link from 'next/link'
import { removeYearFromEventName, getFormattedDate } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAllTournamentsWithDetails } from '@/lib/tournaments'
import { Crown } from 'lucide-react'

export default async function TournamentsPage() {
  const { tournaments, error, lastUpdated } =
    await getAllTournamentsWithDetails()

  if (error) {
    return (
      <div className='text-center py-8'>
        <h2 className='text-2xl font-semibold mb-4'>
          Error loading tournaments
        </h2>
        <p className='text-muted-foreground mb-4'>{error.message}</p>
      </div>
    )
  }

  if (tournaments.length === 0) {
    return (
      <div className='text-center py-8'>
        <h2 className='text-2xl font-semibold mb-4'>No tournaments found</h2>
        <p className='text-muted-foreground'>
          There are no tournaments in the database yet.
        </p>
      </div>
    )
  }

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
            <TableHead className='text-primary'>Tournament</TableHead>
            <TableHead className='text-primary'>Date</TableHead>
            <TableHead className='text-primary'>Participants</TableHead>
            <TableHead className='text-primary'>Finalists</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournaments.map((tournament) => (
            <TableRow key={tournament.id}>
              <TableCell>
                <Link href={`/tournament/${tournament.id}`}>
                  {removeYearFromEventName(tournament.name) ||
                    'Unnamed Tournament'}
                </Link>
              </TableCell>
              <TableCell>
                {getFormattedDate(tournament.start_date) || '—'}
              </TableCell>
              <TableCell>{tournament.player_count}</TableCell>
              <TableCell>
                {tournament.num_players_per_game === 2 ? (
                  // For 2p tournaments, show winner only
                  tournament.winner_name ? (
                    <Link
                      href={`/leaderboard/${encodeURIComponent(
                        tournament.winner_name
                      )}`}
                    >
                      {tournament.winner_name}
                    </Link>
                  ) : (
                    '—'
                  )
                ) : tournament.finalists.length > 0 ? (
                  // For other tournaments, show all unique finalists with crown on winner
                  <div className='flex flex-wrap gap-x-2 gap-y-1 items-center'>
                    {tournament.finalists.map((finalist, index) => {
                      const isWinner = tournament.winner === finalist.id
                      return (
                        <span
                          key={finalist.id}
                          className='inline-flex items-center gap-1'
                        >
                          {isWinner && <Crown className='h-3 w-3' />}
                          <Link
                            href={`/leaderboard/${encodeURIComponent(
                              finalist.username
                            )}`}
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
                  <Link
                    href={`/leaderboard/${encodeURIComponent(
                      tournament.winner_name
                    )}`}
                  >
                    {tournament.winner_name}
                  </Link>
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
