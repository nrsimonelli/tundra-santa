import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getCachedPlayers } from '@/lib/supabase/cached-queries'
import { ClickableTableRow } from '@/components/clickable-table-row'

// Next.js requires each route segment to export its own `revalidate` constant.
// We re-export the shared value here so Next.js can find it in this route file.
export { revalidate } from '@/lib/cache-config'

export default async function Leaderboard() {
  const players = await getCachedPlayers()

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
          const currentRating = player.current_rating as {
            ordinal?: number
          } | null
          const ordinal = currentRating?.ordinal
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
