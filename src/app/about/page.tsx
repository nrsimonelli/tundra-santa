import Image from 'next/image'

export default function About() {
  return (
    <div className='max-w-7xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-6 space-y-4'>
      {/* h1 */}
      <p className='text-3xl font-bold text-primary'>About</p>
      <p>
        Scythe is a multiplayer 4X game set in an alternate-history 1920s
        period. The game was designed by Jamey Stegmaier with the world designed
        by Jakub Rozalski. Gameplay is asymetric by design, with each faction
        having unique abilities, starting resources, and positions. Beyond the
        excellent design and world building, the game of Scythe is renoun for
        its focus on engine building, resource management, and overall strategic
        depth.
      </p>
      <p>
        Competitive community organized events have been run through the digital
        edition implementation of Scythe and continue to be held to this day.
      </p>
      {/* h2 */}
      <p className='text-2xl font-bold text-primary'>
        What is Tournament Rating?
      </p>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo
        praesentium est commodi nemo? Repudiandae obcaecati similique cumque
        veritatis exercitationem laboriosam aliquam, dignissimos culpa in itaque
        sed esse quia iusto omnis?
      </p>
      <p className='text-2xl text-primary font-bold'>
        How is tournament rating calculated?
      </p>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo
        praesentium est commodi nemo? Repudiandae obcaecati similique cumque
        veritatis exercitationem laboriosam aliquam, dignissimos culpa in itaque
        sed esse quia iusto omnis?
      </p>
    </div>
  )
}
