import { createClient } from '@/lib/supabase/server'
import {
  parseGameName,
  groupGamesByRound,
  type GameWithParsedName,
} from '@/lib/tournament'
import TournamentBracket from '@/components/tournament-bracket'
import Link from 'next/link'
import { removeYearFromEventName } from '@/lib/utils'

export default async function TournamentPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const eventId = parseInt(params.id, 10)

  if (isNaN(eventId)) {
    return (
      <div className='text-center py-8'>
        <h2 className='text-2xl font-semibold mb-4'>Invalid tournament ID</h2>
        <p className='text-muted-foreground mb-4'>
          The tournament ID must be a valid number.
        </p>
        <Link
          href='/leaderboard'
          className='text-primary hover:underline font-semibold'
        >
          Back to leaderboard
        </Link>
      </div>
    )
  }

  // Fetch event by ID
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, name, start_date, winner, num_players_per_game')
    .eq('id', eventId)
    .single()

  if (eventError || !events) {
    return (
      <div className='text-center py-8'>
        <h2 className='text-2xl font-semibold mb-4'>Tournament not found</h2>
        <p className='text-muted-foreground mb-4'>
          Could not find a tournament with ID {eventId}
        </p>
        <Link
          href='/leaderboard'
          className='text-primary hover:underline font-semibold'
        >
          Back to leaderboard
        </Link>
      </div>
    )
  }

  const event = events

  // Fetch all games for this event (without nested data first)
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, name, created_at')
    .eq('event', event.id)
    .order('created_at', { ascending: true })

  if (gamesError) {
    return (
      <div className='text-center py-8'>
        <h2 className='text-2xl font-semibold mb-4'>Error loading games</h2>
        <p className='text-muted-foreground mb-4'>{gamesError.message}</p>
        <Link
          href='/leaderboard'
          className='text-primary hover:underline font-semibold'
        >
          Back to leaderboard
        </Link>
      </div>
    )
  }

  if (!games || games.length === 0) {
    // No games found, but tournament exists
    const winnerName = await getWinnerName(supabase, event.winner)
    return (
      <div className='flex flex-col space-y-8'>
        <TournamentHeader event={event} winnerName={winnerName} />
        <div className='text-center py-8 text-muted-foreground'>
          No games have been recorded for this tournament yet.
        </div>
        <div className='pt-4 border-t'>
          <Link
            href='/leaderboard'
            className='text-primary hover:underline font-semibold'
          >
            ← Back to leaderboard
          </Link>
        </div>
      </div>
    )
  }

  // Get all participation data for these games
  const gameIds = games.map((g) => g.id)

  // Supabase has limits on .in() queries (typically 100-1000 items)
  // Batch the queries if we have too many game IDs to avoid hitting limits
  const BATCH_SIZE = 100
  let participationData: any[] = []
  let participationError: any = null

  // Query in batches
  for (let i = 0; i < gameIds.length; i += BATCH_SIZE) {
    const batch = gameIds.slice(i, i + BATCH_SIZE)

    // Use simple query (more reliable for large batches than nested queries)
    const simpleResult = await supabase
      .from('game_participation')
      .select('game, player, ranking, final_score, faction, player_mat')
      .in('game', batch)

    if (simpleResult.error) {
      console.error(
        `Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
        simpleResult.error
      )
      participationError = simpleResult.error
      continue
    }

    if (simpleResult.data) {
      participationData.push(...simpleResult.data)
    }
  }

  // Now fetch players separately for all participations
  if (participationData.length > 0) {
    const playerIds = Array.from(
      new Set(
        participationData
          .map((p: any) => p.player)
          .filter((id: any) => id != null)
      )
    )

    // Batch player queries too if needed
    const playersMap = new Map<number, any>()
    for (let i = 0; i < playerIds.length; i += BATCH_SIZE) {
      const batch = playerIds.slice(i, i + BATCH_SIZE)
      const playersResult = await supabase
        .from('players')
        .select('id, username')
        .in('id', batch)

      if (playersResult.data) {
        playersResult.data.forEach((p: any) => {
          playersMap.set(p.id, p)
        })
      }
    }

    // Combine the data
    participationData = participationData.map((p: any) => ({
      ...p,
      player: playersMap.get(p.player) || null,
    }))
  }

  if (participationError) {
    return (
      <div className='text-center py-8'>
        <h2 className='text-2xl font-semibold mb-4'>Error loading game data</h2>
        <p className='text-muted-foreground mb-4'>
          {participationError.message}
        </p>
        <Link
          href='/leaderboard'
          className='text-primary hover:underline font-semibold'
        >
          Back to leaderboard
        </Link>
      </div>
    )
  }

  // Group participation by game ID
  const participationByGame = new Map<number, Array<any>>()
  if (participationData) {
    for (const participation of participationData) {
      const gameId = participation.game
      if (!participationByGame.has(gameId)) {
        participationByGame.set(gameId, [])
      }
      participationByGame.get(gameId)!.push(participation)
    }
  }

  // Store duplicate game names for debug display
  const gamesByNameWithParticipation = new Map<
    string,
    { with: number[]; without: number[] }
  >()
  games.forEach((g) => {
    const name = g.name || 'unnamed'
    if (!gamesByNameWithParticipation.has(name)) {
      gamesByNameWithParticipation.set(name, { with: [], without: [] })
    }
    const entry = gamesByNameWithParticipation.get(name)!
    if (participationByGame.has(g.id)) {
      entry.with.push(g.id)
    } else {
      entry.without.push(g.id)
    }
  })

  // Map games with their participants
  // Filter to only show games that have participants OR deduplicate by name (keep first with participants)
  const gamesWithParticipants: GameWithParsedName[] = []
  const seenGameNames = new Map<string, boolean>() // Track which game names we've seen with participants

  for (const game of games) {
    const participations = participationByGame.get(game.id) || []

    // Map participations to the expected format
    const participants = participations
      .map((p: any) => {
        // Handle player data - could be object, array, or null
        let player = p.player

        // If player is an array (shouldn't happen, but handle it)
        if (Array.isArray(player)) {
          player = player[0] || null
        }

        // If player is a number (foreign key ID), skip it
        if (typeof player === 'number') {
          return null
        }

        if (!player || !player.id || !player.username) {
          return null // Skip invalid players
        }

        return {
          player: {
            id: player.id,
            username: player.username,
          },
          ranking: p.ranking,
          final_score: p.final_score,
          faction: p.faction,
          player_mat: p.player_mat,
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null) // Only include participations with valid players

    const gameName = game.name || 'unnamed'

    // Only include games that have participants
    // If multiple games have the same name, only include the first one with participants
    if (participants.length > 0) {
      if (!seenGameNames.has(gameName)) {
        seenGameNames.set(gameName, true)
        gamesWithParticipants.push({
          id: game.id,
          name: game.name,
          parsed: parseGameName(game.name),
          participants,
        })
      }
    }
  }

  // Group games by round
  const rounds = groupGamesByRound(gamesWithParticipants)

  // Fetch winner info if available
  const winnerName = await getWinnerName(supabase, event.winner)

  return (
    <div className='flex flex-col space-y-8'>
      <TournamentHeader event={event} winnerName={winnerName} />

      {/* Bracket */}
      {rounds.length > 0 ? (
        <TournamentBracket rounds={rounds} />
      ) : (
        <div className='text-center py-8 text-muted-foreground'>
          No games have been recorded for this tournament yet.
        </div>
      )}

      {/* Navigation */}
      <div className='pt-4 border-t'>
        <Link
          href='/leaderboard'
          className='text-primary hover:underline font-semibold'
        >
          ← Back to leaderboard
        </Link>
      </div>
    </div>
  )
}

// Helper function to fetch winner name
async function getWinnerName(
  supabase: ReturnType<typeof createClient>,
  winnerId: number | null
): Promise<string | null> {
  if (!winnerId) return null

  const { data: winnerData } = await supabase
    .from('players')
    .select('username')
    .eq('id', winnerId)
    .single()

  return winnerData?.username || null
}

// Tournament header component
function TournamentHeader({
  event,
  winnerName,
}: {
  event: {
    name: string | null
    start_date: string | null
    num_players_per_game: number | null
  }
  winnerName: string | null
}) {
  return (
    <div className='space-y-4'>
      <div className='inline-flex text-3xl font-semibold space-x-2 w-full justify-start md:justify-center'>
        <p>Tournament:</p>
        <p className='text-transparent bg-clip-text bg-gradient-to-tr to-[#0acffe] from-[#495aff] select-none'>
          {removeYearFromEventName(event.name)}
        </p>
      </div>

      <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
        {event.start_date && (
          <div>
            <span className='font-semibold'>Start Date: </span>
            {new Date(event.start_date).toLocaleDateString()}
          </div>
        )}
        {winnerName && (
          <div>
            <span className='font-semibold'>Winner: </span>
            <Link
              href={`/leaderboard/${encodeURIComponent(winnerName)}`}
              className='text-primary hover:underline'
            >
              {winnerName}
            </Link>
          </div>
        )}
        {event.num_players_per_game && (
          <div>
            <span className='font-semibold'>Players per Game: </span>
            {event.num_players_per_game}
          </div>
        )}
      </div>
    </div>
  )
}
