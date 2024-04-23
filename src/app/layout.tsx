import type { Metadata } from 'next'
import { Inter as FontSans } from 'next/font/google'
import '../styles/globals.css'
import { cn } from '@/lib/utils'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'

const fontSans = FontSans({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Scythe Tournament',
  description: 'The official tournament rating system for competitive Scythe.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body
        className={cn(
          'min-h-screen bg-background text-foreground font-sans antialiased',
          fontSans.variable
        )}
      >
        <TopNav />
        <div className='text-background bg-gradient-to-tr to-[#0acffe] from-[#495aff] flex justify-center min-h-[450px]'>
          <div className='flex flex-col items-start justify-center max-w-5xl w-full px-6 space-y-2'>
            <h1 className='text-4xl lg:text-6xl font-bold'>
              Scythe Tournament Rating
            </h1>
            <p className='text-lg'>
              The official tournament rating system for competitive Scythe.
            </p>
          </div>
        </div>

        {children}
        {/* TODO build and enable footer content */}
        {/* <Footer /> */}
      </body>
    </html>
  )
}
