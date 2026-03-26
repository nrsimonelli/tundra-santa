import Link from 'next/link'
import { Suspense } from 'react'
import {
  compareLeagueTierLabels,
  getCachedLeagueAnalytics,
  getCachedLeagueEventOptions,
} from '@/lib/supabase/cached-queries'
import { LeagueMatchupSection } from '@/components/league-matchup-section'
import { LeagueComboUsageSection } from '@/components/league-combo-usage-section'
import { LeagueStandingsTable } from '@/components/league-standings-table'
import { Button } from '@/components/ui/button'
import { leagueSeasonsByStartDateAsc } from '@/lib/league-seasons'

export const revalidate = 3600

const DEFAULT_MIN_GAMES = 3
const DEFAULT_TIER = 'T1'

/** Omitted query params mean defaults: tier T1, minGames 3. Use tier=all for all tiers. */
function buildQueryHref(
  tier: string,
  minGames: number,
  matchup: string | null,
): string {
  const params = new URLSearchParams()
  if (tier === 'all') params.set('tier', 'all')
  else if (tier !== DEFAULT_TIER) params.set('tier', tier)
  if (minGames !== DEFAULT_MIN_GAMES) params.set('minGames', String(minGames))
  if (matchup) params.set('matchup', matchup)
  const q = params.toString()
  return q ? `?${q}` : ''
}

