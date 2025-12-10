import {
  RoundGroup,
  GameWithParsedName,
  getGameDisplayName,
} from '@/lib/tournament'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Crown } from 'lucide-react'

interface TournamentBracketProps {
  rounds: RoundGroup[]
}

export default function TournamentBracket({ rounds }: TournamentBracketProps) {
  if (rounds.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No games found for this tournament.
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {rounds.map((roundGroup) => (
        <RoundSection key={roundGroup.roundKey} roundGroup={roundGroup} />
      ))}
    </div>
  )
}

function RoundSection({ roundGroup }: { roundGroup: RoundGroup }) {
  // Sort games appropriately based on round type
  const sortedGames = [...roundGroup.games].sort((a, b) => {
    const displayA = getGameDisplayName(a, roundGroup.roundLabel)
    const displayB = getGameDisplayName(b, roundGroup.roundLabel)

    // For Finals: sort by game number (Game 1, Game 2, etc.)
    if (roundGroup.roundType === 'finals') {
      const numA = parseInt(displayA.replace(/^Game\s+/i, '')) || 0
      const numB = parseInt(displayB.replace(/^Game\s+/i, '')) || 0
      return numA - numB
    }

    // For Tiers: sort by G number (G1, G2, etc.)
    if (roundGroup.roundType === 'tier') {
      const numA = parseInt(displayA.replace(/^G/i, '')) || 0
      const numB = parseInt(displayB.replace(/^G/i, '')) || 0
      return numA - numB
    }

    // For Semifinals/Quarterfinals/etc. with groups: sort by group letter, then number
    if (
      roundGroup.roundType === 'semifinals' ||
      roundGroup.roundType === 'quarterfinals' ||
      roundGroup.roundType === 'playin' ||
      roundGroup.roundType === 'prequarter'
    ) {
      // Handle Winter Cup elimination format: "A G1", "B G1", "A G2", etc.
      const winterCupElimMatchA = displayA.match(/^([A-Z])\s+G(\d+)$/i)
      const winterCupElimMatchB = displayB.match(/^([A-Z])\s+G(\d+)$/i)

      if (winterCupElimMatchA && winterCupElimMatchB) {
        const groupA = winterCupElimMatchA[1].toUpperCase()
        const groupB = winterCupElimMatchB[1].toUpperCase()
        if (groupA !== groupB) {
          return groupA.localeCompare(groupB)
        }
        const gameNumA = parseInt(winterCupElimMatchA[2])
        const gameNumB = parseInt(winterCupElimMatchB[2])
        return gameNumA - gameNumB
      }

      // Extract group letter and number (e.g., "A1" -> group: "A", num: 1)
      const matchA = displayA.match(/^([A-Z])(\d+)$/i)
      const matchB = displayB.match(/^([A-Z])(\d+)$/i)

      if (matchA && matchB) {
        const groupA = matchA[1].toUpperCase()
        const groupB = matchB[1].toUpperCase()
        if (groupA !== groupB) {
          return groupA.localeCompare(groupB)
        }
        return parseInt(matchA[2]) - parseInt(matchB[2])
      }

      // Fallback: if one has group format and other doesn't, group format comes first
      if (matchA && !matchB) return -1
      if (!matchA && matchB) return 1
    }

    // For regular rounds: sort by round number, then by group/number
    if (roundGroup.roundType === 'group') {
      // Handle "A1", "B1", "A2", "B2" format: sort by group letter first, then by number
      const groupNumMatchA = displayA.match(/^([A-Z])(\d+)$/i)
      const groupNumMatchB = displayB.match(/^([A-Z])(\d+)$/i)

      if (groupNumMatchA && groupNumMatchB) {
        const groupA = groupNumMatchA[1].toUpperCase()
        const groupB = groupNumMatchB[1].toUpperCase()
        if (groupA !== groupB) {
          return groupA.localeCompare(groupB)
        }
        const numA = parseInt(groupNumMatchA[2])
        const numB = parseInt(groupNumMatchB[2])
        return numA - numB
      }

      // Handle Winter Cup format: "A G1", "B G1", "A G2", etc.
      // Sort by group letter first, then by game number
      const winterCupMatchA = displayA.match(/^([A-Z])\s+G(\d+)$/i)
      const winterCupMatchB = displayB.match(/^([A-Z])\s+G(\d+)$/i)

      if (winterCupMatchA && winterCupMatchB) {
        const groupA = winterCupMatchA[1].toUpperCase()
        const groupB = winterCupMatchB[1].toUpperCase()
        if (groupA !== groupB) {
          return groupA.localeCompare(groupB)
        }
        const gameNumA = parseInt(winterCupMatchA[2])
        const gameNumB = parseInt(winterCupMatchB[2])
        return gameNumA - gameNumB
      }

      // Try to extract numbers for natural sorting
      const numA = parseInt(displayA.match(/\d+/)?.[0] || '0') || 0
      const numB = parseInt(displayB.match(/\d+/)?.[0] || '0') || 0
      if (numA !== numB) {
        return numA - numB
      }
    }

    // Default: alphabetical
    return displayA.localeCompare(displayB)
  })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between border-b pb-2'>
        <h3 className='text-xl font-semibold text-foreground'>
          {roundGroup.roundLabel}
        </h3>
        <span className='text-sm text-muted-foreground'>
          {roundGroup.games.length} game
          {roundGroup.games.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Show all games in a grid, sorted by name */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {sortedGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            roundLabel={roundGroup.roundLabel}
            gameNumber={0}
            showGameNumber={false}
          />
        ))}
      </div>
    </div>
  )
}

