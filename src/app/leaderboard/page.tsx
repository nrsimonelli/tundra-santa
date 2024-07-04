import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Leaderboard() {
  const supabase = createClient()
  const { data: players } = await supabase
    .from('players')
    .select()
    .order('current_rating->ordinal', { ascending: false })

  return (
    <Table>
      <TableCaption>Updated July, 2024</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className='text-primary'>Rank</TableHead>
          <TableHead className='text-primary'>Player</TableHead>
          <TableHead className='text-primary'>Rating</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players?.map((player, index) => {
          const ordinal = (player.current_rating as { ordinal: number }).ordinal
          return (
            <TableRow key={player.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Link
                  href={`/leaderboard/${encodeURIComponent(player.username)}`}
                >
                  {player.username}
                </Link>
              </TableCell>
              <TableCell>{Math.round(ordinal)}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
