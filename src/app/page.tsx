import { Button } from '@/components/ui/button'

import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className='flex gap-4 flex-col sm:flex-row items-center justify-center py-24'>
      <a
        className='pointer-events-auto text-primary font-semibold'
        href='https://discord.gg/HRvysu2QT2'
        target='_blank'
        rel='noopener noreferrer'
      >
        Join the discord
      </a>
      <Link href={'leaderboard'}>
        <Button>View the leaderboard</Button>
      </Link>
    </div>
  )
}
