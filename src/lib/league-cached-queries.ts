import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { revalidate } from '@/lib/cache-config'
import {
  decodeLeagueMatchupSlug,
  encodeLeagueMatchupSlug,
} from '@/lib/league-matchup'

const PARTICIPATION_BATCH = 120
/** PostgREST returns at most this many rows per request; paginate past it. */
const GAMES_PAGE_SIZE = 1000

function normalizeBid(value: unknown): number | null {
  if (value == null) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

type RawParticipationRow = {
  game: number
  player: number
  ranking: number | null
  final_score: number | null
  bid: unknown
  faction: string | null
  player_mat: string | null
  created_at: string
}

type ParticipantRow = {
  player: number
  ranking: number | null
  final_score: number | null
  bid: number | null
  faction: string | null
  player_mat: string | null
}

async function fetchParticipationBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gameIds: number[],
): Promise<RawParticipationRow[]> {
  const out: RawParticipationRow[] = []
  for (let i = 0; i < gameIds.length; i += PARTICIPATION_BATCH) {
    const batch = gameIds.slice(i, i + PARTICIPATION_BATCH)
    const { data } = await supabase
      .from('game_participation')
      .select(
        'game, player, ranking, final_score, bid, faction, player_mat, created_at',
      )
      .in('game', batch)
    if (data) {
      out.push(...(data as RawParticipationRow[]))
    }
  }
  return out
}

/** One row per (game, player), latest `created_at` wins — fixes skipped 2p games when duplicates exist. */
function participantsByGameFromRows(
  rows: RawParticipationRow[],
): Map<number, ParticipantRow[]> {
  const byGamePlayer = new Map<string, RawParticipationRow>()
  for (const row of rows) {
    const key = `${row.game}:${row.player}`
    const existing = byGamePlayer.get(key)
    if (!existing || row.created_at > existing.created_at) {
      byGamePlayer.set(key, row)
    }
  }
  const byGame = new Map<number, ParticipantRow[]>()
  for (const row of byGamePlayer.values()) {
    if (!byGame.has(row.game)) byGame.set(row.game, [])
    byGame.get(row.game)!.push({
      player: row.player,
      ranking: row.ranking,
      final_score: row.final_score,
      bid: normalizeBid(row.bid),
      faction: row.faction,
      player_mat: row.player_mat,
    })
  }
  return byGame
}

async function countGamesForEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: number,
): Promise<number> {
  const { count } = await supabase
    .from('games')
    .select('id', { count: 'exact', head: true })
    .eq('event', eventId)
  return count ?? 0
}

/** Paginated fetch — required because `.in('event', ids)` is still capped at ~1000 rows total. */
async function fetchAllGamesForEvents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventIds: number[],
  select: string,
): Promise<Record<string, unknown>[]> {
  if (eventIds.length === 0) return []
  const rows: Record<string, unknown>[] = []
  let from = 0
  for (;;) {
    const { data } = await supabase
      .from('games')
      .select(select)
      .in('event', eventIds)
      .order('id', { ascending: true })
      .range(from, from + GAMES_PAGE_SIZE - 1)
    const page = data as Record<string, unknown>[] | null
    if (!page?.length) break
    rows.push(...page)
    if (page.length < GAMES_PAGE_SIZE) break
    from += GAMES_PAGE_SIZE
  }
  return rows
}

type LeagueEvent = {
  id: number
  name: string | null
  start_date: string | null
}

export type LeagueEventOption = {
  id: number
  name: string | null
  start_date: string | null
  gameCount: number
}

export type LeagueStanding = {
  playerId: number
  username: string
  tier: string
  wins: number
  losses: number
  games: number
  winRate: number
  /** Distinct league events with at least one game in this standing row */
  seasonsPlayed: number
  avgScoreDiff: number
  avgBid: number | null
}

export type ComboStat = {
  combo: string
  faction: string
  mat: string
  games: number
  usageRate: number
  wins: number
  winRate: number
  avgBid: number | null
  avgScore: number | null
  avgScoreDiff: number
}

export type ComboMatchupStat = {
  faction1: string
  mat1: string
  faction2: string
  mat2: string
  games: number
  combo1Wins: number
  combo2Wins: number
  matchupSlug: string
}

/** Faction vs faction (any mat), for `scope=all` matchup cards. */
export type FactionMatchupSummary = {
  faction1: string
  faction2: string
  games: number
  faction1Wins: number
  faction2Wins: number
}

export type FactionMatchupCell = {
  winRate: number | null
  sample: number
  wins: number
  losses: number
}

export type BidBucketStat = {
  bucket: string
  games: number
  winRate: number
  avgScoreDiff: number
}

export type LeagueSeasonAnalytics = {
  scopeKey: string
  scopeLabel: string
  tiers: string[]
  totalGames: number
  totalPlayers: number
  standings: LeagueStanding[]
  comboStats: ComboStat[]
  matchups: ComboMatchupStat[]
  /** Populated for all scopes; used for `scope=all` card UX. */
  factionMatchups: FactionMatchupSummary[]
  factions: string[]
  factionMatrix: Record<string, Record<string, FactionMatchupCell>>
  bidBuckets: BidBucketStat[]
}

/** Mat (faction A) × mat (faction B): A's win rate in games where A played that mat vs B on that mat. */
export type FactionMatGridCell = {
  games: number
  aWins: number
  winRate: number | null
}

export type LeagueFactionMatGrid = {
  factionA: string
  factionB: string
  matsA: string[]
  matsB: string[]
  cells: Record<string, Record<string, FactionMatGridCell>>
  /** Games with both factions (any mat); subset have both mats set. */
  gamesWithBothFactions: number
  gamesWithBothMats: number
}

