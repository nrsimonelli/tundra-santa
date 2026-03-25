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

const MAX_SEASON_TOGGLE = 7

function buildQueryHref(
  tier: string | null,
  minGames: number,
  matchup: string | null,
): string {
  const params = new URLSearchParams()
  if (tier) params.set('tier', tier)
  params.set('minGames', String(minGames))
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
  const tierFilter = query.tier || null
  const minGames = Number(query.minGames ?? '5')
  const effectiveMinGames = Number.isFinite(minGames)
    ? Math.max(1, minGames)
    : 5
  const initialMatchup =
    typeof query.matchup === 'string' && query.matchup.length > 0
      ? query.matchup
      : null

  const [analytics, eventOptions] = await Promise.all([
    getCachedLeagueAnalytics(scope, tierFilter, effectiveMinGames),
    getCachedLeagueEventOptions(),
  ])

  if (!analytics) {
    return (
      <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-8 border space-y-4'>
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
    tierFilter,
    effectiveMinGames,
    initialMatchup,
  )
  const seasons = leagueSeasonsByStartDateAsc(eventOptions)
  const tierOptions = ['all', ...analytics.tiers.sort(compareLeagueTierLabels)]
  const minGamesOptions = [3, 5, 9]
  const currentTier = tierFilter ?? 'T1'
  const isAllScope = scope === 'all'

  const concreteTierList = [...analytics.tiers].sort(compareLeagueTierLabels)
  const invalidTier =
    tierFilter != null &&
    concreteTierList.length > 0 &&
    !concreteTierList.includes(tierFilter)

  return (
    <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-6 md:p-8 border space-y-10'>
      <header className='space-y-4 border-b pb-6'>
        <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
          <div>
            <h2 className='text-2xl md:text-3xl font-semibold'>League</h2>
            <p className='text-muted-foreground mt-1 max-w-2xl'>
              {analytics.scopeLabel}
            </p>
            <p className='text-sm text-muted-foreground mt-2'>
              {analytics.totalGames} recorded 1v1 games across{' '}
              {analytics.totalPlayers} players
            </p>
            <p className='text-sm pt-2'>
              <Link
                href='/league/standings/all-time'
                className='text-primary font-medium hover:underline'
              >
                View all-time standings
              </Link>
            </p>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground mr-1'>Season:</span>
          <Button
            size='sm'
            variant={scope === 'all' ? 'default' : 'outline'}
            asChild
          >
            <Link href={`/league/all${searchSuffix}`}>All</Link>
          </Button>
          {Array.from({ length: MAX_SEASON_TOGGLE }, (_, i) => {
            const n = i + 1
            const row = seasons.find((s) => s.seasonIndex === n)
            if (row) {
              const active = scope !== 'all' && scope === String(row.eventId)
              return (
                <Button
                  key={`season-select-button-${n}`}
                  size='sm'
                  variant={active ? 'default' : 'outline'}
                  asChild
                  title={row.label}
                >
                  <Link href={`/league/${row.eventId}${searchSuffix}`}>
                    {n}
                  </Link>
                </Button>
              )
            }
            return (
              <Button
                key={`season-select-button-${n}`}
                size='sm'
                variant='outline'
                disabled
              >
                S{n}
              </Button>
            )
          })}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground mr-1'>Tier:</span>
          {tierOptions.map((tier) => (
            <Button
              key={`tier-select-button-${tier}`}
              size='sm'
              className='capitalize'
              variant={currentTier === tier ? 'default' : 'outline'}
              asChild
            >
              <Link
                href={`/league/${scope}${buildQueryHref(tier === 'all' ? null : tier, effectiveMinGames, initialMatchup)}`}
              >
                {tier}
              </Link>
            </Button>
          ))}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
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
                href={`/league/${scope}${buildQueryHref(currentTier === 'all' ? null : currentTier, option, initialMatchup)}`}
              >
                {option}
              </Link>
            </Button>
          ))}
        </div>
      </header>

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
            tierFilter={tierFilter}
            minGames={effectiveMinGames}
            isAllScope={isAllScope}
            matchups={analytics.matchups}
            factionMatchups={analytics.factionMatchups}
            initialMatchupSlug={initialMatchup}
          />
        </Suspense>
      </section>

      <section className='space-y-3'>
        <h3 className='text-xl font-semibold'>Standings</h3>
        <p className='text-sm text-muted-foreground max-w-2xl'>
          Rankings are calculated within a single tier using the current minimum
          sample. Tiers are never combined in one table.
        </p>
        {currentTier === 'all' && (
          <p className='text-sm text-muted-foreground'>
            Choose a tier above to view standings.
          </p>
        )}
        {invalidTier && (
          <p className='text-sm text-destructive'>
            Unknown tier &quot;{tierFilter}&quot;. Pick a tier from the list.
          </p>
        )}
        {currentTier !== 'all' && !invalidTier && (
          <>
            <h4 className='text-lg font-semibold'>
              <span className='text-muted-foreground'>Standings · </span>
              <span className='text-primary'>{tierFilter}</span>
            </h4>
            <LeagueStandingsTable standings={analytics.standings} />
          </>
        )}
      </section>

      <section className='space-y-3'>
        <h3 className='text-xl font-semibold'>Combination usage</h3>
        <p className='text-sm text-muted-foreground max-w-2xl'>
          Usage and performance by selected Faction.
        </p>
        <LeagueComboUsageSection comboStats={analytics.comboStats} />
      </section>
    </div>
  )
}
