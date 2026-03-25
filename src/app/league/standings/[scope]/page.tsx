import Link from 'next/link'
import {
  compareLeagueTierLabels,
  getCachedLeagueAnalytics,
  getCachedLeagueEventOptions,
} from '@/lib/supabase/cached-queries'
import { LeagueScopeSelect } from '@/components/league-scope-select'
import { WinRateBar } from '@/components/win-rate-bar'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatLeagueBid } from '@/lib/league-format'
import { leaguePlayerProfileHref } from '@/lib/league-links'

export const revalidate = 3600

function buildStandingsQuery(tier: string | null, minGames: number): string {
  const params = new URLSearchParams()
  if (tier) params.set('tier', tier)
  params.set('minGames', String(minGames))
  const q = params.toString()
  return q ? `?${q}` : ''
}

export default async function LeagueStandingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ scope: string }>
  searchParams: Promise<{ tier?: string; minGames?: string }>
}) {
  const { scope } = await params
  const query = await searchParams
  const tierParam = query.tier?.trim() || null
  const minGames = Number(query.minGames ?? '5')
  const effectiveMinGames = Number.isFinite(minGames)
    ? Math.max(1, minGames)
    : 5

  const tierFilterForData = tierParam
  const [analytics, eventOptions] = await Promise.all([
    getCachedLeagueAnalytics(scope, tierFilterForData, effectiveMinGames),
    getCachedLeagueEventOptions(),
  ])

  if (!analytics) {
    return (
      <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-8 border space-y-4'>
        <h2 className='text-2xl font-semibold'>League scope not found</h2>
        <Link
          href='/league'
          className='text-primary hover:underline font-semibold'
        >
          Go to league analytics
        </Link>
      </div>
    )
  }

  const searchSuffix = buildStandingsQuery(tierParam, effectiveMinGames)
  const tierOptions = [...analytics.tiers].sort(compareLeagueTierLabels)
  const minGamesOptions = [3, 5, 8, 12]

  const invalidTier =
    tierParam != null &&
    tierOptions.length > 0 &&
    !tierOptions.includes(tierParam)

  return (
    <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-6 md:p-8 border space-y-8'>
      <header className='space-y-4 border-b pb-6'>
        <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
          <div>
            <Link
              href={`/league/${scope}?minGames=${effectiveMinGames}`}
              className='text-sm text-primary font-medium hover:underline'
            >
              ← Back to analytics
            </Link>
            <h2 className='text-2xl md:text-3xl font-semibold mt-2'>
              League standings
            </h2>
            <p className='text-muted-foreground mt-1 max-w-2xl'>
              {analytics.scopeLabel}
            </p>
            <p className='text-sm text-muted-foreground mt-2'>
              One tier at a time — ranks are not mixed across tiers.
            </p>
            <p className='text-sm pt-2'>
              <Link
                href='/league/standings/all-time'
                className='text-primary font-medium hover:underline'
              >
                All-time standings (all seasons)
              </Link>
            </p>
          </div>
        </div>

        <LeagueScopeSelect
          options={eventOptions}
          currentScope={scope}
          searchSuffix={searchSuffix}
          variant='standings'
        />

        <div className='space-y-2'>
          <span className='text-sm text-muted-foreground font-medium'>
            Tier (required)
          </span>
          <div className='flex flex-wrap items-center gap-2'>
            {tierOptions.map((tier) => (
              <Button
                key={tier}
                size='sm'
                variant={tierParam === tier ? 'default' : 'outline'}
                asChild
              >
                <Link
                  href={`/league/standings/${scope}${buildStandingsQuery(tier, effectiveMinGames)}`}
                >
                  {tier.toUpperCase()}
                </Link>
              </Button>
            ))}
            {tierOptions.length === 0 && (
              <span className='text-sm text-muted-foreground'>
                No tier tags found in game names.
              </span>
            )}
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground mr-1'>Min games:</span>
          {minGamesOptions.map((option) => (
            <Button
              key={option}
              size='sm'
              variant={effectiveMinGames === option ? 'default' : 'outline'}
              asChild
            >
              <Link
                href={`/league/standings/${scope}${buildStandingsQuery(tierParam, option)}`}
              >
                {option}
              </Link>
            </Button>
          ))}
        </div>
      </header>

      {!tierParam && (
        <p className='text-sm text-muted-foreground'>
          Select a tier above to load the standings table for that tier only.
        </p>
      )}

      {invalidTier && (
        <p className='text-sm text-destructive'>
          Unknown tier &quot;{tierParam}&quot;. Pick a tier from the list.
        </p>
      )}

      {tierParam && !invalidTier && (
        <section className='space-y-3'>
          <h3 className='text-xl font-semibold'>
            Standings · <span className='text-primary'>{tierParam}</span>
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='text-primary'>Rank</TableHead>
                <TableHead className='text-primary'>Player</TableHead>
                <TableHead className='text-primary'>W-L</TableHead>
                <TableHead className='text-primary'>Win%</TableHead>
                <TableHead className='text-primary'>Games</TableHead>
                <TableHead className='text-primary'>Seasons</TableHead>
                <TableHead className='text-primary'>Avg score Δ</TableHead>
                <TableHead className='text-primary'>Avg bid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.standings.map((row, index) => (
                <TableRow key={row.playerId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Link
                      href={leaguePlayerProfileHref(row.username)}
                      className='text-primary font-medium hover:underline'
                    >
                      {row.username}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {row.wins}-{row.losses}
                  </TableCell>
                  <TableCell>
                    <WinRateBar rate={row.winRate} />
                  </TableCell>
                  <TableCell className='tabular-nums'>{row.games}</TableCell>
                  <TableCell className='tabular-nums'>
                    {row.seasonsPlayed}
                  </TableCell>
                  <TableCell>{row.avgScoreDiff.toFixed(2)}</TableCell>
                  <TableCell>{formatLeagueBid(row.avgBid)}</TableCell>
                </TableRow>
              ))}
              {analytics.standings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className='text-muted-foreground'>
                    No players meet the min games threshold in this tier.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  )
}
