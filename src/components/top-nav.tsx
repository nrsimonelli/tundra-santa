import Link from 'next/link'
import { FactionThemePicker } from '@/components/faction-theme-picker'

export const TopNav = () => {
  return (
    <div className='top-3 z-10 left-0 w-full absolute'>
      <div className='flex justify-between items-center max-w-5xl h-16 px-6 mx-auto text-[hsl(var(--hero-foreground))]'>
        <FactionThemePicker />
        <div className='inline-flex space-x-4'>
          <Link
            className='hover:opacity-90'
            href={'/about'}
            prefetch={true}
          >
            About
          </Link>
          <Link
            className='hover:opacity-90'
            href={'/league'}
            prefetch={true}
          >
            1v1 League
          </Link>
          <Link
            className='hover:opacity-90'
            href={'/tournament'}
            prefetch={true}
          >
            Tournaments
          </Link>
          <Link
            className='hover:opacity-90'
            href={'/leaderboard'}
            prefetch={true}
          >
            Leaderboard
          </Link>
          {/* <p>discord?</p> */}
        </div>
      </div>
    </div>
  )
}
