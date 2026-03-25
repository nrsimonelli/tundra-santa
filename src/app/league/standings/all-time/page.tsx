import Link from 'next/link'
import { getCachedLeagueAllTimeStandings } from '@/lib/supabase/cached-queries'
import { WinRateBar } from '@/components/win-rate-bar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { leaguePlayerProfileHref } from '@/lib/league-links'

export const revalidate = 3600

export default async function LeagueAllTimePage() {
  const data = await getCachedLeagueAllTimeStandings()

  if (!data) {
    return (
      <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-8 border'>
        <h2 className='text-2xl font-semibold'>All-time league</h2>
        <p className='text-muted-foreground mt-2'>Could not load league participation data.</p>
        <Link href='/league' className='text-primary font-medium hover:underline mt-4 inline-block'>
          League analytics
        </Link>
      </div>
    )
  }

  return (
    <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-6 md:p-8 border space-y-8'>
      <header className='space-y-4 border-b pb-6'>
        <Link href='/league' className='text-sm text-primary font-medium hover:underline'>
          ← League (latest season)
        </Link>
        <h2 className='text-2xl md:text-3xl font-semibold'>All-time league standings</h2>
        <p className='text-muted-foreground max-w-2xl'>
          {data.scopeLabel}. Ranks compare wins <strong>lexicographically by tier</strong> (more wins
          at T1, then T2, and so on, then Unspecified), then win rate, then total wins. Lower-tier
          wins never rank above higher-tier wins when the higher-tier win counts differ.
        </p>
        <p className='text-sm text-muted-foreground'>
          {data.totalGames} recorded 1v1 games across all seasons · {data.rows.length} players
        </p>
      </header>

      <section className='space-y-3'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='text-primary'>Rank</TableHead>
              <TableHead className='text-primary'>Player</TableHead>
              <TableHead className='text-primary'>W-L</TableHead>
              <TableHead className='text-primary'>Win%</TableHead>
              <TableHead className='text-primary'>Games</TableHead>
              <TableHead className='text-primary'>Seasons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, index) => (
              <TableRow key={row.playerId}>
                <TableCell className='tabular-nums'>{index + 1}</TableCell>
                <TableCell>
                  <Link
                    href={leaguePlayerProfileHref(row.username)}
                    className='text-primary font-medium hover:underline'
                  >
                    {row.username}
                  </Link>
                </TableCell>
                <TableCell className='tabular-nums'>
                  {row.wins}-{row.losses}
                </TableCell>
                <TableCell>
                  <WinRateBar rate={row.winRate} />
                </TableCell>
                <TableCell className='tabular-nums'>{row.games}</TableCell>
                <TableCell className='tabular-nums'>{row.seasonsPlayed}</TableCell>
              </TableRow>
            ))}
            {data.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className='text-muted-foreground'>
                  No players with recorded league games.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}
