/** League IA: player names under /league/** link here first. */
export function leaguePlayerProfileHref(username: string): string {
  return `/league/players/${encodeURIComponent(username)}`
}

/** Global profile — use only as an explicit CTA on the league player page. */
export function globalLeaderboardHref(username: string): string {
  return `/leaderboard/${encodeURIComponent(username)}`
}
