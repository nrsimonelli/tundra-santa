import Link from 'next/link'
import { getCachedLeaguePlayerProfile } from '@/lib/supabase/cached-queries'
import { LeagueFactionsYouPlayedSection } from '@/components/league-factions-you-played-section'
import { LeaguePlayerGamesTabs } from '@/components/league-player-games-tabs'
import { WinRateBar } from '@/components/win-rate-bar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatLeagueBid } from '@/lib/league-format'
import { globalLeaderboardHref } from '@/lib/league-links'

export const revalidate = 3600

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className='rounded-lg border bg-card/50 p-4 shadow-sm'>
      <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
        {label}
      </p>
      <p className='mt-1 text-2xl font-semibold tabular-nums tracking-tight'>
        {value}
      </p>
      {hint && (
        <p className='mt-1 text-[11px] text-muted-foreground leading-snug'>
          {hint}
        </p>
      )}
    </div>
  )
}

export default async function LeaguePlayerPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username: usernameParam } = await params
  const username = decodeURIComponent(usernameParam)
  const profile = await getCachedLeaguePlayerProfile(username)

  if (!profile) {
    return (
      <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-8 border'>
        <h2 className='text-2xl font-semibold'>Player not found</h2>
        <Link
          href='/league'
          className='text-primary hover:underline font-semibold mt-4 inline-block'
        >
          League analytics
        </Link>
      </div>
    )
  }

  const bidHintParts: string[] = [
    'Average treats missing bids as 0.',
    ...(profile.gamesWithBidRecorded > 0
      ? [
          `${profile.gamesWithBidRecorded} of ${profile.games} games have a bid recorded.`,
        ]
      : []),
  ]
  const bidHint = bidHintParts.join(' ')

  return (
    <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-6 md:p-8 border space-y-8'>
      <div className='space-y-4'>
        <Link
          href='/league'
          className='text-sm text-primary font-medium hover:underline'
        >
          ← League analytics
        </Link>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>
              {profile.username}
            </h1>
            <p className='text-muted-foreground text-sm mt-1'>
              1v1 league profile
            </p>
          </div>
          <Button variant='outline' size='sm' asChild className='shrink-0'>
            <Link href={globalLeaderboardHref(profile.username)}>
              Global player profile
            </Link>
          </Button>
        </div>

        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          <KpiCard label='Record' value={`${profile.wins}-${profile.losses}`} />
          <KpiCard
            label='Win rate'
            value={`${(profile.winRate * 100).toFixed(1)}%`}
          />
          <KpiCard label='Games' value={String(profile.games)} />
          <KpiCard
            label='Avg bid (yours)'
            value={formatLeagueBid(profile.avgMyBid)}
            hint={bidHint}
          />
        </div>
      </div>

      {profile.seasonRows.length > 0 && (
        <section className='space-y-3'>
          <h2 className='text-xl font-semibold'>By season</h2>
          <p className='text-sm text-muted-foreground max-w-3xl'>
            Seasons are numbered <strong>S1…Sn</strong> with{' '}
            <strong>S1 oldest</strong>. <strong>Tier</strong> is the tag from
            game names you played most that season. <strong>Rank</strong> is
            your standing in that season for that tier (sorted like league
            standings: win rate, then wins), among everyone with at least one
            game in that tier.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='text-primary'>Season</TableHead>
                <TableHead className='text-primary'>Tier</TableHead>
                <TableHead className='text-primary'>Rank</TableHead>
                <TableHead className='text-primary'>W-L</TableHead>
                <TableHead className='text-primary'>Win%</TableHead>
                <TableHead className='text-primary'>Games</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.seasonRows.map((row) => (
                <TableRow key={row.seasonIndex}>
                  <TableCell>
                    <span className='rounded-md border px-2 py-0.5 text-xs font-semibold bg-muted/40'>
                      S{row.seasonIndex}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className='text-xs rounded border px-1.5 py-0.5 bg-background'>
                      {row.primaryTier}
                    </span>
                  </TableCell>
                  <TableCell className='tabular-nums text-sm'>
                    {row.rankInTier != null ? <>{row.rankInTier}</> : '—'}
                  </TableCell>
                  <TableCell className='tabular-nums'>
                    {row.wins}-{row.losses}
                  </TableCell>
                  <TableCell>
                    <WinRateBar rate={row.winRate} />
                  </TableCell>
                  <TableCell className='tabular-nums'>{row.games}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      <LeagueFactionsYouPlayedSection
        factionByPlay={profile.factionByPlay}
        gamesPlayed={profile.gamesPlayed}
      />

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>League games</h2>
        <LeaguePlayerGamesTabs games={profile.gamesPlayed} />
      </section>
    </div>
  )
}
