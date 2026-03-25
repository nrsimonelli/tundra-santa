import { HashSmoothScroller } from '@/components/hash-smooth-scroller'

export default function TournamentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className='max-w-5xl w-full min-w-0 mx-auto shadow-lg -mt-20 z-10 bg-card rounded-md px-4 py-6 sm:px-6'>
      <HashSmoothScroller />
      {children}
    </div>
  )
}
