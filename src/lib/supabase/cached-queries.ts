import { unstable_cache } from 'next/cache'
import { createClient } from './server'
import { revalidate } from '../cache-config'

export async function getCachedPlayers() {
  // Create client outside cached function to avoid accessing cookies() inside cache
  const supabase = await createClient()

  return unstable_cache(
    async () => {
      const { data } = await supabase
        .from('players')
        .select()
        .order('current_rating->ordinal', { ascending: false })
      return data
    },
    ['all-players'],
    {
      revalidate: revalidate,
      tags: ['players'],
    }
  )()
}

export async function getCachedPlayer(username: string) {
  // Create client outside cached function to avoid accessing cookies() inside cache
  const supabase = await createClient()

  return unstable_cache(
    async () => {
      const { data } = await supabase
        .from('players')
        .select(
          `
          id, username, current_rating->ordinal,
          event_participation (
            event: events(id, name, start_date, rating_event, num_players_per_game),
            games_won, updated_rating->ordinal
          )
        `
        )
        .eq('username', username)
        .single()
      return data
    },
    [`player-${username}`],
    {
      revalidate: revalidate,
      tags: ['players', `player-${username}`],
    }
  )()
}

export type NemesisRecord = {
  playerId: number
  score: number
  username: string
  wins: number
  losses: number
  draws: number
  totalGames: number
  mostRecentGame: string
}

export async function getCachedPlayerNemesis(
  playerId: number
): Promise<NemesisRecord[] | null> {
  const supabase = await createClient()

  return unstable_cache(
    async () => {
      // Get all games where this player participated
      const { data: playerGames } = await supabase
        .from('game_participation')
        .select('game, ranking, created_at')
        .eq('player', playerId)

      if (!playerGames || playerGames.length === 0) return null

      const gameIds = playerGames.map((g) => g.game)

      // Get all participants in those games
      const { data: allParticipants } = await supabase
        .from('game_participation')
        .select('game, player, ranking, created_at')
        .in('game', gameIds)

      if (!allParticipants) return null

      // Build a map of game -> player's ranking
      const playerRankingByGame = new Map<number, number | null>()
      playerGames.forEach((g) => {
        playerRankingByGame.set(g.game, g.ranking)
      })

      // Track head-to-head records per opponent
      const records = new Map<
        number,
        { wins: number; losses: number; draws: number; mostRecent: string }
      >()

      allParticipants.forEach((p) => {
        if (p.player === playerId) return

        const myRanking = playerRankingByGame.get(p.game)
        const theirRanking = p.ranking

        let result: 'win' | 'loss' | 'draw'
        if (myRanking === 1) {
          result = 'win'
        } else if (theirRanking === 1) {
          result = 'loss'
        } else {
          result = 'draw'
        }

        const existing = records.get(p.player) || {
          wins: 0,
          losses: 0,
          draws: 0,
          mostRecent: '',
        }

        if (result === 'win') existing.wins++
        else if (result === 'loss') existing.losses++
        else existing.draws++

        if (p.created_at > existing.mostRecent) {
          existing.mostRecent = p.created_at
        }

        records.set(p.player, existing)
      })

      // Filter to minimum 5 encounters and calculate scores
      const candidates: {
        playerId: number
        score: number
        wins: number
        losses: number
        draws: number
        totalGames: number
        mostRecentGame: string
      }[] = []

      records.forEach((record, opponentId) => {
        const totalGames = record.wins + record.losses + record.draws
        if (totalGames < 5) return

        const score = record.wins * record.losses + record.draws
        candidates.push({
          playerId: opponentId,
          score,
          wins: record.wins,
          losses: record.losses,
          draws: record.draws,
          totalGames,
          mostRecentGame: record.mostRecent,
        })
      })

      if (candidates.length === 0) return null

      // Sort by score desc, then total games desc, then most recent desc
      candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        if (b.totalGames !== a.totalGames) return b.totalGames - a.totalGames
        return b.mostRecentGame.localeCompare(a.mostRecentGame)
      })

      // Return top 3 nemeses
      const nemeses = candidates.slice(0, 3)

      // Fetch usernames
      const nemesisIds = nemeses.map((n) => n.playerId)
      const { data: players } = await supabase
        .from('players')
        .select('id, username')
        .in('id', nemesisIds)

      if (!players) return null

      const usernameMap = new Map<number, string>()
      players.forEach((p) => usernameMap.set(p.id, p.username))

      return nemeses.map((n) => ({
        ...n,
        username: usernameMap.get(n.playerId) || 'Unknown',
      }))
    },
    [`player-nemesis-${playerId}`],
    {
      revalidate: revalidate,
      tags: ['players', `player-${playerId}`],
    }
  )()
}

export async function getCachedEvent(eventId: number) {
  // Create client outside cached function to avoid accessing cookies() inside cache
  const supabase = await createClient()

  return unstable_cache(
    async () => {
      const { data } = await supabase
        .from('events')
        .select('id, name, start_date, winner, num_players_per_game')
        .eq('id', eventId)
        .single()
      return data
    },
    [`event-${eventId}`],
    {
      revalidate: revalidate,
      tags: ['events', `event-${eventId}`],
    }
  )()
}