export default async function LeagueScopePage({
  params,
  searchParams,
}: {
  params: Promise<{ scope: string }>
  searchParams: Promise<{ tier?: string; minGames?: string; matchup?: string }>
}) {
  const { scope } = await params
  const query = await searchParams
  const rawTierParam =
    typeof query.tier === 'string' && query.tier.length > 0 ? query.tier : null
  const isAllTier = rawTierParam != null && rawTierParam.toLowerCase() === 'all'
  const effectiveTierFilter: string | null = isAllTier
    ? null
    : rawTierParam != null
      ? rawTierParam
      : DEFAULT_TIER
  const currentTier: string = isAllTier ? 'all' : (rawTierParam ?? DEFAULT_TIER)

  const minGamesParsed = Number(query.minGames ?? String(DEFAULT_MIN_GAMES))
  const effectiveMinGames = Number.isFinite(minGamesParsed)
    ? Math.max(1, minGamesParsed)
    : DEFAULT_MIN_GAMES
  const initialMatchup =
    typeof query.matchup === 'string' && query.matchup.length > 0
      ? query.matchup
      : null

  const [analytics, eventOptions] = await Promise.all([
    getCachedLeagueAnalytics(scope, effectiveTierFilter, effectiveMinGames),
    getCachedLeagueEventOptions(),
  ])

  if (!analytics) {
    return (
      <div className='max-w-5xl w-full min-w-0 mx-auto shadow-lg -mt-20 z-10 bg-card rounded-md px-4 py-8 sm:px-6 border space-y-4'>
        <h2 className='text-2xl font-semibold'>League view not found</h2>
        <p className='text-muted-foreground'>
          This season or scope is unavailable. Start from the latest season and
          use the Season filters to switch views.
        </p>
        <Link
          href='/league'
          className='text-primary hover:underline font-semibold'
        >
          Go to League
        </Link>
      </div>
    )
  }

  const searchSuffix = buildQueryHref(
    currentTier,
    effectiveMinGames,
    initialMatchup,
  )
  const seasons = leagueSeasonsByStartDateAsc(eventOptions)
  const tierOptions = ['all', ...analytics.tiers.sort(compareLeagueTierLabels)]
  const minGamesOptions = [3, 5, 9]
  const isAllScope = scope === 'all'
  const uniqueMatchups = analytics.matchups.length

  const concreteTierList = [...analytics.tiers].sort(compareLeagueTierLabels)
  const invalidTier =
    rawTierParam != null &&
    !isAllTier &&
    concreteTierList.length > 0 &&
    !concreteTierList.includes(rawTierParam)

  return (
    <div className='max-w-5xl w-full min-w-0 mx-auto shadow-lg -mt-20 z-10 bg-card rounded-md px-4 py-6 sm:px-6 md:px-8 md:py-8 border space-y-10'>
      <header className='space-y-4 border-b pb-6'>
        <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
          <div>
            <h2 className='text-2xl md:text-3xl font-semibold'>1v1 League</h2>
            <p className='text-muted-foreground mt-1 max-w-2xl'>
              {analytics.scopeLabel}
            </p>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-3'>
          <div className='rounded-md border bg-muted/20 p-3'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>
              Unique matchups
            </p>
            <p className='text-2xl font-semibold tabular-nums'>
              {uniqueMatchups.toLocaleString()}
            </p>
          </div>
          <div className='rounded-md border bg-muted/20 p-3'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>
              Games
            </p>
            <p className='text-2xl font-semibold tabular-nums'>
              {analytics.totalGames.toLocaleString()}
            </p>
          </div>
          <div className='rounded-md border bg-muted/20 p-3'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>
              Players
            </p>
            <p className='text-2xl font-semibold tabular-nums'>
              {analytics.totalPlayers.toLocaleString()}
            </p>
          </div>
        </div>

        <div className='rounded-md border bg-muted/20 p-4 space-y-4'>
          <div className='space-y-2'>
            <p className='text-sm font-semibold tracking-wide'>Season</p>
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                size='sm'
                variant={scope === 'all' ? 'default' : 'outline'}
                asChild
              >
                <Link href={`/league/all${searchSuffix}`}>All</Link>
              </Button>
              {seasons.map((row) => {
                const active = scope !== 'all' && scope === String(row.eventId)
                return (
                  <Button
                    key={`season-select-button-${row.eventId}`}
                    size='sm'
                    variant={active ? 'default' : 'outline'}
                    asChild
                    title={row.label}
                  >
                    <Link href={`/league/${row.eventId}${searchSuffix}`}>
                      {row.seasonIndex}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>

          <div className='space-y-2'>
            <p className='text-sm font-semibold tracking-wide'>Tier</p>
            <div className='flex flex-wrap items-center gap-2'>
              {tierOptions.map((tier) => {
                const tierKey = tier === 'all' ? 'all' : tier
                const tierLabel = tier === 'all' ? 'All' : tier
                return (
                  <Button
                    key={`tier-select-button-${tier}`}
                    size='sm'
                    variant={currentTier === tierKey ? 'default' : 'outline'}
                    asChild
                  >
                    <Link
                      href={`/league/${scope}${buildQueryHref(tierKey, effectiveMinGames, initialMatchup)}`}
                    >
                      {tierLabel}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2 pt-1'>
          <span className='text-sm text-muted-foreground mr-1'>
            Minimum sample:
          </span>
          {minGamesOptions.map((option) => (
            <Button
              key={`game-min-sample-${option}`}
              size='sm'
              variant={effectiveMinGames === option ? 'default' : 'outline'}
              asChild
            >
              <Link
                href={`/league/${scope}${buildQueryHref(currentTier, option, initialMatchup)}`}
              >
                {option}
              </Link>
            </Button>
          ))}
        </div>
      </header>

      <section className='space-y-3'>
        {currentTier === 'all' && (
          <div className='rounded-md border border-dashed p-4 text-sm text-muted-foreground space-y-2'>
            <p>
              <Link
                href='/league/standings/all-time'
                className='text-primary font-medium hover:underline'
              >
                View all-time standings
              </Link>
            </p>
          </div>
        )}
        {invalidTier && (
          <p className='text-sm text-destructive'>
            Unknown tier &quot;{rawTierParam}&quot;. Pick a tier from the list.
          </p>
        )}
        {currentTier !== 'all' && !invalidTier && (
          <>
            <h4 className='text-xl font-semibold'>
              Standings · <span className='text-primary'>{currentTier}</span>
            </h4>
            <p className='text-sm text-muted-foreground max-w-2xl'>
              Update standings by changing the selected{' '}
              <span className='font-semibold'>Season</span> and{' '}
              <span className='font-semibold'>Tier</span> above. Click here to{' '}
              <Link
                href='/league/standings/all-time'
                className='text-primary font-medium hover:underline'
              >
                view all-time standings
              </Link>
            </p>
            <LeagueStandingsTable standings={analytics.standings} />
          </>
        )}
      </section>

      <section className='space-y-3'>
        <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2'>
          <h3 className='text-xl font-semibold'>Matchups</h3>
          <p className='text-sm text-muted-foreground'>
            {isAllScope
              ? 'Faction matchups across all seasons. Expand a row for combo details and game history.'
              : 'Combo matchups for this season. Expand a row to review game-level results.'}
          </p>
        </div>
        <Suspense
          fallback={
            <p className='text-sm text-muted-foreground'>Loading matchups…</p>
          }
        >
          <LeagueMatchupSection
            scope={scope}
            tierFilter={effectiveTierFilter}
            minGames={effectiveMinGames}
            isAllScope={isAllScope}
            matchups={analytics.matchups}
            factionMatchups={analytics.factionMatchups}
            initialMatchupSlug={initialMatchup}
          />
        </Suspense>
      </section>

      <section className='space-y-3'>
        <h3 className='text-xl font-semibold'>Usage</h3>
        <p className='text-sm text-muted-foreground max-w-2xl'>
          Usage and performance by selected Faction.
        </p>
        <LeagueComboUsageSection comboStats={analytics.comboStats} />
      </section>
    </div>
  )
}