function GameCard({
  game,
  roundLabel,
  gameNumber,
  showGameNumber,
}: {
  game: GameWithParsedName
  roundLabel: string
  gameNumber: number
  showGameNumber: boolean
}) {
  // Deduplicate participants by player ID (safety check)
  const uniqueParticipants = new Map<number, (typeof game.participants)[0]>()
  game.participants.forEach((participant) => {
    const playerId = participant.player?.id
    if (playerId) {
      // Keep the first occurrence, or prefer one with ranking/score
      if (!uniqueParticipants.has(playerId)) {
        uniqueParticipants.set(playerId, participant)
      } else {
        const existing = uniqueParticipants.get(playerId)!
        // Prefer participant with ranking/score if current one doesn't have it
        if (
          (existing.ranking === null && participant.ranking !== null) ||
          (existing.final_score === null && participant.final_score !== null)
        ) {
          uniqueParticipants.set(playerId, participant)
        }
      }
    }
  })

  // Sort participants by ranking (1 = winner, then 2, 3, etc.)
  const sortedParticipants = Array.from(uniqueParticipants.values()).sort(
    (a, b) => {
      const rankA = a.ranking ?? 999
      const rankB = b.ranking ?? 999
      return rankA - rankB
    }
  )

  const winner = sortedParticipants.find((p) => p.ranking === 1)
  const gameDisplayName = getGameDisplayName(game, roundLabel)

  return (
    <div className='border rounded-lg p-4 bg-card hover:shadow-md transition-shadow'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h4 className='font-semibold text-sm text-foreground'>
            {gameDisplayName}
          </h4>
          {/* Show game ID if there are multiple games with same name */}
          <span className='text-xs text-muted-foreground'>ID: {game.id}</span>
        </div>
        {sortedParticipants.length === 0 && (
          <span className='text-xs text-muted-foreground italic'>
            No participants
          </span>
        )}
      </div>

      {sortedParticipants.length > 0 ? (
        <div className='space-y-2'>
          {sortedParticipants.map((participant, index) => {
            const isWinner = participant.ranking === 1
            // Use a composite key to ensure uniqueness even if player.id is duplicated
            const participantKey = participant.player?.id
              ? `${game.id}-${participant.player.id}-${index}`
              : `${game.id}-participant-${index}`

            return (
              <div
                key={participantKey}
                className={cn(
                  'flex items-center justify-between p-2 rounded',
                  isWinner
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted/50'
                )}
              >
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span
                      className={cn(
                        'text-xs font-medium whitespace-nowrap',
                        isWinner ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      #{participant.ranking ?? '?'}
                    </span>
                    {participant.player?.username ? (
                      <Link
                        href={`/leaderboard/${encodeURIComponent(
                          participant.player.username
                        )}`}
                        className={cn(
                          'font-medium truncate hover:underline',
                          isWinner
                            ? 'text-primary font-semibold'
                            : 'text-foreground'
                        )}
                        title={participant.player.username}
                      >
                        {participant.player.username}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          'font-medium truncate',
                          isWinner
                            ? 'text-primary font-semibold'
                            : 'text-foreground'
                        )}
                        title='Unknown Player'
                      >
                        Unknown Player
                      </span>
                    )}
                    {isWinner && (
                      <Crown className='h-3 w-3 text-primary flex-shrink-0' />
                    )}
                  </div>
                  <div className='mt-1 space-y-0.5'>
                    {participant.final_score !== null && (
                      <div className='text-xs text-muted-foreground'>
                        Score: {participant.final_score}
                      </div>
                    )}
                    {participant.faction && (
                      <div className='text-xs text-muted-foreground'>
                        {participant.faction}
                        {participant.player_mat &&
                          ` • ${participant.player_mat}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className='text-center py-4 text-sm text-muted-foreground'>
          No participants recorded
        </div>
      )}
    </div>
  )
}
