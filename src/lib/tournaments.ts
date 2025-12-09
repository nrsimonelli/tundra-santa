import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { revalidate } from './cache-config'

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
  games_count: number
  finalists: Finalist[]
}

type TournamentEvent = {
  id: number
  name: string | null
  start_date: string | null
  num_players_per_game: number | null
  bid: boolean | null
  draft: boolean | null
  rating_event: boolean | null
  winner: number | null
}

function isFinalsGame(gameName: string | null): boolean {
  if (!gameName) return false
  const nameLower = gameName.toLowerCase()
  return (
    nameLower.includes('final') ||
    nameLower.startsWith('ff') ||
    nameLower.includes('finals')
  )
}

async function findFinalsGame(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

async function getFinalistsForEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
        .map((p: { player: number | null }) => p.player)
        .filter((id: number | null): id is number => id !== null)
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
  return players.map((p: { id: number; username: string }) => ({
    id: p.id,
    username: p.username,
  }))
}

async function getFinalistsFor1v1Event(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: number,
  eventName: string | null
): Promise<Finalist[]> {
  const isLeagueEvent = eventName?.toLowerCase().includes('league') ?? false

  if (isLeagueEvent) {
    // For league events, count wins only from T1 games
    // Get all games for this event where name contains "T1"
    const { data: t1Games } = await supabase
      .from('games')
      .select('id')
      .eq('event', eventId)
      .ilike('name', '%T1%')

    if (!t1Games || t1Games.length === 0) return []

    const t1GameIds = t1Games.map((g: { id: number }) => g.id)

    // Get all game participations for T1 games where ranking = 1 (winners)
    const { data: t1Wins } = await supabase
      .from('game_participation')
      .select(
        `
        player,
        player:players(id, username)
      `
      )
      .in('game', t1GameIds)
      .eq('ranking', 1)

    if (!t1Wins || t1Wins.length === 0) return []

    // Count wins per player
    const winCounts = new Map<
      number,
      { id: number; username: string; wins: number }
    >()

    t1Wins.forEach((win: any) => {
      const player = win.player
      // Handle player data - could be object, array, or null
      let playerData = player
      if (Array.isArray(player)) {
        playerData = player[0] || null
      }
      if (typeof playerData === 'number' || !playerData) {
        return
      }
      if (!playerData.id || !playerData.username) {
        return
      }

      const playerId = playerData.id
      const current = winCounts.get(playerId)
      if (current) {
        current.wins += 1
      } else {
        winCounts.set(playerId, {
          id: playerData.id,
          username: playerData.username,
          wins: 1,
        })
      }
    })

    if (winCounts.size === 0) return []

    // Sort by wins descending, then take top 2
    const sortedPlayers = Array.from(winCounts.values()).sort(
      (a, b) => b.wins - a.wins
    )
    const topTwo = sortedPlayers.slice(0, 2)

    // Return as Finalist array
    return topTwo.map((p) => ({
      id: p.id,
      username: p.username,
    }))
  } else {
    // For non-league 1v1 events, use event_participation games_won
    const { data: participation } = await supabase
      .from('event_participation')
      .select(
        `
        player,
        games_won,
        player:players(id, username)
      `
      )
      .eq('event', eventId)

    if (!participation || participation.length === 0) return []

    // Filter out entries without valid player data and map to finalist format
    const playersWithWins = participation
      .map((p: any) => {
        const player = p.player
        // Handle player data - could be object, array, or null
        let playerData = player
        if (Array.isArray(player)) {
          playerData = player[0] || null
        }
        if (typeof playerData === 'number' || !playerData) {
          return null
        }
        if (!playerData.id || !playerData.username) {
          return null
        }
        return {
          id: playerData.id,
          username: playerData.username,
          games_won: p.games_won ?? 0,
        }
      })
      .filter(
        (p): p is { id: number; username: string; games_won: number } =>
          p !== null
      )

    if (playersWithWins.length === 0) return []

    // Sort by games_won descending, then take top 2
    const sortedPlayers = playersWithWins.sort(
      (a, b) => b.games_won - a.games_won
    )
    const topTwo = sortedPlayers.slice(0, 2)

    // Return as Finalist array
    return topTwo.map((p) => ({
      id: p.id,
      username: p.username,
    }))
  }
}