function extractTier(gameName: string | null): string {
  if (!gameName) return 'Unspecified'
  const match = gameName.match(/\bT(\d+)\b/i)
  if (!match?.[1]) return 'Unspecified'
  return `T${match[1]}`
}

function bucketBid(value: number): string {
  const start = Math.floor(value / 2) * 2
  const end = start + 1
  return `${start}-${end}`
}

async function getLeagueEvents(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<LeagueEvent[]> {
  const { data } = await supabase
    .from('events')
    .select('id, name, start_date, num_players_per_game')
    .eq('num_players_per_game', 2)
    .ilike('name', '%league%')
    .order('start_date', { ascending: false })

  return (data ?? []).map((event) => ({
    id: event.id,
    name: event.name,
    start_date: event.start_date,
  }))
}

function resolveLeagueScope(
  scopeKey: string,
  allEvents: LeagueEvent[],
): { eventIds: number[]; scopeLabel: string } | null {
  if (scopeKey === 'all') {
    return {
      eventIds: allEvents.map((e) => e.id),
      scopeLabel: 'All seasons',
    }
  }
  const id = Number.parseInt(scopeKey, 10)
  if (!Number.isFinite(id)) return null
  const found = allEvents.find((e) => e.id === id)
  if (!found) return null
  return {
    eventIds: [id],
    scopeLabel: found.name ?? `League event ${id}`,
  }
}

export async function getCachedLeagueEventOptions(): Promise<
  LeagueEventOption[]
> {
  const supabase = await createClient()

  return unstable_cache(
    async () => {
      const events = await getLeagueEvents(supabase)
      const eventIds = events.map((e) => e.id)
      const countByEvent = new Map<number, number>()
      if (eventIds.length > 0) {
        const counts = await Promise.all(
          eventIds.map(async (id) => ({
            id,
            n: await countGamesForEvent(supabase, id),
          })),
        )
        for (const { id, n } of counts) {
          countByEvent.set(id, n)
        }
      }
      return events.map((e) => ({
        id: e.id,
        name: e.name,
        start_date: e.start_date,
        gameCount: countByEvent.get(e.id) ?? 0,
      }))
    },
    ['league-event-options-v2'],
    {
      revalidate: revalidate,
      tags: ['events', 'games'],
    },
  )()
}

function emptyAnalytics(
  scopeKey: string,
  scopeLabel: string,
): LeagueSeasonAnalytics {
  return {
    scopeKey,
    scopeLabel,
    tiers: [],
    totalGames: 0,
    totalPlayers: 0,
    standings: [],
    comboStats: [],
    matchups: [],
    factionMatchups: [],
    factions: [],
    factionMatrix: {},
    bidBuckets: [],
  }
}

export async function getCachedLeagueAnalytics(
  scopeKey: string,
  tierFilter: string | null,
  minGames: number,
): Promise<LeagueSeasonAnalytics | null> {
  const supabase = await createClient()

  return unstable_cache(
    async () => {
      const events = await getLeagueEvents(supabase)
      const resolved = resolveLeagueScope(scopeKey, events)
      if (!resolved || resolved.eventIds.length === 0) return null

      const { eventIds, scopeLabel } = resolved

      const gameRows = await fetchAllGamesForEvents(
        supabase,
        eventIds,
        'id, event, name, created_at',
      )
      const games = gameRows as {
        id: number
        event: number
        name: string | null
        created_at: string
      }[]

      if (!games || games.length === 0) {
        return emptyAnalytics(scopeKey, scopeLabel)
      }

      const gameById = new Map(games.map((game) => [game.id, game]))
      const tiers = Array.from(
        new Set(games.map((game) => extractTier(game.name))),
      )
      const filteredGameIds = games
        .filter((game) => !tierFilter || extractTier(game.name) === tierFilter)
        .map((game) => game.id)

      if (filteredGameIds.length === 0) {
        return { ...emptyAnalytics(scopeKey, scopeLabel), tiers }
      }

      const rawParticipation = await fetchParticipationBatched(
        supabase,
        filteredGameIds,
      )
      if (rawParticipation.length === 0) return null

      const participantsByGame = participantsByGameFromRows(rawParticipation)

      const { data: players } = await supabase
        .from('players')
        .select('id, username')
        .in(
          'id',
          Array.from(new Set(rawParticipation.map((row) => row.player))),
        )
      const playerNameById = new Map(
        (players ?? []).map((p) => [p.id, p.username]),
      )

      const standingsMap = new Map<
        string,
        {
          playerId: number
          tier: string
          wins: number
          losses: number
          games: number
          eventIds: Set<number>
          scoreDiffSum: number
          bidSum: number
          lastResults: ('W' | 'L')[]
        }
      >()
      const comboMap = new Map<
        string,
        {
          faction: string
          mat: string
          games: number
          wins: number
          bidSum: number
          scoreSum: number
          scoreCount: number
          scoreDiffSum: number
        }
      >()
      const pairMap = new Map<
        string,
        {
          factions: [string, string]
          winsByFaction: Map<string, number>
          sample: number
        }
      >()
      const bidMap = new Map<
        string,
        { games: number; wins: number; scoreDiffSum: number }
      >()
      const matchupMap = new Map<
        string,
        {
          faction1: string
          mat1: string
          faction2: string
          mat2: string
          games: number
          combo1Wins: number
          combo2Wins: number
        }
      >()

      const uniquePlayers = new Set<number>()
      let twoPlayerGameCount = 0

      for (const [gameId, rows] of participantsByGame.entries()) {
        if (rows.length !== 2) continue
        twoPlayerGameCount += 1
        const game = gameById.get(gameId)
        const tier = extractTier(game?.name ?? null)
        const [a, b] = rows
        uniquePlayers.add(a.player)
        uniquePlayers.add(b.player)

        const winnerId =
          a.ranking === 1 ? a.player : b.ranking === 1 ? b.player : null
        const eventId = game?.event

        const updateStanding = (row: ParticipantRow, opp: ParticipantRow) => {
          const key = `${tier}:${row.player}`
          const existing = standingsMap.get(key) ?? {
            playerId: row.player,
            tier,
            wins: 0,
            losses: 0,
            games: 0,
            eventIds: new Set<number>(),
            scoreDiffSum: 0,
            bidSum: 0,
            lastResults: [],
          }
          const isWin = winnerId === row.player
          existing.games += 1
          if (eventId != null) existing.eventIds.add(eventId)
          if (isWin) existing.wins += 1
          else existing.losses += 1
          existing.scoreDiffSum +=
            (row.final_score ?? 0) - (opp.final_score ?? 0)
          existing.bidSum += row.bid ?? 0
          existing.lastResults.push(isWin ? 'W' : 'L')
          if (existing.lastResults.length > 3) {
            existing.lastResults.shift()
          }
          standingsMap.set(key, existing)
        }

        updateStanding(a, b)
        updateStanding(b, a)

        const updateCombo = (row: ParticipantRow, opp: ParticipantRow) => {
          if (!row.faction || !row.player_mat) return
          const key = `${row.faction}|${row.player_mat}`
          const existing = comboMap.get(key) ?? {
            faction: row.faction,
            mat: row.player_mat,
            games: 0,
            wins: 0,
            bidSum: 0,
            scoreSum: 0,
            scoreCount: 0,
            scoreDiffSum: 0,
          }
          existing.games += 1
          if (winnerId === row.player) existing.wins += 1
          existing.bidSum += row.bid ?? 0
          if (typeof row.final_score === 'number') {
            existing.scoreSum += row.final_score
            existing.scoreCount += 1
          }
          existing.scoreDiffSum +=
            (row.final_score ?? 0) - (opp.final_score ?? 0)
          comboMap.set(key, existing)
        }

        updateCombo(a, b)
        updateCombo(b, a)

        if (a.faction && a.player_mat && b.faction && b.player_mat) {
          const ca = `${a.faction}|${a.player_mat}`
          const cb = `${b.faction}|${b.player_mat}`
          const firstKey = ca < cb ? ca : cb
          const secondKey = ca < cb ? cb : ca
          const [f1, m1] = firstKey.split('|') as [string, string]
          const [f2, m2] = secondKey.split('|') as [string, string]
          const mKey = `${firstKey}@@${secondKey}`
          const mExisting = matchupMap.get(mKey) ?? {
            faction1: f1,
            mat1: m1,
            faction2: f2,
            mat2: m2,
            games: 0,
            combo1Wins: 0,
            combo2Wins: 0,
          }
          mExisting.games += 1
          if (winnerId === a.player) {
            const wk = ca
            if (wk === firstKey) mExisting.combo1Wins += 1
            else mExisting.combo2Wins += 1
          } else if (winnerId === b.player) {
            const wk = cb
            if (wk === firstKey) mExisting.combo1Wins += 1
            else mExisting.combo2Wins += 1
          }
          matchupMap.set(mKey, mExisting)
        }

        if (a.faction && b.faction) {
          const factions =
            a.faction < b.faction
              ? ([a.faction, b.faction] as [string, string])
              : ([b.faction, a.faction] as [string, string])
          const pairKey = `${factions[0]}|${factions[1]}`
          const pair = pairMap.get(pairKey) ?? {
            factions,
            winsByFaction: new Map<string, number>(),
            sample: 0,
          }
          pair.sample += 1
          if (winnerId === a.player) {
            pair.winsByFaction.set(
              a.faction,
              (pair.winsByFaction.get(a.faction) ?? 0) + 1,
            )
          } else if (winnerId === b.player) {
            pair.winsByFaction.set(
              b.faction,
              (pair.winsByFaction.get(b.faction) ?? 0) + 1,
            )
          }
          pairMap.set(pairKey, pair)
        }

        const updateBid = (row: ParticipantRow, opp: ParticipantRow) => {
          const bucket = bucketBid(row.bid ?? 0)
          const existing = bidMap.get(bucket) ?? {
            games: 0,
            wins: 0,
            scoreDiffSum: 0,
          }
          existing.games += 1
          if (winnerId === row.player) existing.wins += 1
          existing.scoreDiffSum +=
            (row.final_score ?? 0) - (opp.final_score ?? 0)
          bidMap.set(bucket, existing)
        }
        updateBid(a, b)
        updateBid(b, a)
      }

      const standings = Array.from(standingsMap.values())
        .filter((row) => row.games >= minGames)
        .map((row) => ({
          playerId: row.playerId,
          username: playerNameById.get(row.playerId) ?? 'Unknown',
          tier: row.tier,
          wins: row.wins,
          losses: row.losses,
          games: row.games,
          winRate: row.games > 0 ? row.wins / row.games : 0,
          seasonsPlayed: row.eventIds.size,
          avgScoreDiff: row.games > 0 ? row.scoreDiffSum / row.games : 0,
          avgBid: row.games > 0 ? row.bidSum / row.games : null,
        }))
        .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins)

      const totalComboAppearances = Array.from(comboMap.values()).reduce(
        (sum, row) => sum + row.games,
        0,
      )
      const comboStats = Array.from(comboMap.values())
        .filter((row) => row.games >= minGames)
        .map((row) => ({
          combo: `${row.faction}/${row.mat}`,
          faction: row.faction,
          mat: row.mat,
          games: row.games,
          usageRate:
            totalComboAppearances > 0 ? row.games / totalComboAppearances : 0,
          wins: row.wins,
          winRate: row.games > 0 ? row.wins / row.games : 0,
          avgBid: row.games > 0 ? row.bidSum / row.games : null,
          avgScore: row.scoreCount > 0 ? row.scoreSum / row.scoreCount : null,
          avgScoreDiff: row.games > 0 ? row.scoreDiffSum / row.games : 0,
        }))
        .sort((a, b) => b.games - a.games)

      const matchups: ComboMatchupStat[] = Array.from(matchupMap.values())
        .filter((row) => row.games >= minGames)
        .map((row) => ({
          ...row,
          matchupSlug: encodeLeagueMatchupSlug(
            { faction: row.faction1, mat: row.mat1 },
            { faction: row.faction2, mat: row.mat2 },
          ),
        }))
        .sort((a, b) => b.games - a.games)

      const factionMatchups: FactionMatchupSummary[] = Array.from(
        pairMap.values(),
      )
        .filter((row) => row.sample >= minGames)
        .map((row) => {
          const [f1, f2] = row.factions
          return {
            faction1: f1,
            faction2: f2,
            games: row.sample,
            faction1Wins: row.winsByFaction.get(f1) ?? 0,
            faction2Wins: row.winsByFaction.get(f2) ?? 0,
          }
        })
        .sort((a, b) => b.games - a.games)

      const factions = Array.from(
        new Set(
          rawParticipation
            .map((row) => row.faction)
            .filter(
              (
                faction,
              ): faction is
                | 'polania'
                | 'albion'
                | 'nordic'
                | 'rusviet'
                | 'togawa'
                | 'crimea'
                | 'saxony' => faction !== null,
            ),
        ),
      ).sort()
      const factionMatrix: Record<
        string,
        Record<string, FactionMatchupCell>
      > = {}

      for (const rowFaction of factions) {
        factionMatrix[rowFaction] = {}
        for (const colFaction of factions) {
          factionMatrix[rowFaction][colFaction] = {
            winRate: null,
            sample: 0,
            wins: 0,
            losses: 0,
          }
        }
      }

      for (const pair of pairMap.values()) {
        const [f1, f2] = pair.factions
        const f1Wins = pair.winsByFaction.get(f1) ?? 0
        const f2Wins = pair.winsByFaction.get(f2) ?? 0
        const sample = pair.sample
        factionMatrix[f1][f2] = {
          winRate: sample > 0 ? f1Wins / sample : null,
          sample,
          wins: f1Wins,
          losses: f2Wins,
        }
        factionMatrix[f2][f1] = {
          winRate: sample > 0 ? f2Wins / sample : null,
          sample,
          wins: f2Wins,
          losses: f1Wins,
        }
      }

      const bidBuckets = Array.from(bidMap.entries())
        .map(([bucket, row]) => ({
          bucket,
          games: row.games,
          winRate: row.games > 0 ? row.wins / row.games : 0,
          avgScoreDiff: row.games > 0 ? row.scoreDiffSum / row.games : 0,
        }))
        .sort((a, b) => {
          const aStart = Number(a.bucket.split('-')[0])
          const bStart = Number(b.bucket.split('-')[0])
          return aStart - bStart
        })

      return {
        scopeKey,
        scopeLabel,
        tiers,
        totalGames: twoPlayerGameCount,
        totalPlayers: uniquePlayers.size,
        standings,
        comboStats,
        matchups,
        factionMatchups,
        factions,
        factionMatrix,
        bidBuckets,
      }
    },
    [`league-analytics-v6-${scopeKey}-${tierFilter ?? 'all'}-${minGames}`],
    {
      revalidate: revalidate,
      tags: ['events', 'games', 'players', 'tournaments'],
    },
  )()
}

