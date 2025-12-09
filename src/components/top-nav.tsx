import Link from 'next/link'
import { CirclePercent } from 'lucide-react'

export const TopNav = () => {
  return (
    <div className='top-3 z-10 left-0 w-full absolute'>
      <div className='flex justify-between items-center max-w-5xl h-16 px-6 mx-auto text-background'>
        <Link href={'/'} prefetch={true}>
          <CirclePercent className='text-background h-8 w-8' />
        </Link>
        <div className='inline-flex space-x-4'>
          <Link href={'/about'} prefetch={true}>
            About
          </Link>
          <Link href={'/tournament'} prefetch={true}>
            Tournaments
          </Link>
          <Link href={'/leaderboard'} prefetch={true}>
            Leaderboard
          </Link>
          {/* <p>discord?</p> */}
        </div>
      </div>
    </div>
  )
}
