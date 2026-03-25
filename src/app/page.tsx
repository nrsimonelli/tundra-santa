import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LandingMechsDynamic } from '@/components/landing-mechs-dynamic'

// This page is completely static - no data fetching
export const dynamic = 'force-static'

export default function Home() {
  return (
    <div className='flex flex-col items-center w-full min-w-0'>
      <LandingMechsDynamic />
      <div className='flex gap-4 flex-col sm:flex-row items-center justify-center py-8 sm:py-16 md:py-24 px-4 w-full max-w-5xl'>
        <a
          className='pointer-events-auto text-primary font-semibold'
          href='https://discord.gg/HRvysu2QT2'
          target='_blank'
          rel='noopener noreferrer'
        >
          Join the discord
        </a>
        <Link href='/leaderboard'>
          <Button>View the leaderboard</Button>
        </Link>
      </div>
    </div>
  )
}
