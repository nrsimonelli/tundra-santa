import Image from 'next/image'
import Link from 'next/link'
import { CirclePercent } from 'lucide-react'

export const TopNav = () => {
  return (
    <div className='top-3 z-10 left-0 w-full border-slate-900 border-2 absolute'>
      <div className='flex justify-between items-center max-w-5xl h-16 mx-auto'>
        <Link href={'/'}>
          <CirclePercent className='text-background h-8 w-8' />
        </Link>
        <div className='inline-flex space-x-4'>
          <Link href={'/leaderboard'}>leaderboard</Link>
          <p>about</p>
          <p>link</p>
        </div>
      </div>
    </div>
  )
}
