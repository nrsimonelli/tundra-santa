import { SectionGroup, GameWithParsedName } from '@/lib/tournament'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Crown } from 'lucide-react'

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
  // Deduplicate participants by player ID
  const uniqueParticipants = new Map<number, (typeof game.participants)[0]>()
  game.participants.forEach((participant) => {
    const playerId = participant.player?.id
    if (playerId) {
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

  // Sort participants by ranking
  const sortedParticipants = Array.from(uniqueParticipants.values()).sort(
    (a, b) => {
      const rankA = a.ranking ?? 999
      const rankB = b.ranking ?? 999
      return rankA - rankB
    }
  )

  return (
    <div className='border rounded-lg p-4 bg-card hover:shadow-md transition-shadow'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h4 className='font-semibold text-sm text-foreground'>
            {game.parsed.displayName}
          </h4>
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