export async function getCachedLeagueFactionMatGrid(
  scopeKey: string,
  tierFilter: string | null,
  factionA: string,
  factionB: string,
): Promise<LeagueFactionMatGrid | null> {
  if (!factionA || !factionB || factionA === factionB) return null

  const supabase = await createClient()

  return unstable_cache(
    async () => {
      const events = await getLeagueEvents(supabase)
      const resolved = resolveLeagueScope(scopeKey, events)
      if (!resolved || resolved.eventIds.length === 0) return null

      const { eventIds } = resolved

      const gameRows = await fetchAllGamesForEvents(
        supabase,
        eventIds,
        'id, event, name, created_at',
      )
      const games = gameRows as {
        id: number
        event: number
        name: string | null
        created_at: string
      }[]

      if (!games?.length) {
        return {
          factionA,
          factionB,
          matsA: [],
          matsB: [],
          cells: {},
          gamesWithBothFactions: 0,
          gamesWithBothMats: 0,
        }
      }

      const gameById = new Map(games.map((game) => [game.id, game]))
      const filteredGameIds = games
        .filter((game) => !tierFilter || extractTier(game.name) === tierFilter)
        .map((game) => game.id)

      if (filteredGameIds.length === 0) {
        return {
          factionA,
          factionB,
          matsA: [],
          matsB: [],
          cells: {},
          gamesWithBothFactions: 0,
          gamesWithBothMats: 0,
        }
      }

      const rawParticipation = await fetchParticipationBatched(
        supabase,
        filteredGameIds,
      )
      if (rawParticipation.length === 0) return null

      const participantsByGame = participantsByGameFromRows(rawParticipation)

      const fa = factionA
      const fb = factionB
      const accum = new Map<string, { games: number; aWins: number }>()
      const matASet = new Set<string>()
      const matBSet = new Set<string>()
      let gamesWithBothFactions = 0
      let gamesWithBothMats = 0

      for (const [gameId, rows] of participantsByGame.entries()) {
        if (rows.length !== 2) continue
        const game = gameById.get(gameId)
        if (!game) continue

        const [p1, p2] = rows
        let sideA: ParticipantRow
        let sideB: ParticipantRow
        if (p1.faction === fa && p2.faction === fb) {
          sideA = p1
          sideB = p2
        } else if (p2.faction === fa && p1.faction === fb) {
          sideA = p2
          sideB = p1
        } else {
          continue
        }

        gamesWithBothFactions += 1

        const winnerId =
          p1.ranking === 1 ? p1.player : p2.ranking === 1 ? p2.player : null

        if (!sideA.player_mat || !sideB.player_mat) continue

        gamesWithBothMats += 1
        const ma = sideA.player_mat
        const mb = sideB.player_mat
        matASet.add(ma)
        matBSet.add(mb)
        const key = `${ma}\0${mb}`
        const cell = accum.get(key) ?? { games: 0, aWins: 0 }
        cell.games += 1
        if (winnerId != null && winnerId === sideA.player) cell.aWins += 1
        accum.set(key, cell)
      }

      const matsA = Array.from(matASet).sort((a, b) => a.localeCompare(b))
      const matsB = Array.from(matBSet).sort((a, b) => a.localeCompare(b))

      const cells: Record<string, Record<string, FactionMatGridCell>> = {}
      for (const ma of matsA) {
        cells[ma] = {}
        for (const mb of matsB) {
          const c = accum.get(`${ma}\0${mb}`)
          const games = c?.games ?? 0
          const aWins = c?.aWins ?? 0
          cells[ma][mb] = {
            games,
            aWins,
            winRate: games > 0 ? aWins / games : null,
          }
        }
      }

      return {
        factionA: fa,
        factionB: fb,
        matsA,
        matsB,
        cells,
        gamesWithBothFactions,
        gamesWithBothMats,
      }
    },
    [
      `league-faction-mat-grid-v1-${scopeKey}-${tierFilter ?? 'all'}-${factionA}-${factionB}`,
    ],
    {
      revalidate: revalidate,
      tags: ['events', 'games', 'players', 'tournaments'],
    },
  )()
}

