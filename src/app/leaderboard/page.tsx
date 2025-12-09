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
import { ClickableTableRow } from '@/components/clickable-table-row'

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
            <ClickableTableRow
              key={player.id}
              href={`/leaderboard/${encodeURIComponent(player.username)}`}
            >
              <TableCell>{index + 1}</TableCell>
              <TableCell>{player.username}</TableCell>
              <TableCell>
                {ordinal != null ? Math.round(ordinal) : 'N/A'}
              </TableCell>
            </ClickableTableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
