import { Button } from '@/components/ui/button'
import Link from 'next/link'

// This page is completely static - no data fetching
export const dynamic = 'force-static'

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
