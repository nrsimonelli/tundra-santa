export const Footer = () => {
  return (
    <div className='fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white'>
      <p className='pointer-events-none p-8'>© {new Date().getFullYear()}</p>
    </div>
  )
}
