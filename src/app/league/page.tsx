import { redirect } from 'next/navigation'
import { getCachedLeagueEventOptions } from '@/lib/supabase/cached-queries'
import { leagueLatestSeasonEventId } from '@/lib/league-seasons'

export const revalidate = 3600

export default async function LeaguePage() {
  const options = await getCachedLeagueEventOptions()

  if (options.length === 0) {
    return (
      <div className='max-w-5xl w-full min-w-0 mx-auto shadow-lg -mt-20 z-10 bg-card rounded-md px-4 py-8 sm:px-6 border'>
        <h2 className='text-2xl font-semibold mb-2'>League</h2>
        <p className='text-muted-foreground'>
          Data unavailable. Please refresh the page or try again later.
        </p>
      </div>
    )
  }

  const latestId = leagueLatestSeasonEventId(options)
  if (latestId == null) {
    return (
      <div className='max-w-5xl w-full min-w-0 mx-auto shadow-lg -mt-20 z-10 bg-card rounded-md px-4 py-8 sm:px-6 border'>
        <h2 className='text-2xl font-semibold mb-2'>League</h2>
        <p className='text-muted-foreground'>
          Data unavailable. Please refresh the page or try again later.
        </p>
      </div>
    )
  }

  redirect(`/league/${latestId}`)
}
