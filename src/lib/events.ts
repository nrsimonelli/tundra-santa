import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { revalidate } from './cache-config'

export type Event = {
  id: number
  name: string | null
  start_date: string | null
}

export type EventsByYear = Map<number, Event[]>

export async function getEventsByYear(): Promise<{
  eventsByYear: EventsByYear
  sortedYears: number[]
}> {
  return unstable_cache(
    async () => {
      const supabase = await createClient()

      // Fetch all rating events (events that contribute to tournament rating)
      const { data: events } = await supabase
        .from('events')
        .select('id, name, start_date, rating_event')
        .eq('rating_event', true)
        .order('start_date', { ascending: false })

      // Group events by year based on their start_date
      const eventsByYear: EventsByYear = new Map()

      events?.forEach(
        (event: {
          id: number
          name: string | null
          start_date: string | null
          rating_event: boolean | null
        }) => {
          // Skip events without a start_date (can't determine year)
          if (!event.start_date) {
            return
          }
          // Extract year from start_date to categorize the event
          // Use UTC methods to avoid timezone conversion issues
          try {
            const date = new Date(event.start_date)
            // Check if date is valid
            if (isNaN(date.getTime())) {
              return
            }
            // Use UTC methods to get the year from the UTC date, not local timezone
            const year = date.getUTCFullYear()
            if (!eventsByYear.has(year)) {
              eventsByYear.set(year, [])
            }
            eventsByYear.get(year)!.push({
              id: event.id,
              name: event.name,
              start_date: event.start_date,
            })
          } catch (error) {
            console.error(
              `Error parsing date for event ${event.id} (${event.name}): ${event.start_date}`,
              error
            )
          }
        }
      )

      // Sort years in descending order
      const sortedYears = Array.from(eventsByYear.keys()).sort((a, b) => b - a)

      return { eventsByYear, sortedYears }
    },
    ['events-by-year'],
    {
      revalidate: revalidate, // Cache for 1 hour
      tags: ['events'],
    }
  )()
}

export function sortEventsByDate(events: Event[]): Event[] {
  return events.sort((a, b) => {
    // Sort by start_date within the year (ascending - oldest first)
    if (!a.start_date) return 1
    if (!b.start_date) return -1
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  })
}

export function sortEventsByDateDescending(events: Event[]): Event[] {
  return events.sort((a, b) => {
    // Sort by start_date (descending - newest first)
    if (!a.start_date) return 1
    if (!b.start_date) return -1
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  })
}

type EventWithNestedEvent = {
  event?: { start_date: string | null } | null
}

type SortableByEventDate<T> = T extends { start_date: string | null }
  ? T
  : T extends EventWithNestedEvent
  ? T
  : never

function getEventStartDate(item: Event | EventWithNestedEvent): string | null {
  if ('start_date' in item) {
    return item.start_date
  }
  if ('event' in item && item.event) {
    return item.event.start_date
  }
  return null
}

export function sortByEventDate<T extends Event | EventWithNestedEvent>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const dateA = getEventStartDate(a)
    const dateB = getEventStartDate(b)
    if (!dateA) return 1
    if (!dateB) return -1
    return new Date(dateA).getTime() - new Date(dateB).getTime()
  })
}

export function sortByEventDateDescending<
  T extends Event | EventWithNestedEvent
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = getEventStartDate(a)
    const dateB = getEventStartDate(b)
    if (!dateA) return 1
    if (!dateB) return -1
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })
}

export function getMostRecentEvent<T extends Event | EventWithNestedEvent>(
  items: T[]
):
  | (T extends Event ? T : T extends { event?: infer E | null } ? E : never)
  | null {
  if (items.length === 0) return null

  const sorted = sortByEventDateDescending(items)
  const mostRecent = sorted[0]

  if (!mostRecent) return null

  // If it's an Event, return it directly
  if ('start_date' in mostRecent && 'id' in mostRecent) {
    return mostRecent as any
  }

  // If it has a nested event property, return that
  if ('event' in mostRecent && mostRecent.event) {
    return mostRecent.event as any
  }

  return null
}
