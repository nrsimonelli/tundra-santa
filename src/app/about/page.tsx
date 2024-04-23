import Image from 'next/image'

export default function About() {
  return (
    <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-6'>
      <div className='space-y-6 max-w-4xl'>
        <div className='space-y-4'>
          <p className='text-3xl font-bold text-primary'>About</p>
          <p>
            Scythe is a competitive 4x board game by Stonemaier games. From its
            critically acclaimed release in 2016, Scythe has established itself
            in the board gaming world for its strategic gameplay & thematic
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
          </p>
        </div>

        <div className='space-y-4'>
          <p className='text-2xl font-bold text-primary'>
            What is Tournament Rating?
          </p>
          <p>
            Tournament Rating is a method of assessing and measuring player
            skill in multiplayer games like Scythe. The working model for
            tournament rating is derived from the{' '}
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
            New players are introduced into the rating system with a default
            rating of 1200. As players continue to compete in games and events
            the system becomes more confident in their skill level and the
            degree to which their rating will change from a single game
            decreases overtime. For more information on the statistical model
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
        </div>
        <div className='space-y-4'>
          <p className='text-3xl font-bold text-primary'>
            What events contribue to Tournament Rating?
          </p>
          <p>
            While we havent been able to collect perfect records of every
            competitive event, organizers and community members have done a
            great job perserving the history of competitive Scythe. Through
            those efforts the following events have been fully recorded and
            processed into the current tournament rating system:
          </p>
          <div className='space-y-2'>
            <p>2020</p>
            <ul>
              <li>First DE tournament</li>
              <li>Second DE tournament</li>
            </ul>
          </div>
          <div className='space-y-2'>
            <p>2021</p>
            <ul>
              <li>Draft kings standard</li>
              <li>Draft kings swiss</li>
              <li>May classic</li>
              <li>Winter cup</li>
            </ul>
          </div>
          <div className='space-y-2'>
            <p>2022</p>
            <ul>
              <li>February draft</li>
              <li>May mashup</li>
              <li>September scenarios</li>
              <li>Factory rush</li>
            </ul>
          </div>
          <div className='space-y-2'>
            <p>2023</p>
            <ul>
              <li>New years tournament</li>
              <li>Factory rush</li>
            </ul>
          </div>
          <div className='space-y-2'>
            <p>2024</p>
            <ul>
              <li>IceBowl</li>
              <li>
                <i>Spring autobidder draft (Upcoming)</i>
              </li>
              <li>
                <i>Factory rush (Upcoming)</i>
              </li>
            </ul>
          </div>
        </div>

        <div className='space-y-4'>
          <p className='text-primary text-2xl font-bold'>
            What about other events?
          </p>
          <p>
            There are plans to expand the rating system to include other event
            formats, most noteably the 1v1 league style events frequently run on
            discord. Currently, the tournament rating system will continue to
            collect the results of 3 and 4 player events as other features are
            developed.
          </p>
        </div>
      </div>
    </div>
  )
}
