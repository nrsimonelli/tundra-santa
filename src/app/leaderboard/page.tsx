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
import { revalidate as REVALIDATE } from '@/lib/cache-config'

// Next.js requires each route segment to export its own `revalidate` constant.
// We import the shared value and assign it to a local constant so Next.js can statically analyze it.
export const revalidate = REVALIDATE

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