function tierOrderForLex(tier: string): number {
  if (tier === 'Unspecified') return 1_000_000
  const m = /^T(\d+)$/i.exec(tier.trim())
  if (!m) return 999_999
  const n = Number(m[1])
  return Number.isFinite(n) ? n : 999_999
}

function sortedTierKeysLex(union: Set<string>): string[] {
  return Array.from(union).sort(
    (a, b) => tierOrderForLex(a) - tierOrderForLex(b),
  )
}

/** Sort tier labels T1, T2, … before Unspecified (for UI chips). */
export function compareLeagueTierLabels(a: string, b: string): number {
  const d = tierOrderForLex(a) - tierOrderForLex(b)
  return d !== 0 ? d : a.localeCompare(b)
}

function primaryTierFromCounts(tierCounts: Map<string, number>): string {
  let best = 'Unspecified'
  let bestN = -1
  for (const [t, n] of tierCounts.entries()) {
    if (n > bestN) {
      best = t
      bestN = n
    } else if (n === bestN && compareLeagueTierLabels(t, best) < 0) {
      best = t
    }
  }
  return best
}

/** Win-rate ranking within one league event + tier (anyone with ≥1 game in slice). */
function rankInLeagueEventTier(
  games: { id: number; name: string | null; event: number }[],
  byGame: Map<number, ParticipantRow[]>,
  eventId: number,
  tier: string,
  playerId: number,
): { rank: number | null; totalRanked: number } {
  const idSet = new Set(
    games
      .filter((g) => g.event === eventId && extractTier(g.name) === tier)
      .map((g) => g.id),
  )
  const agg = new Map<number, { w: number; l: number; games: number }>()
  for (const gid of idSet) {
    const rows = byGame.get(gid)
    if (!rows || rows.length !== 2) continue
    const [a, b] = rows
    const winnerId =
      a.ranking === 1 ? a.player : b.ranking === 1 ? b.player : null
    for (const p of [a, b]) {
      const cur = agg.get(p.player) ?? { w: 0, l: 0, games: 0 }
      cur.games += 1
      if (winnerId === p.player) cur.w += 1
      else if (winnerId != null) cur.l += 1
      agg.set(p.player, cur)
    }
  }
  const list = Array.from(agg.entries())
    .map(([id, s]) => ({
      id,
      games: s.games,
      wins: s.w,
      losses: s.l,
      winRate: s.games > 0 ? s.w / s.games : 0,
    }))
    .filter((s) => s.games >= 1)
    .sort(
      (a, b) => b.winRate - a.winRate || b.wins - a.wins || a.losses - b.losses,
    )

  const idx = list.findIndex((x) => x.id === playerId)
  if (idx < 0) return { rank: null, totalRanked: list.length }
  return { rank: idx + 1, totalRanked: list.length }
}

