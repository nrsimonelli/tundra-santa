import { createClient } from '@/lib/supabase/server'

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
  const supabase = createClient()

  // Fetch all rating events (events that contribute to tournament rating)
  const { data: events } = await supabase
    .from('events')
    .select('id, name, start_date, rating_event')
    .eq('rating_event', true)
    .order('start_date', { ascending: false })

  // Debug: Log all fetched events
  console.log('=== ABOUT PAGE DEBUG ===')
  console.log(`Total events fetched: ${events?.length || 0}`)
  events?.forEach((event) => {
    console.log(
      `Event ${event.id}: ${event.name}, start_date: ${event.start_date}, rating_event: ${event.rating_event}`
    )
  })

  // Group events by year based on their start_date
  const eventsByYear: EventsByYear = new Map()

  events?.forEach((event) => {
    // Skip events without a start_date (can't determine year)
    if (!event.start_date) {
      console.log(`Skipping event ${event.id} (${event.name}) - no start_date`)
      return
    }
    // Extract year from start_date to categorize the event
    // Use UTC methods to avoid timezone conversion issues
    try {
      const date = new Date(event.start_date)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log(
          `Skipping event ${event.id} (${event.name}) - invalid start_date: ${event.start_date}`
        )
        return
      }
      // Use UTC methods to get the year from the UTC date, not local timezone
      const year = date.getUTCFullYear()
      console.log(
        `Event ${event.id} (${event.name}): year = ${year} from start_date ${event.start_date} (UTC)`
      )
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
  })

  // Debug: Log grouped events
  console.log('Events grouped by year:')
  eventsByYear.forEach((yearEvents, year) => {
    console.log(
      `  ${year}: ${yearEvents.length} event(s) - IDs: [${yearEvents
        .map((e) => e.id)
        .join(', ')}]`
    )
  })

  // Sort years in descending order
  const sortedYears = Array.from(eventsByYear.keys()).sort((a, b) => b - a)

  return { eventsByYear, sortedYears }
}

export function sortEventsByDate(events: Event[]): Event[] {
  return events.sort((a, b) => {
    // Sort by start_date within the year (ascending - oldest first)
    if (!a.start_date) return 1
    if (!b.start_date) return -1
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  })
}
