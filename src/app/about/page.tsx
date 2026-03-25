import { getEventsByYear, sortEventsByDate, type Event } from '@/lib/events'
import EventLink from '@/components/event-link'
import Link from 'next/link'

// Revalidate every hour to keep event list fresh
export const revalidate = 3600

export default async function About() {
  const { eventsByYear, sortedYears } = await getEventsByYear()
  return (
    <div className='max-w-5xl w-full min-w-0 mx-auto shadow-lg -mt-20 z-10 bg-card rounded-md px-4 py-6 sm:px-6 md:px-8 md:py-8 border'>
      <div className='space-y-8 max-w-4xl leading-relaxed'>
        <div className='space-y-4'>
          <h1 className='text-2xl md:text-3xl font-semibold tracking-tight text-primary'>
            About
          </h1>
          <p>
            Scythe is a competitive 4x board game by Stonemaier Games. From its
            critically acclaimed release in 2016, Scythe has established itself
            in the board gaming world for its strategic gameplay and thematic
            design elements alike. With its depth of engine-building, asymmetric
            design, and 1920+ world, Scythe is often referenced as one of the
            best games ever made.
          </p>
          <p>
            In competitive settings, Scythe is played with 2 to 4 players and
            commonly utilizes bidding or drafting as a form of game balance.
            While many different types of events have been run since the initial
            release, the leading provider for competitive Scythe events
            continues to be the community run{' '}
            <a
              className='pointer-events-auto text-primary font-semibold'
              href='https://discord.gg/HRvysu2QT2'
              target='_blank'
              rel='noopener noreferrer'
            >
              Scythe discord
            </a>
            .
          </p>
        </div>

        <section className='space-y-3'>
          <h2 className='text-xl font-semibold text-primary'>This website</h2>
          <p>
            This app tracks competitive Scythe events and results. Explore{' '}
            <Link
              href='/tournament'
              className='pointer-events-auto text-primary font-semibold hover:underline'
            >
              tournaments
            </Link>
            , browse player pages on the{' '}
            <Link
              href='/leaderboard'
              className='pointer-events-auto text-primary font-semibold hover:underline'
            >
              leaderboard
            </Link>
            , and review 1v1 League seasons under the{' '}
            <Link
              href='/league'
              className='pointer-events-auto text-primary font-semibold hover:underline'
            >
              League
            </Link>{' '}
            section.
          </p>
        </section>

        <section className='space-y-3'>
          <h2 className='text-xl font-semibold text-primary'>
            What is Tournament Rating?
          </h2>
          <p>
            Tournament Rating is a method of assessing and measuring player
            skill in multiplayer games like Scythe. The working model for
            Tournament Rating is derived from the{' '}
            <a
              className='pointer-events-auto text-primary font-semibold'
              href='https://openskill.me/en/stable/index.html'
              target='_blank'
              rel='noopener noreferrer'
            >
              openskill
            </a>{' '}
            library, a multiplayer rating library which provides statistical
            models when analyzing the results of competitive multiplayer games.
            With Scythe tournaments being played in a variety of formats, this
            modeling system is a great fit for the competitive Scythe community.
          </p>
          <p>
            In this app, the leaderboard rating is calculated from 3- and
            4-player events (2-player events are tracked as tournaments, but do
            not affect the leaderboard rating).
          </p>
          <p>
            New players are introduced into the rating system with a default
            rating of 1200. As players continue to compete in games and events
            the system becomes more confident in their skill level and the
            degree to which their rating will change from a single game
            decreases over time. For more information on the statistical model
            behind the rating system, reference the{' '}
            <a
              className='pointer-events-auto text-primary font-semibold'
              href='https://openskill.me/en/stable/manual.html'
              target='_blank'
              rel='noopener noreferrer'
            >
              PlackettLuce
            </a>{' '}
            model from openskill.
          </p>
        </section>
        <section className='space-y-3'>
          <h2 className='text-xl font-semibold text-primary'>
            Which events affect Tournament Rating?
          </h2>
          <p>
            While we may not have perfect records of every competitive event,
            the events listed below are those currently flagged in the database
            as rating events. They are grouped by year and form the input set
            for the Tournament Rating system.
          </p>
          {sortedYears.length > 0 ? (
            sortedYears.map((year: number) => {
              const yearEvents = sortEventsByDate(eventsByYear.get(year) || [])
              return (
                <div key={year} className='space-y-2'>
                  <p className='font-semibold'>{year}</p>
                  <ul className='list-disc list-inside space-y-1'>
                    {yearEvents.map((event: Event) => (
                      <li key={event.id}>
                        <EventLink
                          eventId={event.id}
                          eventName={event.name}
                          className='text-primary hover:underline'
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })
          ) : (
            <p className='text-muted-foreground'>
              No rating events found in the database.
            </p>
          )}
        </section>

        <section className='space-y-3'>
          <h2 className='text-xl font-semibold text-primary'>
            What about 1v1 League?
          </h2>
          <p>
            1v1 League seasons are tracked separately in the{' '}
            <Link
              href='/league'
              className='pointer-events-auto text-primary font-semibold hover:underline'
            >
              League
            </Link>{' '}
            section. Use those pages to review league standings, player history,
            and matchup stats for each season and tier.
          </p>
        </section>
      </div>
    </div>
  )
}
