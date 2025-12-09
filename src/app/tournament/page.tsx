import { getAllTournamentsWithDetails } from '@/lib/tournaments'
import TournamentTable from '@/components/tournament-table'
import { revalidate as REVALIDATE } from '@/lib/cache-config'

// Next.js requires each route segment to export its own `revalidate` constant.
// We import the shared value and assign it to a local constant so Next.js can statically analyze it.
export const revalidate = REVALIDATE

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

  return <TournamentTable tournaments={tournaments} lastUpdated={lastUpdated} />
}
