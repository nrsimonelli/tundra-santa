import { createClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { removeYearFromEventName } from '@/lib/utils'

const Chart = dynamic(() => import('../../../components/chart'), {
  ssr: false,
})

export default async function PlayerProfile({
  params,
}: {
  params: { username: string }
}) {
  const supabase = createClient()

  const { data } = await supabase
    .from('players')
    .select(
      `
    id, 
    username,
    current_rating->ordinal,
    event_participation (
      event: events(id, name, start_date, rating_event, num_players_per_game),
      games_won,
      updated_rating->ordinal
    )
    `
    )
    .eq('username', decodeURIComponent(params.username))

  if (!data || data[0] === null) {
    return <div>Player not found</div>
  }

  const { ordinal: current_rating, event_participation, username } = data[0]
  const wins = event_participation.reduce((acc, event) => {
    return acc + (event.games_won ?? 0)
  }, 0)

  const isOrdinal = (value: any): value is number => {
    return typeof value === 'number'
  }

  // Find most recent event (newest first)
  const mostRecentEvent = [...event_participation].sort((a, b) => {
    const dateA = a.event?.start_date
      ? new Date(a.event.start_date).getTime()
      : 0
    const dateB = b.event?.start_date
      ? new Date(b.event.start_date).getTime()
      : 0
    return dateB - dateA
  })[0]?.event

  // Sort events by date (oldest first) for display
  const sortedEvents = [...event_participation].sort((a, b) => {
    const dateA = a.event?.start_date
      ? new Date(a.event.start_date).getTime()
      : 0
    const dateB = b.event?.start_date
      ? new Date(b.event.start_date).getTime()
      : 0
    return dateA - dateB
  })

  // Helper to check if event contributes to rating
  const isRatingEvent = (entry: (typeof event_participation)[0]) => {
    const event = entry.event
    if (!event) return false
    // Rating events are those with rating_event=true AND num_players_per_game > 2 (3 or 4 players)
    return event.rating_event === true && (event.num_players_per_game ?? 0) > 2
  }

  const chartData = event_participation
    .filter((entry) => isRatingEvent(entry))
    .map((entry) => {
      return {
        name: removeYearFromEventName(entry.event?.name ?? null),
        date: entry.event?.start_date?.toLocaleString() ?? 'unknown',
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
            <p className=''>
              Current rating: {Math.round(current_rating as number)}
            </p>
            <p className=''>Game wins: {wins}</p>
            {mostRecentEvent && (
              <p className=''>
                Most recent event:{' '}
                <Link
                  href={`/tournament/${mostRecentEvent.id}`}
                  className='hover:underline cursor-pointer'
                >
                  {removeYearFromEventName(mostRecentEvent.name)}
                </Link>
              </p>
            )}
          </div>
        </div>

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
                  <Link
                    href={`/tournament/${eventId}`}
                    className='hover:underline cursor-pointer'
                  >
                    {removeYearFromEventName(eventName)}
                    {!isRating && ' *'}
                  </Link>
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