function compareAllTimeLex(
  a: {
    winsByTier: Map<string, number>
    winRate: number
    wins: number
    losses: number
  },
  b: {
    winsByTier: Map<string, number>
    winRate: number
    wins: number
    losses: number
  },
  tierOrder: string[],
): number {
  for (const t of tierOrder) {
    const aw = a.winsByTier.get(t) ?? 0
    const bw = b.winsByTier.get(t) ?? 0
    if (bw !== aw) return bw - aw
  }
  if (b.winRate !== a.winRate) return b.winRate - a.winRate
  if (b.wins !== a.wins) return b.wins - a.wins
  return a.losses - b.losses
}

export type LeagueAllTimeRow = {
  playerId: number
  username: string
  games: number
  wins: number
  losses: number
  winRate: number
  seasonsPlayed: number
}

export type LeagueAllTimeStandings = {
  scopeLabel: string
  totalGames: number
  rows: LeagueAllTimeRow[]
}

/** Cross-season 1v1 league table for all dynamic league events (`scope=all` data). Includes every player with recorded games (no min-games gate). */
export async function getCachedLeagueAllTimeStandings(): Promise<LeagueAllTimeStandings | null> {
  const supabase = await createClient()

  return unstable_cache(
    async () => {
      const events = await getLeagueEvents(supabase)
      const eventIds = events.map((e) => e.id)
      if (eventIds.length === 0) {
        return {
          scopeLabel: 'All seasons',
          totalGames: 0,
          rows: [],
        }
      }

      const gameRows = await fetchAllGamesForEvents(
        supabase,
        eventIds,
        'id, event, name, created_at',
      )
      const games = gameRows as {
        id: number
        event: number
        name: string | null
        created_at: string
      }[]

      if (!games.length) {
        return {
          scopeLabel: 'All seasons',
          totalGames: 0,
          rows: [],
        }
      }

      const gameById = new Map(games.map((g) => [g.id, g]))
      const allGameIds = games.map((g) => g.id)

      const rawParticipation = await fetchParticipationBatched(
        supabase,
        allGameIds,
      )
      if (!rawParticipation.length) return null

      const participantsByGame = participantsByGameFromRows(rawParticipation)

      const { data: players } = await supabase
        .from('players')
        .select('id, username')
        .in(
          'id',
          Array.from(new Set(rawParticipation.map((row) => row.player))),
        )
      const playerNameById = new Map(
        (players ?? []).map((p) => [p.id, p.username]),
      )

      const agg = new Map<
        number,
        {
          wins: number
          losses: number
          games: number
          eventIds: Set<number>
          winsByTier: Map<string, number>
        }
      >()
      const tiersSeen = new Set<string>()

      let twoPlayerCount = 0

      for (const [gameId, rows] of participantsByGame.entries()) {
        if (rows.length !== 2) continue
        twoPlayerCount += 1
        const game = gameById.get(gameId)
        const tier = extractTier(game?.name ?? null)
        tiersSeen.add(tier)
        const eventId = game?.event

        const [a, b] = rows
        const winnerId =
          a.ranking === 1 ? a.player : b.ranking === 1 ? b.player : null

        const bump = (playerId: number, isWin: boolean) => {
          const row = agg.get(playerId) ?? {
            wins: 0,
            losses: 0,
            games: 0,
            eventIds: new Set<number>(),
            winsByTier: new Map<string, number>(),
          }
          row.games += 1
          if (eventId != null) row.eventIds.add(eventId)
          if (isWin) {
            row.wins += 1
            row.winsByTier.set(tier, (row.winsByTier.get(tier) ?? 0) + 1)
          } else {
            row.losses += 1
          }
          agg.set(playerId, row)
        }

        bump(a.player, winnerId === a.player)
        bump(b.player, winnerId === b.player)
      }

      const tierOrder = sortedTierKeysLex(tiersSeen)

      const sorted = Array.from(agg.entries())
        .map(([playerId, row]) => ({
          playerId,
          username: playerNameById.get(playerId) ?? 'Unknown',
          games: row.games,
          wins: row.wins,
          losses: row.losses,
          winRate: row.games > 0 ? row.wins / row.games : 0,
          seasonsPlayed: row.eventIds.size,
          winsByTier: row.winsByTier,
        }))
        .sort((a, b) =>
          compareAllTimeLex(
            {
              winsByTier: a.winsByTier,
              winRate: a.winRate,
              wins: a.wins,
              losses: a.losses,
            },
            {
              winsByTier: b.winsByTier,
              winRate: b.winRate,
              wins: b.wins,
              losses: b.losses,
            },
            tierOrder,
          ),
        )

      const rows: LeagueAllTimeRow[] = sorted.map(
        ({ winsByTier: _w, ...out }) => out,
      )

      return {
        scopeLabel: 'All seasons',
        totalGames: twoPlayerCount,
        rows,
      }
    },
    ['league-all-time-standings-v3'],
    {
      revalidate: revalidate,
      tags: ['events', 'games', 'players', 'tournaments'],
    },
  )()
}

