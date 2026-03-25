/**
 * Stable DOM id / URL hash for league-format game names, aligned with
 * parseLeagueGameName in tournament.ts.
 */
export function leagueGameCardDomId(
  gameName: string | null,
  gameId: number,
): string {
  if (!gameName) return `game-by-id-${gameId}`
  const name = gameName.trim()

  const tierWord = name.match(/^Tier\s+(\d+)\s+G(\d+)$/i)
  if (tierWord) {
    return `game-t${tierWord[1]}-g${tierWord[2]}`
  }

  const tShort = name.match(/^T([123])\s+G(\d+)$/i)
  if (tShort) {
    return `game-t${tShort[1]}-g${tShort[2]}`
  }

  return `game-by-id-${gameId}`
}

export function tournamentGameHref(
  eventId: number,
  gameName: string | null,
  gameId: number,
): string {
  const id = leagueGameCardDomId(gameName, gameId)
  return `/tournament/${eventId}#${id}`
}
