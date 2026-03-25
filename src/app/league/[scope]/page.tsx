import Link from 'next/link'
import { Suspense } from 'react'
import {
  compareLeagueTierLabels,
  getCachedLeagueAnalytics,
  getCachedLeagueEventOptions,
} from '@/lib/supabase/cached-queries'
import { LeagueScopeSelect } from '@/components/league-scope-select'
import { LeagueMatchupSection } from '@/components/league-matchup-section'
import { LeagueComboUsageSection } from '@/components/league-combo-usage-section'
import { Button } from '@/components/ui/button'

export const revalidate = 3600

function buildQueryHref(
  scope: string,
  tier: string | null,
  minGames: number
): string {
  const params = new URLSearchParams()
  if (tier) params.set('tier', tier)
  params.set('minGames', String(minGames))
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
  const effectiveMinGames = Number.isFinite(minGames) ? Math.max(1, minGames) : 5
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
        <h2 className='text-2xl font-semibold'>League scope not found</h2>
        <p className='text-muted-foreground'>
          Use a valid league event id, or choose &quot;All league events&quot; from the league page.
        </p>
        <Link href='/league' className='text-primary hover:underline font-semibold'>
          Go to league analytics
        </Link>
      </div>
    )
  }

  const searchSuffix = buildQueryHref(scope, tierFilter, effectiveMinGames)
  const tierOptions = ['all', ...analytics.tiers.sort(compareLeagueTierLabels)]
  const minGamesOptions = [3, 5, 8, 12]
  const currentTier = tierFilter ?? 'all'
  const isAllScope = scope === 'all'

  return (
    <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-6 md:p-8 border space-y-10'>
      <header className='space-y-4 border-b pb-6'>
        <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
          <div>
            <h2 className='text-2xl md:text-3xl font-semibold'>1v1 League Analytics</h2>
            <p className='text-muted-foreground mt-1 max-w-2xl'>
              {analytics.scopeLabel}
            </p>
            <p className='text-sm text-muted-foreground mt-2'>
              {analytics.totalGames} recorded 1v1 games · {analytics.totalPlayers} players
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
        />

        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground mr-1'>Tier:</span>
          {tierOptions.map((tier) => (
            <Button
              key={tier}
              size='sm'
              variant={currentTier === tier ? 'default' : 'outline'}
              asChild
            >
              <Link
                href={`/league/${scope}${buildQueryHref(scope, tier === 'all' ? null : tier, effectiveMinGames)}`}
              >
                {tier.toUpperCase()}
              </Link>
            </Button>
          ))}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground mr-1'>Min sample (tables):</span>
          {minGamesOptions.map((option) => (
            <Button
              key={option}
              size='sm'
              variant={effectiveMinGames === option ? 'default' : 'outline'}
              asChild
            >
              <Link
                href={`/league/${scope}${buildQueryHref(scope, currentTier === 'all' ? null : currentTier, option)}`}
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
              ? 'Faction pairs — expand for mat-level combos, then game history.'
              : 'Combo vs combo — expand for every game and result.'}
          </p>
        </div>
        <Suspense
          fallback={<p className='text-sm text-muted-foreground'>Loading matchups…</p>}
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
          Rankings are computed per tier only. Open the standings page to pick a tier; tiers are
          never mixed in one ranked list.
        </p>
        <Button asChild variant='secondary' size='sm'>
          <Link
            href={`/league/standings/${scope}?minGames=${effectiveMinGames}`}
            className='font-medium'
          >
            Open standings by tier
          </Link>
        </Button>
      </section>

      <section className='space-y-3'>
        <h3 className='text-xl font-semibold'>Combo usage</h3>
        <LeagueComboUsageSection comboStats={analytics.comboStats} />
      </section>
    </div>
  )
}