export type LeagueMatchupGameRow = {
  gameId: number
  gameName: string | null
  playerA: string
  playerB: string
  scoreA: number | null
  scoreB: number | null
  bidA: number | null
  bidB: number | null
  winnerUsername: string | null
}

export async function getCachedLeagueMatchupDetail(
  scopeKey: string,
  pairSlug: string,
  tierFilter: string | null,
): Promise<{
  scopeLabel: string
  combo1: { faction: string; mat: string }
  combo2: { faction: string; mat: string }
  games: LeagueMatchupGameRow[]
} | null> {
  const supabase = await createClient()
  const decoded = decodeLeagueMatchupSlug(pairSlug)
  if (!decoded) return null

  return unstable_cache(
    async () => {
      const events = await getLeagueEvents(supabase)
      const resolved = resolveLeagueScope(scopeKey, events)
      if (!resolved) return null

      const [c1, c2] = decoded
      const k1 = `${c1.faction}|${c1.mat}`
      const k2 = `${c2.faction}|${c2.mat}`

      const gameRows = await fetchAllGamesForEvents(
        supabase,
        resolved.eventIds,
        'id, event, name, created_at',
      )
      const games = gameRows as {
        id: number
        event: number
        name: string | null
        created_at: string
      }[]

      if (!games || games.length === 0) return null

      const filteredIds = games
        .filter((g) => !tierFilter || extractTier(g.name) === tierFilter)
        .map((g) => g.id)

      const rawRows = await fetchParticipationBatched(supabase, filteredIds)
      if (rawRows.length === 0) return null

      const playerIds = Array.from(new Set(rawRows.map((p) => p.player)))
      const { data: players } = await supabase
        .from('players')
        .select('id, username')
        .in('id', playerIds)
      const names = new Map((players ?? []).map((p) => [p.id, p.username]))

      const byGame = participantsByGameFromRows(rawRows)

      const gameById = new Map(games.map((g) => [g.id, g]))
      const rows: LeagueMatchupGameRow[] = []

      for (const [gid, parts] of byGame.entries()) {
        if (parts.length !== 2) continue
        const [a, b] = parts
        if (!a.faction || !a.player_mat || !b.faction || !b.player_mat) continue
        const ca = `${a.faction}|${a.player_mat}`
        const cb = `${b.faction}|${b.player_mat}`
        const set = new Set([ca, cb])
        if (!set.has(k1) || !set.has(k2)) continue

        const winnerId =
          a.ranking === 1 ? a.player : b.ranking === 1 ? b.player : null
        rows.push({
          gameId: gid,
          gameName: gameById.get(gid)?.name ?? null,
          playerA: names.get(a.player) ?? '?',
          playerB: names.get(b.player) ?? '?',
          scoreA: a.final_score,
          scoreB: b.final_score,
          bidA: normalizeBid(a.bid),
          bidB: normalizeBid(b.bid),
          winnerUsername:
            winnerId != null ? (names.get(winnerId) ?? null) : null,
        })
      }

      rows.sort((a, b) => b.gameId - a.gameId)

      return {
        scopeLabel: resolved.scopeLabel,
        combo1: c1,
        combo2: c2,
        games: rows,
      }
    },
    [`league-matchup-${scopeKey}-${pairSlug}-${tierFilter ?? 'all'}`],
    {
      revalidate: revalidate,
      tags: ['events', 'games', 'players'],
    },
  )()
}