async function getPlayerCountsByEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventIds: number[]
): Promise<Map<number, number>> {
  const { data: participationData } = await supabase
    .from('event_participation')
    .select('event, player')
    .in('event', eventIds)

  const playerCounts = new Map<number, Set<number>>()
  participationData?.forEach((p: { event: number; player: number }) => {
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

async function getGamesCountsByEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventIds: number[]
): Promise<Map<number, number>> {
  if (eventIds.length === 0) {
    return new Map<number, number>()
  }

  // Fetch event and games_won to sum up total games per event
  const { data: participationData } = await supabase
    .from('event_participation')
    .select('event, games_won')
    .in('event', eventIds)

  const gamesCountMap = new Map<number, number>()

  // Initialize all event IDs to 0 (in case an event has no participation)
  eventIds.forEach((eventId) => {
    gamesCountMap.set(eventId, 0)
  })

  // Sum games_won per event
  participationData?.forEach(
    (p: { event: number; games_won: number | null }) => {
      const currentCount = gamesCountMap.get(p.event) || 0
      const gamesWon = p.games_won ?? 0
      gamesCountMap.set(p.event, currentCount + gamesWon)
    }
  )

  return gamesCountMap
}

async function getWinnerNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  events: TournamentEvent[]
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

    winners?.forEach((w: { id: number; username: string }) => {
      winnerMap.set(w.id, w.username)
    })
  }

  return winnerMap
}

export async function getAllTournamentsWithDetails(): Promise<{
  tournaments: TournamentWithDetails[]
  error: Error | null
  lastUpdated: string | null
}> {
  return unstable_cache(
    async () => {
      const supabase = await createClient()

      try {
        // Fetch all events
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select(
            'id, name, start_date, num_players_per_game, bid, draft, rating_event, winner'
          )
          .order('start_date', { ascending: false })

        if (eventsError) {
          return {
            tournaments: [],
            error:
              eventsError instanceof Error
                ? eventsError
                : new Error(
                    (eventsError as { message?: string }).message ||
                      String(eventsError) ||
                      'Unknown error'
                  ),
            lastUpdated: null,
          }
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

        const eventIds = events.map((e: TournamentEvent) => e.id)

        // Get player counts, games counts, winners, and finalists in parallel
        const [playerCountMap, gamesCountMap, winnerMap] = await Promise.all([
          getPlayerCountsByEvent(supabase, eventIds),
          getGamesCountsByEvent(supabase, eventIds),
          getWinnerNames(supabase, events),
        ])

        // Get finalists for events with more than 2 players
        const eventsWithMultiplePlayers = events.filter(
          (e: TournamentEvent) =>
            e.num_players_per_game && e.num_players_per_game > 2
        )

        // Get finalists for 1v1 events (2 players per game)
        const eventsWith1v1 = events.filter(
          (e: TournamentEvent) => e.num_players_per_game === 2
        )

        // Fetch all finalists in parallel for better performance
        const finalistsPromises = [
          ...eventsWithMultiplePlayers.map(async (event: TournamentEvent) => {
            const finalists = await getFinalistsForEvent(supabase, event.id)
            return { eventId: event.id, finalists }
          }),
          ...eventsWith1v1.map(async (event: TournamentEvent) => {
            const finalists = await getFinalistsFor1v1Event(
              supabase,
              event.id,
              event.name
            )
            return { eventId: event.id, finalists }
          }),
        ]

        const finalistsResults = await Promise.all(finalistsPromises)
        const finalistsByEvent = new Map<number, Finalist[]>()
        finalistsResults.forEach(({ eventId, finalists }) => {
          if (finalists.length > 0) {
            finalistsByEvent.set(eventId, finalists)
          }
        })

        // Combine all data
        const tournaments: TournamentWithDetails[] = events.map(
          (event: TournamentEvent) => ({
            id: event.id,
            name: event.name,
            start_date: event.start_date,
            num_players_per_game: event.num_players_per_game,
            bid: event.bid,
            draft: event.draft,
            rating_event: event.rating_event,
            winner: event.winner,
            winner_name: event.winner
              ? winnerMap.get(event.winner) || null
              : null,
            player_count: playerCountMap.get(event.id) || 0,
            games_count: gamesCountMap.get(event.id) || 0,
            finalists: finalistsByEvent.get(event.id) || [],
          })
        )

        return { tournaments, error: null, lastUpdated }
      } catch (error) {
        return {
          tournaments: [],
          error: error instanceof Error ? error : new Error('Unknown error'),
          lastUpdated: null,
        }
      }
    },
    ['all-tournaments-with-details'],
    {
      revalidate: revalidate,
      tags: ['tournaments'],
    }
  )()
}
