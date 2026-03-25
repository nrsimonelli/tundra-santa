import { NextResponse } from 'next/server'
import { getCachedLeagueMatchupDetail } from '@/lib/supabase/cached-queries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope')?.trim() ?? ''
  const slug = searchParams.get('slug')?.trim() ?? ''
  const tier = searchParams.get('tier')?.trim() || null
  if (!scope || !slug) {
    return NextResponse.json(
      { error: 'scope and slug are required' },
      { status: 400 }
    )
  }

  const detail = await getCachedLeagueMatchupDetail(scope, slug, tier)
  if (!detail) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  return NextResponse.json({
    scopeLabel: detail.scopeLabel,
    combo1: detail.combo1,
    combo2: detail.combo2,
    games: detail.games,
  })
}