export type LeaguePlayerGameRow = {
  gameId: number
  gameName: string | null
  eventId: number
  /** S1 = oldest league season, ascending with `getLeagueEvents` order by start_date */
  seasonIndex: number
  tierLabel: string
  won: boolean
  opponent: string
  myScore: number | null
  oppScore: number | null
  myBid: number | null
  oppBid: number | null
  myFaction: string | null
  myMat: string | null
  oppFaction: string | null
  oppMat: string | null
}

export type LeaguePlayerSeasonRow = {
  seasonIndex: number
  eventId: number
  wins: number
  losses: number
  games: number
  winRate: number
  /** Tier tag played most often this season (from game names). */
  primaryTier: string
  /** 1-based rank in this event+tier by win rate; null if not in standings slice. */
  rankInTier: number | null
  /** Players with ≥1 game in this event+tier. */
  playersInTier: number
}

export type LeaguePlayerFactionStat = {
  faction: string
  games: number
  wins: number
  losses: number
  winRate: number
}

export type LeaguePlayerProfile = {
  username: string
  wins: number
  losses: number
  games: number
  winRate: number
  /** Games where this player has a numeric bid on record */
  gamesWithBidRecorded: number
  /** Mean opening bid (yours); missing bids count as 0 */
  avgMyBid: number | null
  gamesPlayed: LeaguePlayerGameRow[]
  /** Newest season first (highest seasonIndex first) */
  seasonRows: LeaguePlayerSeasonRow[]
  factionByPlay: LeaguePlayerFactionStat[]
}

