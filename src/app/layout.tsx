import type { Metadata, Viewport } from 'next'
import { Inter as FontSans } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { cn } from '@/lib/utils'
import { TopNav } from '@/components/top-nav'
import { FactionThemeProvider } from '@/components/faction-theme-provider'
import {
  FACTION_THEME_COOKIE_NAME,
  resolveFactionThemeId,
} from '@/lib/faction-ui-theme'

const fontSans = FontSans({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Scythe Tournament Rating',
  description: 'The official tournament rating system for competitive Scythe.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const factionThemeId = resolveFactionThemeId(
    cookieStore.get(FACTION_THEME_COOKIE_NAME)?.value,
  )

  return (
    <html lang='en' data-faction={factionThemeId}>
      <body
        className={cn(
          'min-h-screen bg-background text-foreground font-sans antialiased',
          fontSans.variable,
        )}
      >
        <FactionThemeProvider initialFactionThemeId={factionThemeId}>
          <TopNav />
          <div className='site-hero text-[hsl(var(--hero-foreground))] bg-gradient-to-tr from-[var(--hero-gradient-from,var(--gradient-from))] to-[var(--hero-gradient-to,var(--gradient-to))] flex justify-center min-h-[300px] sm:min-h-[450px]'>
            <div className='flex flex-col items-start justify-center max-w-5xl w-full px-4 sm:px-6 pt-20 pb-6 sm:pb-8 space-y-2'>
              <h1 className='text-3xl sm:text-4xl lg:text-6xl font-bold'>
                Scythe Tournament Rating
              </h1>
              <p className='text-lg hidden sm:block'>
                The official tournament rating system for competitive Scythe.
              </p>
            </div>
          </div>

          {children}
          {/* TODO build and enable footer content */}
          {/* <Footer /> */}
        </FactionThemeProvider>
      </body>
    </html>
  )
}
