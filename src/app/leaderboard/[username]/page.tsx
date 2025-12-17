import {
  getCachedPlayer,
  getCachedPlayerNemesis,
} from '@/lib/supabase/cached-queries'
import Link from 'next/link'
import { removeYearFromEventName, getNumericDate } from '@/lib/utils'
import { Chart } from '@/components/chart'
import { sortByEventDate, getMostRecentEvent } from '@/lib/events'
import EventLink from '@/components/event-link'

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
    return <div>Player not found</div>
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
    0
  )

  const isOrdinal = (value: any): value is number => {
    return typeof value === 'number'
  }

  // Find most recent event (newest first)
  const mostRecentEvent = getMostRecentEvent(event_participation) as
    | (typeof event_participation)[0]['event']
    | null

  // Sort events by date (oldest first) for display
  const sortedEvents = sortByEventDate(event_participation)

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
    <div className='flex flex-col items-start md:flex-row justify-start flex-wrap gap-8'>
      <div className='inline-flex text-3xl font-semibold space-x-2 w-full justify-start'>
        <p>Player profile:</p>
        <p className='text-transparent bg-clip-text bg-gradient-to-tr to-[#0acffe] from-[#495aff] select-none'>
          {username}
        </p>
      </div>
      <div className='contents md:flex md:flex-col md:gap-4 md:max-w-[300px] md:w-full md:order-1'>
        <div className='max-w-[300px] w-full space-y-2 order-1 md:order-none'>
          <p className='text-2xl text-foreground font-semibold'>Stats</p>
          <div className='space-y-1'>
            <p className=''>Rating: {Math.round(current_rating as number)}</p>
            <p className=''>Wins: {wins}</p>
            <p className=''>Tournaments: {event_participation.length}</p>
            {mostRecentEvent && (
              <p className=''>
                Last event:{' '}
                <EventLink
                  eventId={mostRecentEvent.id}
                  eventName={mostRecentEvent.name}
                  className='hover:underline cursor-pointer'
                />
              </p>
            )}
          </div>
        </div>

        {nemeses && nemeses.length > 0 && (
          <div className='max-w-[300px] w-full space-y-2 order-2 md:order-none'>
            <div className='flex justify-between items-baseline'>
              <p className='font-semibold text-2xl text-foreground'>Rivals</p>
              <p className='text-muted-foreground text-xs'>W / L / D</p>
            </div>
            <div className='space-y-1'>
              {nemeses.map((n) => (
                <div key={n.playerId} className='flex justify-between'>
                  <Link
                    href={`/leaderboard/${encodeURIComponent(n.username)}`}
                    className='hover:underline cursor-pointer text-primary'
                  >
                    {n.username}
                  </Link>
                  <span className='text-muted-foreground text-sm tabular-nums'>
                    {n.wins} / {n.losses} / {n.draws}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='max-w-[300px] w-full space-y-2 order-3 md:order-none'>
          <p className='font-semibold text-2xl text-foreground'>
            Event History
          </p>
          <div className='space-y-1'>
            {sortedEvents.map((entry) => {
              const eventName = entry.event?.name
              const eventId = entry.event?.id
              if (!eventName || !eventId) return null
              const isRating = isRatingEvent(entry)
              return (
                <p key={eventId}>
                  <EventLink
                    eventId={eventId}
                    eventName={eventName}
                    className='hover:underline cursor-pointer'
                  >
                    {removeYearFromEventName(eventName)}
                    {!isRating && ' *'}
                  </EventLink>
                </p>
              )
            })}
          </div>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className='flex flex-col space-y-4 min-w-[300px] w-full flex-1 order-2 md:order-2'>
          <p className='text-2xl font-semibold text-foreground md:text-center'>
            Tournament Rating by Event
          </p>
          <Chart data={chartData} />
          <Link
            className='py-2 font-semibold text-primary md:mx-auto'
            href='/leaderboard'
          >
            Back to leaderboard
          </Link>
          <p className='text-sm text-muted-foreground text-left max-w-md md:text-center md:mx-auto'>
            * Tournament Rating is calculated from three & four player events.
            Two player events, while still official tournament events, are not a
            part of the rating system at this time.
          </p>
        </div>
      )}
    </div>
  )
}
