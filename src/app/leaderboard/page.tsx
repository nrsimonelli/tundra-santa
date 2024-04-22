import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'
import { Json } from '@/types/supabase'

export default async function Leaderboard() {
  const supabase = createClient()
  const { data: players } = await supabase
    .from('players')
    .select()
    .order('current_rating->ordinal', { ascending: false })

  const hasValidOrdinal = (rating: Json) => {
    return (
      typeof rating === 'object' &&
      typeof (rating as { ordinal: number }).ordinal === 'number'
    )
  }

  return (
    <div className='max-w-7xl mx-auto shadow-lg -mt-20 z-10 bg-background rounded-md p-6'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players?.map((player, index) => {
            const ordinal = (player.current_rating as { ordinal: number })
              .ordinal
            return (
              <TableRow key={player.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{player.username}</TableCell>
                <TableCell>{Math.round(ordinal)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
