import {
  getCachedPlayer,
  getCachedPlayerNemesis,
} from '@/lib/supabase/cached-queries'
import Link from 'next/link'
import { removeYearFromEventName, getNumericDate } from '@/lib/utils'
import { Chart } from '@/components/chart'
import { RivalsBarChart } from '@/components/rivals-bar-chart'
import { sortByEventDateDescending, getMostRecentEvent } from '@/lib/events'
import EventLink from '@/components/event-link'
import { KpiCard } from '@/components/kpi-card'
import { Button } from '@/components/ui/button'

// Revalidate every hour
export const revalidate = 3600

export default async function PlayerProfile({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username: usernameParam } = await params
  const decodedUsername = decodeURIComponent(usernameParam)
  const data = await getCachedPlayer(decodedUsername)

  if (!data) {
    return (
      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold'>Player not found</h2>
        <Link
          href='/leaderboard'
          className='text-primary hover:underline font-semibold mt-4 inline-block'
        >
          Back to leaderboard
        </Link>
      </div>
    )
  }

  const {
    id: playerId,
    ordinal: current_rating,
    event_participation,
    username,
  } = data
  const nemeses = await getCachedPlayerNemesis(playerId)
  const wins = event_participation.reduce(
    (acc: number, event: { games_won: number | null }) => {
      return acc + (event.games_won ?? 0)
    },
    0,
  )

  const isOrdinal = (value: any): value is number => {
    return typeof value === 'number'
  }

  // Find most recent event (newest first)
  const mostRecentEvent = getMostRecentEvent(event_participation) as
    | (typeof event_participation)[0]['event']
    | null

  // Sort events by date (newest first) for display
  const sortedEvents = sortByEventDateDescending(event_participation)

  // Helper to check if event contributes to rating
  const isRatingEvent = (entry: (typeof event_participation)[0]) => {
    const event = entry.event
    if (!event) return false
    // Rating events are those with rating_event=true AND num_players_per_game > 2 (3 or 4 players)
    return event.rating_event === true && (event.num_players_per_game ?? 0) > 2
  }

  const chartData = event_participation
    .filter((entry: (typeof event_participation)[0]) => isRatingEvent(entry))
    .map((entry: (typeof event_participation)[0], index: number) => {
      const startDate = entry.event?.start_date
      // start_date is string | null from the database, getNumericDate handles null
      const formattedDate = startDate ? getNumericDate(startDate) : 'unknown'
      const timestamp = startDate ? new Date(startDate).getTime() : 0
      return {
        // Use index as unique identifier to prevent overlapping data points
        id: index,
        name: removeYearFromEventName(entry.event?.name ?? null),
        fullName: entry.event?.name ?? '',
        date: formattedDate,
        timestamp,
        rating: isOrdinal(entry.ordinal) ? Math.round(entry.ordinal) : 1200,
      }
    })

  return (
    <div className='space-y-8'>
      <div className='space-y-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>
            {username}
          </h1>
          <Button variant='outline' size='sm' asChild className='shrink-0'>
            <Link href='/leaderboard'>Back to leaderboard</Link>
          </Button>
        </div>

        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          <KpiCard
            label='Current rating'
            value={String(Math.round(current_rating as number))}
          />
          <KpiCard label='Games won' value={String(wins)} />
          <KpiCard
            label='Tournaments played'
            value={String(event_participation.length)}
          />
          {mostRecentEvent && (
            <KpiCard
              label='Most recent event'
              value={
                <EventLink
                  eventId={mostRecentEvent.id}
                  eventName={mostRecentEvent.name}
                  className='hover:underline cursor-pointer'
                />
              }
              valueClassName='mt-1 text-lg font-semibold leading-snug'
            />
          )}
        </div>
      </div>

      {chartData.length > 1 && (
        <section className='space-y-4'>
          <h2 className='text-xl font-semibold'>Tournament Rating by Event</h2>
          <Chart data={chartData} />
          <p className='text-sm text-muted-foreground max-w-3xl'>
            * Tournament Rating is calculated from three & four player events.
            Two player events, while still official tournament events, are not a
            part of the rating system at this time.
          </p>
        </section>
      )}

      {nemeses && nemeses.length > 0 && (
        <section className='space-y-3'>
          <h2 className='text-xl font-semibold'>Rivals</h2>
          <RivalsBarChart rivals={nemeses} />
        </section>
      )}

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Event History</h2>
        <div className='rounded-lg border bg-card/50 p-4 shadow-sm'>
          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-1 text-sm'>
            {sortedEvents.map((entry) => {
              const eventName = entry.event?.name
              const eventId = entry.event?.id
              if (!eventName || !eventId) return null
              const isRating = isRatingEvent(entry)
              return (
                <div key={eventId} className='max-w-[260px] min-w-0 w-full'>
                  <EventLink
                    eventId={eventId}
                    eventName={eventName}
                    className='text-primary hover:underline break-words'
                  >
                    {removeYearFromEventName(eventName)}
                    {!isRating && ' *'}
                  </EventLink>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
