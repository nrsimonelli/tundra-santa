import { createClient } from '@/lib/supabase/server'

export type Finalist = {
  id: number
  username: string
}

export type TournamentWithDetails = {
  id: number
  name: string | null
  start_date: string | null
  num_players_per_game: number | null
  bid: boolean | null
  draft: boolean | null
  rating_event: boolean | null
  winner: number | null
  winner_name: string | null
  player_count: number
  finalists: Finalist[]
}

type Event = {
  id: number
  name: string | null
  start_date: string | null
  num_players_per_game: number | null
  bid: boolean | null
  draft: boolean | null
  rating_event: boolean | null
  winner: number | null
}

/**
 * Checks if a game name matches common finals patterns
 */
function isFinalsGame(gameName: string | null): boolean {
  if (!gameName) return false
  const nameLower = gameName.toLowerCase()
  return (
    nameLower.includes('final') ||
    nameLower.startsWith('ff') ||
    nameLower.includes('finals')
  )
}

/**
 * Finds the finals game for an event by checking the last 2 games
 */
async function findFinalsGame(
  supabase: ReturnType<typeof createClient>,
  eventId: number
): Promise<{ id: number; name: string | null } | null> {
  const { data: lastGames } = await supabase
    .from('games')
    .select('id, name, created_at')
    .eq('event', eventId)
    .order('created_at', { ascending: false })
    .limit(2)

  if (!lastGames || lastGames.length === 0) return null

  // Try the last game first
  let finalsGame = lastGames[0]
  if (isFinalsGame(finalsGame.name)) {
    return finalsGame
  }

  // Try the second to last game
  if (lastGames.length > 1) {
    finalsGame = lastGames[1]
    if (isFinalsGame(finalsGame.name)) {
      return finalsGame
    }
  }

  return null
}

/**
 * Gets finalists for an event by finding the finals game and its participants
 */
async function getFinalistsForEvent(
  supabase: ReturnType<typeof createClient>,
  eventId: number
): Promise<Finalist[]> {
  const finalsGame = await findFinalsGame(supabase, eventId)
  if (!finalsGame) return []

  // Get participants from the finals game
  const { data: participation } = await supabase
    .from('game_participation')
    .select('player')
    .eq('game', finalsGame.id)

  if (!participation || participation.length === 0) return []

  // Get unique player IDs
  const playerIds = Array.from(
    new Set(
      participation
        .map((p) => p.player)
        .filter((id): id is number => id !== null)
    )
  )

  if (playerIds.length === 0) return []

  // Fetch player usernames
  const { data: players } = await supabase
    .from('players')
    .select('id, username')
    .in('id', playerIds)

  if (!players || players.length === 0) return []

  // Create finalists list
  return players.map((p) => ({
    id: p.id,
    username: p.username,
  }))
}

/**
 * Counts unique players per event from event_participation table
 */
async function getPlayerCountsByEvent(
  supabase: ReturnType<typeof createClient>,
  eventIds: number[]
): Promise<Map<number, number>> {
  const { data: participationData } = await supabase
    .from('event_participation')
    .select('event, player')
    .in('event', eventIds)

  const playerCounts = new Map<number, Set<number>>()
  participationData?.forEach((p) => {
    if (!playerCounts.has(p.event)) {
      playerCounts.set(p.event, new Set())
    }
    playerCounts.get(p.event)!.add(p.player)
  })

  const playerCountMap = new Map<number, number>()
  playerCounts.forEach((players, eventId) => {
    playerCountMap.set(eventId, players.size)
  })

  return playerCountMap
}

/**
 * Gets winner names for events
 */
async function getWinnerNames(
  supabase: ReturnType<typeof createClient>,
  events: Event[]
): Promise<Map<number, string>> {
  const winnerIds = events
    .map((e) => e.winner)
    .filter((id): id is number => id !== null)

  const winnerMap = new Map<number, string>()

  if (winnerIds.length > 0) {
    const { data: winners } = await supabase
      .from('players')
      .select('id, username')
      .in('id', winnerIds)

    winners?.forEach((w) => {
      winnerMap.set(w.id, w.username)
    })
  }

  return winnerMap
}

/**
 * Fetches all tournament data including player counts, winners, and finalists
 */
export async function getAllTournamentsWithDetails(): Promise<{
  tournaments: TournamentWithDetails[]
  error: Error | null
  lastUpdated: string | null
}> {
  const supabase = createClient()

  try {
    // Fetch all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(
        'id, name, start_date, num_players_per_game, bid, draft, rating_event, winner'
      )
      .order('start_date', { ascending: false })

    if (eventsError) {
      return { tournaments: [], error: eventsError, lastUpdated: null }
    }

    if (!events || events.length === 0) {
      return { tournaments: [], error: null, lastUpdated: null }
    }

    // Get the most recent game's created_at date as the last updated date
    const { data: mostRecentGame } = await supabase
      .from('games')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const lastUpdated = mostRecentGame?.created_at || null

    const eventIds = events.map((e) => e.id)

    // Get player counts, winners, and finalists in parallel
    const [playerCountMap, winnerMap] = await Promise.all([
      getPlayerCountsByEvent(supabase, eventIds),
      getWinnerNames(supabase, events),
    ])

    // Get finalists for events with more than 2 players
    const eventsWithMultiplePlayers = events.filter(
      (e) => e.num_players_per_game && e.num_players_per_game > 2
    )

    const finalistsByEvent = new Map<number, Finalist[]>()
    for (const event of eventsWithMultiplePlayers) {
      const finalists = await getFinalistsForEvent(supabase, event.id)
      if (finalists.length > 0) {
        finalistsByEvent.set(event.id, finalists)
      }
    }

    // Combine all data
    const tournaments: TournamentWithDetails[] = events.map((event) => ({
      id: event.id,
      name: event.name,
      start_date: event.start_date,
      num_players_per_game: event.num_players_per_game,
      bid: event.bid,
      draft: event.draft,
      rating_event: event.rating_event,
      winner: event.winner,
      winner_name: event.winner ? winnerMap.get(event.winner) || null : null,
      player_count: playerCountMap.get(event.id) || 0,
      finalists: finalistsByEvent.get(event.id) || [],
    }))

    return { tournaments, error: null, lastUpdated }
  } catch (error) {
    return {
      tournaments: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
      lastUpdated: null,
    }
  }
}

