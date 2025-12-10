import { getAllTournamentsWithDetails } from '@/lib/tournaments'
import TournamentTable from '@/components/tournament-table'

// Revalidate every hour
export const revalidate = 3600

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
