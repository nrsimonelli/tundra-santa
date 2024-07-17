import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'
import Link from 'next/link'

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
      event: events(id, name, start_date, rating_event),
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

  const chartData = event_participation
    .filter((entry) => entry.event?.rating_event)
    .map((entry) => {
      return {
        name: entry.event?.name ?? 'unknown',
        date: entry.event?.start_date?.toLocaleString() ?? 'unknown',
        rating: isOrdinal(entry.ordinal) ? Math.round(entry.ordinal) : 1200,
      }
    })

  return (
    <div className='flex space-y-8 flex-col items-start md:flex-row justify-start flex-wrap'>
      <div className='inline-flex text-3xl font-semibold w-full justify-start md:justify-center'>
        {/* <p>Player profile:</p> */}
        <p className='text-transparent bg-clip-text bg-gradient-to-tr to-[#0acffe] from-[#495aff] select-none'>
          {username}
        </p>
      </div>
      <div className='flex-col flex space-y-4'>
        <div className='max-w-[300px] w-full space-y-2'>
          <p className='text-2xl text-foreground font-semibold'>Stats</p>
          <div>
            <p className=''>
              Current rating: {Math.round(current_rating as number)}
            </p>
            <p className=''>Game wins: {wins}</p>
          </div>
        </div>

        <div className='max-w-[300px] w-full'>
          <div className='space-y-2'>
            <p className='font-semibold text-2xl text-foreground'>
              Event History
            </p>
            <div>
              {event_participation.map((entry) => {
                return <p key={entry.event?.id}>{entry.event?.name}</p>
              })}
            </div>
          </div>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className='flex-col space-y-4 min-w-[300px] w-full flex flex-1'>
          <p className='md:mx-auto mx-0 text-2xl font-semibold text-foreground'>
            Tournament Rating by Event
          </p>
          <Chart data={chartData} />
          <Link
            className='mx-auto py-2 font-semibold text-primary'
            href='/leaderboard'
          >
            Back to leaderboard
          </Link>
        </div>
      )}
    </div>
  )
}
