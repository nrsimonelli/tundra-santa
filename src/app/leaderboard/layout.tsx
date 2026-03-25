export default function LeaderboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className='max-w-5xl mx-auto shadow-lg -mt-20 z-10 bg-card rounded-md p-6'>
      {children}
    </div>
  )
}
