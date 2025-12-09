export default function TournamentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-6'>
      {children}
    </div>
  )
}





