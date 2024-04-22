import Image from 'next/image'

export const Footer = () => {
  return (
    <div className='fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white'>
      {/* <a
        className='pointer-events-none flex place-items-center gap-2 p-8'
        href='https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
        target='_blank'
        rel='noopener noreferrer'
      >
        By{' '}
        <Image
          src='/vercel.svg'
          alt='Vercel Logo'
          className='dark:invert'
          width={100}
          height={24}
          priority
        />
      </a> */}
      {/* add a copyright line that has the current year */}
      <p className='pointer-events-none p-8'>© {new Date().getFullYear()}</p>
    </div>
  )
}
