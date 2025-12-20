import { SectionGroup, GameWithParsedName } from '@/lib/tournament'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Crown } from 'lucide-react'
import { FactionImage } from '@/components/faction-image'

interface TournamentBracketProps {
  sections: SectionGroup[]
}

export default function TournamentBracket({
  sections,
}: TournamentBracketProps) {
  if (sections.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No games found for this tournament.
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {sections.map((section) => (
        <Section key={section.sectionKey} section={section} />
      ))}
    </div>
  )
}

function Section({ section }: { section: SectionGroup }) {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between border-b pb-2'>
        <h3 className='text-xl font-semibold text-foreground'>
          {section.sectionLabel}
        </h3>
        <span className='text-sm text-muted-foreground'>
          {section.games.length} game{section.games.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {section.games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  )
}

function GameCard({ game }: { game: GameWithParsedName }) {
  const participants = game.participants
  const participantCount = participants.length

  // Calculate placements for 3p+ games when rank is tied
  const placements = new Map<number, number>()

  if (participantCount >= 3) {
    // Group participants by rank
    const byRank = new Map<
      number,
      Array<{ participant: (typeof participants)[0]; index: number }>
    >()

    participants.forEach((p, idx) => {
      const rank = p.ranking ?? 999
      if (!byRank.has(rank)) {
        byRank.set(rank, [])
      }
      byRank.get(rank)!.push({ participant: p, index: idx })
    })

    // Process ranks in order (1, 2, 3, etc.)
    const sortedRanks = Array.from(byRank.keys()).sort((a, b) => a - b)
    let nextPlacement = 1

    sortedRanks.forEach((rank) => {
      const rankGroup = byRank.get(rank)!

      if (rank === 1) {
        // Rank 1 always gets placement 1
        rankGroup.forEach(({ index }) => {
          placements.set(index, 1)
        })
        nextPlacement = rankGroup.length + 1
      } else if (rankGroup.length === 1) {
        // Single participant with this rank - use rank as placement
        placements.set(rankGroup[0].index, rank)
        nextPlacement = rank + 1
      } else {
        // Multiple participants with same rank - sort by final_score
        const sortedByScore = rankGroup
          .map(({ participant, index }) => ({
            index,
            score: participant.final_score,
          }))
          .sort((a, b) => {
            const scoreA = a.score ?? -Infinity
            const scoreB = b.score ?? -Infinity
            return scoreB - scoreA // Descending
          })

        // Assign placements, handling ties
        let currentPlace = nextPlacement
        let previousScore: number | null = null
        let placementOffset = 0

        sortedByScore.forEach(({ index, score }) => {
          if (score === null) {
            placements.set(index, rank)
          } else {
            if (previousScore !== null && score !== previousScore) {
              // New score tier - increment placement
              placementOffset++
              currentPlace = nextPlacement + placementOffset
            } else if (previousScore === null) {
              // First participant with score
              currentPlace = nextPlacement
            }
            // If score is same as previous, keep same placement (tied)
            placements.set(index, currentPlace)
            previousScore = score
          }
        })

        // Update nextPlacement: count unique score tiers (excluding nulls)
        const uniqueScores = new Set(
          sortedByScore.filter((s) => s.score !== null).map((s) => s.score)
        )
        nextPlacement = nextPlacement + uniqueScores.size
      }
    })
  }

  return (
    <div className='border rounded-lg p-4 bg-card hover:shadow-md transition-shadow'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h4 className='font-semibold text-sm text-foreground'>
            {game.parsed.displayName}
          </h4>
          <span className='text-xs text-muted-foreground'>ID: {game.id}</span>
        </div>
        {participants.length === 0 && (
          <span className='text-xs text-muted-foreground italic'>
            No participants
          </span>
        )}
      </div>

      {participants.length > 0 ? (
        <div className='space-y-2'>
          {participants.map((participant, index) => {
            const isWinner = participant.ranking === 1
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
                      #
                      {placements.has(index)
                        ? placements.get(index)!
                        : participant.ranking ?? '?'}
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
                  {(participant.final_score !== null ||
                    participant.faction ||
                    participant.player_mat) && (
                    <div className='mt-1 flex items-center justify-between flex-wrap text-xs text-muted-foreground'>
                      {participant.faction && participant.player_mat && (
                        <div className='flex items-center gap-1'>
                          <FactionImage
                            faction={participant.faction}
                            width={20}
                            height={20}
                          />
                          <span className='capitalize'>
                            {participant.player_mat}
                          </span>
                        </div>
                      )}
                      {participant.final_score !== null && (
                        <span>{participant.final_score}</span>
                      )}
                    </div>
                  )}
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
