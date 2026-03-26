import Link from 'next/link'
import type { LeagueStanding } from '@/lib/supabase/cached-queries'
import { WinRateBar } from '@/components/win-rate-bar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatLeagueBid } from '@/lib/league-format'
import { leaguePlayerProfileHref } from '@/lib/league-links'

export function LeagueStandingsTable({
  standings,
}: {
  standings: LeagueStanding[]
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='text-primary'>Rank</TableHead>
          <TableHead className='text-primary'>Player</TableHead>
          <TableHead className='text-primary'>W-L</TableHead>
          <TableHead className='text-primary'>Win%</TableHead>
          <TableHead className='text-primary'>Games</TableHead>
          <TableHead className='text-primary'>Avg score Δ</TableHead>
          <TableHead className='text-primary'>Avg bid</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {standings.map((row, index) => (
          <TableRow
            key={`league-standings-row-${row.playerId}-${row.username}-${index}`}
          >
            <TableCell>{index + 1}</TableCell>
            <TableCell>
              <Link
                href={leaguePlayerProfileHref(row.username)}
                className='text-primary font-medium hover:underline'
              >
                {row.username}
              </Link>
            </TableCell>
            <TableCell>
              {row.wins}-{row.losses}
            </TableCell>
            <TableCell>
              <WinRateBar rate={row.winRate} />
            </TableCell>
            <TableCell className='tabular-nums'>{row.games}</TableCell>
            <TableCell>{row.avgScoreDiff.toFixed(2)}</TableCell>
            <TableCell>{formatLeagueBid(row.avgBid)}</TableCell>
          </TableRow>
        ))}
        {standings.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className='text-muted-foreground'>
              No players meet the minimum sample for this tier.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