export async function getCachedLeaguePlayerProfile(
  username: string,
): Promise<LeaguePlayerProfile | null> {
  const supabase = await createClient()

  return unstable_cache(
    async () => {
      const { data: playerRow } = await supabase
        .from('players')
        .select('id, username')
        .eq('username', username)
        .single()

      if (!playerRow) return null

      const events = await getLeagueEvents(supabase)
      const eventIds = events.map((e) => e.id)
      if (eventIds.length === 0) {
        return {
          username: playerRow.username,
          wins: 0,
          losses: 0,
          games: 0,
          winRate: 0,
          gamesWithBidRecorded: 0,
          avgMyBid: null,
          gamesPlayed: [],
          seasonRows: [],
          factionByPlay: [],
        }
      }

      const eventsSortedOldest = [...events].sort((a, b) => {
        const da = a.start_date ?? ''
        const db = b.start_date ?? ''
        return da.localeCompare(db)
      })
      const seasonIndexByEventId = new Map<number, number>()
      eventsSortedOldest.forEach((e, i) => {
        seasonIndexByEventId.set(e.id, i + 1)
      })

      const gameRows = await fetchAllGamesForEvents(
        supabase,
        eventIds,
        'id, name, event',
      )
      const games = gameRows as {
        id: number
        name: string | null
        event: number
      }[]

      if (!games || games.length === 0) {
        return {
          username: playerRow.username,
          wins: 0,
          losses: 0,
          games: 0,
          winRate: 0,
          gamesWithBidRecorded: 0,
          avgMyBid: null,
          gamesPlayed: [],
          seasonRows: [],
          factionByPlay: [],
        }
      }

      const gameIds = games.map((g) => g.id)
      const rawParticipation = await fetchParticipationBatched(
        supabase,
        gameIds,
      )
      if (rawParticipation.length === 0) {
        return {
          username: playerRow.username,
          wins: 0,
          losses: 0,
          games: 0,
          winRate: 0,
          gamesWithBidRecorded: 0,
          avgMyBid: null,
          gamesPlayed: [],
          seasonRows: [],
          factionByPlay: [],
        }
      }

      const gameMetaById = new Map(
        games.map((g) => [g.id, { name: g.name, event: g.event }]),
      )
      const byGame = participantsByGameFromRows(rawParticipation)

      const otherIds = new Set<number>()
      type RawRow = LeaguePlayerGameRow & { oppId: number }
      const rawRows: RawRow[] = []
      let wins = 0
      let losses = 0

      for (const [gid, parts] of byGame.entries()) {
        if (parts.length !== 2) continue
        const me = parts.find((p) => p.player === playerRow.id)
        const opp = parts.find((p) => p.player !== playerRow.id)
        if (!me || !opp) continue
        otherIds.add(opp.player)
        const isWin = me.ranking === 1
        if (isWin) wins += 1
        else losses += 1
        const meta = gameMetaById.get(gid)
        const eventId = meta?.event ?? 0
        const gname = meta?.name ?? null
        rawRows.push({
          gameId: gid,
          gameName: gname,
          eventId,
          seasonIndex: seasonIndexByEventId.get(eventId) ?? 0,
          tierLabel: extractTier(gname),
          won: isWin,
          opponent: '',
          oppId: opp.player,
          myScore: me.final_score,
          oppScore: opp.final_score,
          myBid: normalizeBid(me.bid),
          oppBid: normalizeBid(opp.bid),
          myFaction: me.faction,
          myMat: me.player_mat,
          oppFaction: opp.faction,
          oppMat: opp.player_mat,
        })
      }

      const { data: others } = await supabase
        .from('players')
        .select('id, username')
        .in('id', Array.from(otherIds))
      const oppNames = new Map((others ?? []).map((p) => [p.id, p.username]))

      const gamesPlayed: LeaguePlayerGameRow[] = rawRows.map((row) => {
        const { oppId, ...rest } = row
        return {
          ...rest,
          opponent: oppNames.get(oppId) ?? '?',
        }
      })

      gamesPlayed.sort((a, b) => b.gameId - a.gameId)

      let bidSum = 0
      let gamesWithBidRecorded = 0
      for (const g of gamesPlayed) {
        bidSum += g.myBid ?? 0
        if (g.myBid != null) gamesWithBidRecorded += 1
      }

      const total = wins + losses

      const seasonAggByEvent = new Map<
        number,
        { wins: number; losses: number; tierCounts: Map<string, number> }
      >()
      for (const g of gamesPlayed) {
        if (g.eventId <= 0) continue
        const row = seasonAggByEvent.get(g.eventId) ?? {
          wins: 0,
          losses: 0,
          tierCounts: new Map<string, number>(),
        }
        if (g.won) row.wins += 1
        else row.losses += 1
        const t = g.tierLabel
        row.tierCounts.set(t, (row.tierCounts.get(t) ?? 0) + 1)
        seasonAggByEvent.set(g.eventId, row)
      }

      const seasonRows: LeaguePlayerSeasonRow[] = Array.from(
        seasonAggByEvent.entries(),
      )
        .map(([eventId, row]) => {
          const seasonIndex = seasonIndexByEventId.get(eventId) ?? 0
          if (seasonIndex <= 0) return null
          const n = row.wins + row.losses
          const primaryTier = primaryTierFromCounts(row.tierCounts)
          const { rank, totalRanked } = rankInLeagueEventTier(
            games,
            byGame,
            eventId,
            primaryTier,
            playerRow.id,
          )
          return {
            seasonIndex,
            eventId,
            wins: row.wins,
            losses: row.losses,
            games: n,
            winRate: n > 0 ? row.wins / n : 0,
            primaryTier,
            rankInTier: rank,
            playersInTier: totalRanked,
          }
        })
        .filter((r): r is LeaguePlayerSeasonRow => r != null)
        .sort((a, b) => b.seasonIndex - a.seasonIndex)

      const facAgg = new Map<
        string,
        { games: number; wins: number; losses: number }
      >()
      for (const g of gamesPlayed) {
        if (!g.myFaction) continue
        const f = g.myFaction
        const row = facAgg.get(f) ?? {
          games: 0,
          wins: 0,
          losses: 0,
        }
        row.games += 1
        if (g.won) row.wins += 1
        else row.losses += 1
        facAgg.set(f, row)
      }

      const factionByPlay: LeaguePlayerFactionStat[] = Array.from(
        facAgg.entries(),
      )
        .map(([faction, row]) => ({
          faction,
          games: row.games,
          wins: row.wins,
          losses: row.losses,
          winRate: row.games > 0 ? row.wins / row.games : 0,
        }))
        .sort((a, b) => b.games - a.games)

      return {
        username: playerRow.username,
        wins,
        losses,
        games: total,
        winRate: total > 0 ? wins / total : 0,
        gamesWithBidRecorded,
        avgMyBid: total > 0 ? bidSum / total : null,
        gamesPlayed,
        seasonRows,
        factionByPlay,
      }
    },
    [`league-player-v4-${username}`],
    {
      revalidate: revalidate,
      tags: ['events', 'games', 'players'],
    },
  )()
}

/** @deprecated use getCachedLeagueAnalytics — kept for imports */
export async function getCachedLeagueSeasonAnalytics(
  scopeKey: string,
  tierFilter: string | null,
  minGames: number,
) {
  return getCachedLeagueAnalytics(scopeKey, tierFilter, minGames)
}
