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
